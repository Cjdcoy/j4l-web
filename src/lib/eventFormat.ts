// Pure helpers for the events page. Checked by scripts/check-event-format.mjs (run with plain `node`).

const pad = (value: number) => String(value).padStart(2, "0");

// Run times are stored in 20 Hz ticks: one tick is 5 hundredths of a second.
export function formatTicks(ticks: number) {
  if (!Number.isFinite(ticks) || ticks < 0) return "-";
  const hundredths = Math.round(ticks * 5);
  const totalSeconds = Math.floor(hundredths / 100);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const tail = `${pad(totalSeconds % 60)}.${pad(hundredths % 100)}`;
  return hours > 0 ? `${hours}:${pad(minutes)}:${tail}` : `${minutes}:${tail}`;
}

// Minute precision, like the in-game countdown. Returns null once the time has passed.
export function formatCountdown(msLeft: number) {
  if (!(msLeft > 0)) return null;
  if (msLeft < 60_000) return "<1m";
  const totalMinutes = Math.floor(msLeft / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// Board to show before the user picks one: 125 if it has standings, else 250 if it does, else 125.
export function defaultFPS(boards: Array<{ fps: number; standings: unknown[] }>) {
  const has = (fps: number) => boards.some((board) => board.fps === fps && board.standings.length > 0);
  return !has(125) && has(250) ? 250 : 125;
}

type NadeRecord = { nadejumps: number; time_ticks: number };
const nades = (count: number) => `${count} ${count === 1 ? "nade" : "nades"}`;

// A nadejumps record in leaderboard order (nades, then time): "12 nades · 0:40.60".
export function formatRecord(record: NadeRecord) {
  return `${nades(record.nadejumps)} · ${formatTicks(record.time_ticks)}`;
}

// Wanted head to head: fewer nades wins, then less time. A tie keeps the JH #1, so neither is ahead.
export function compareWanted(jh: NadeRecord, j4l: NadeRecord | null): { ahead: "jh" | "j4l" | null; text: string } {
  if (!j4l) return { ahead: "jh", text: "No J4L run yet" };
  const nadeGap = j4l.nadejumps - jh.nadejumps;
  const timeGap = j4l.time_ticks - jh.time_ticks;
  if (nadeGap > 0) {
    const need = `needs ${nadeGap} fewer ${nadeGap === 1 ? "nade" : "nades"}`;
    return { ahead: "jh", text: timeGap < 0 ? `J4L is faster, but ${need}` : `J4L ${need}` };
  }
  if (nadeGap < 0) return { ahead: "j4l", text: `J4L ahead by ${nades(-nadeGap)}` };
  if (timeGap > 0) return { ahead: "jh", text: `Same nades, J4L is ${formatTicks(timeGap)} slower` };
  if (timeGap < 0) return { ahead: "j4l", text: `Same nades, J4L is ${formatTicks(-timeGap)} faster` };
  return { ahead: null, text: "Tied, J4L needs a faster time" };
}
