// Self-check for the events page formatters: `node scripts/check-event-format.mjs` (Node 26 strips TS types).
import assert from "node:assert/strict";
import { defaultFPS, formatCountdown, formatRecord, formatTicks } from "../src/lib/eventFormat.ts";

assert.equal(formatTicks(812), "0:40.60");
assert.equal(formatTicks(0), "0:00.00");
assert.equal(formatTicks(1), "0:00.05");
assert.equal(formatTicks(20 * 61), "1:01.00");
assert.equal(formatTicks(20 * 3600 + 21), "1:00:01.05");
assert.equal(formatTicks(-1), "-");

const minute = 60_000;
assert.equal(formatCountdown(((2 * 24 + 4) * 60 + 13) * minute + 59_000), "2d 4h 13m");
assert.equal(formatCountdown(24 * 60 * minute), "1d 0h 0m");
assert.equal(formatCountdown(65 * minute), "1h 5m");
assert.equal(formatCountdown(5 * minute), "5m");
assert.equal(formatCountdown(59_999), "<1m");
assert.equal(formatCountdown(0), null);
assert.equal(formatCountdown(Number.NaN), null);

const board = (fps, rows) => ({ fps, standings: Array(rows).fill({}) });
assert.equal(defaultFPS([board(125, 2), board(250, 3)]), 125);
assert.equal(defaultFPS([board(125, 0), board(250, 3)]), 250);
assert.equal(defaultFPS([board(250, 1)]), 250);
assert.equal(defaultFPS([board(125, 0), board(250, 0)]), 125);
assert.equal(defaultFPS([]), 125);

assert.equal(formatRecord({ nadejumps: 12, time_ticks: 812 }), "12 nades · 0:40.60");
assert.equal(formatRecord({ nadejumps: 1, time_ticks: 1 }), "1 nade · 0:00.05");
assert.equal(formatRecord({ nadejumps: 0, time_ticks: 20 * 61 }), "0 nades · 1:01.00");

console.log("event format checks passed");
