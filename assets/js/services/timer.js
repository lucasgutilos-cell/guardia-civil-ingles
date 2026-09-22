export const remainingSeconds = (deadline, now = Date.now()) => Math.max(0, Math.ceil((deadline - now) / 1000));
export const elapsedSeconds = (startedAt, deadline, now = Date.now()) => Math.max(0, Math.floor((Math.min(now, deadline || now) - startedAt) / 1000));
export const englishDuration = total => total * 45;
export function runTimer(state, update, finish) {
  clearInterval(state.timer);
  const tick = () => {
    if (!state.active) return;
    state.timeLeft = remainingSeconds(state.deadline);
    update();
    if (state.timeLeft === 0) {
      clearInterval(state.timer);
      state.timer = null;
      finish(true);
    }
  };
  state.timer = setInterval(tick, 1000);
  tick();
  return tick;
}
