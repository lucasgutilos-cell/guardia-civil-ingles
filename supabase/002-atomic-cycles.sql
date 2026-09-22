-- MANUAL, additive. Expects profiles.question_cycles jsonb (not text/json).
-- Row locking resolves concurrent merges without a service-role key.
create or replace function public.merge_question_cycles(incoming jsonb)
returns jsonb language plpgsql security invoker set search_path = public
as $$
declare
  saved jsonb; result jsonb := '{}'::jsonb; cycle_key text;
  epoch_key text; old_epoch bigint; new_epoch bigint; chosen jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then raise exception 'Expected cycle object'; end if;
  select coalesce(question_cycles,'{}'::jsonb) into saved
    from public.profiles where id=auth.uid() for update;
  if not found then raise exception 'Profile required'; end if;
  if jsonb_typeof(saved) <> 'object' then raise exception 'Existing cycles require manual migration'; end if;
  for cycle_key in select jsonb_object_keys(saved || incoming) loop
    if (saved ? cycle_key and jsonb_typeof(saved->cycle_key)<>'array')
       or (incoming ? cycle_key and jsonb_typeof(incoming->cycle_key)<>'array') then
      raise exception 'Cycle values must be arrays: %', cycle_key;
    end if;
  end loop;
  for cycle_key in select jsonb_object_keys(saved || incoming) loop
    if left(cycle_key,8)='__epoch:' then continue; end if;
    epoch_key := '__epoch:' || cycle_key;
    old_epoch := coalesce((saved->epoch_key->>0)::bigint,0);
    new_epoch := coalesce((incoming->epoch_key->>0)::bigint,0);
    if new_epoch > old_epoch then chosen := coalesce(incoming->cycle_key,'[]'::jsonb);
    elsif old_epoch > new_epoch then chosen := coalesce(saved->cycle_key,'[]'::jsonb);
    else
      select coalesce(jsonb_agg(value),'[]'::jsonb) into chosen
      from (select distinct value from jsonb_array_elements(
        coalesce(saved->cycle_key,'[]'::jsonb) || coalesce(incoming->cycle_key,'[]'::jsonb))) entries;
    end if;
    result := result || jsonb_build_object(cycle_key,chosen);
    if greatest(old_epoch,new_epoch)>0 then
      result := result || jsonb_build_object(epoch_key,jsonb_build_array(greatest(old_epoch,new_epoch)));
    end if;
  end loop;
  update public.profiles set question_cycles=result where id=auth.uid();
  return result;
end;
$$;
revoke all on function public.merge_question_cycles(jsonb) from public,anon;
grant execute on function public.merge_question_cycles(jsonb) to authenticated;

-- Review duplicates before optionally adding uniqueness. No rows are removed.
select user_id,date,mode,count(*) from public.attempts group by user_id,date,mode having count(*)>1;
-- Run only after reviewing/resolving existing duplicates with a backup:
-- create unique index if not exists gc_attempt_once on public.attempts(user_id,date,mode);
-- failure_bank should already have unique(user_id,question_id), required by upsert.
