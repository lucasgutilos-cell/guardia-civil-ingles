-- READ ONLY. Run manually and save results before considering 001/002.
select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name in ('profiles','attempts','failure_bank')
order by table_name, ordinal_position;

select c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('profiles','attempts','failure_bank');

select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename in ('profiles','attempts','failure_bank');

select grantee, table_name, privilege_type from information_schema.table_privileges
where table_schema='public' and table_name in ('profiles','attempts','failure_bank');

select tablename, indexname, indexdef from pg_indexes
where schemaname='public' and tablename in ('profiles','attempts','failure_bank');

select user_id, date, mode, count(*) from public.attempts
group by user_id,date,mode having count(*)>1;
select user_id, question_id, count(*) from public.failure_bank
group by user_id,question_id having count(*)>1;

select p.proname,p.prosecdef,pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='merge_question_cycles';

-- Run only if the column exists and is jsonb, as verified above:
-- select id from public.profiles where question_cycles is not null
-- and jsonb_typeof(question_cycles)<>'object';
