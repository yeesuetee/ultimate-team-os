import { test } from "node:test";
import assert from "node:assert/strict";
import {
  summarizeStats,
  exampleStats,
  statsCsv,
  type StatEvent,
} from "./stats.ts";
const events = (types: StatEvent["type"][]): StatEvent[] =>
  types.map((type, i) => ({ id: String(i), type, at: "2026-11-01T01:00:00Z" }));
test("empty log never claims a completion rate or a score-based inference", () => {
  const r = summarizeStats([]);
  assert.equal(r.completion, null);
  assert.equal(r.turnovers, 0);
  assert.equal(r.attempts, 0);
  assert.match(r.evidence, /No events/);
});
test("completion includes only logged pass outcomes, never goals or blocks", () => {
  const r = summarizeStats(
    events([
      "pass",
      "pass",
      "throwaway",
      "drop",
      "ourGoal",
      "theirGoal",
      "block",
    ]),
  );
  assert.equal(r.completion, 50);
  assert.equal(r.attempts, 4);
  assert.equal(r.turnovers, 2);
  assert.equal(r.counts.ourGoal, 1);
  assert.equal(r.counts.theirGoal, 1);
  assert.equal(r.counts.block, 1);
});
test("goals-only capture does not invent pass completion", () =>
  assert.equal(
    summarizeStats(events(["ourGoal", "theirGoal"])).completion,
    null,
  ));
test("undo by removing last event restores prior totals", () => {
  const log = events(["pass", "throwaway"]);
  assert.equal(summarizeStats(log).turnovers, 1);
  assert.equal(summarizeStats(log.slice(0, -1)).turnovers, 0);
});
test("next-step evidence follows the recorded turnover category", () => {
  const r = summarizeStats(events(["drop", "drop", "throwaway"]));
  assert.match(r.focus, /secure the catch/);
  assert.match(r.evidence, /2 drops/);
});
test("example is explicitly labeled and export escapes formulas and quotes", () => {
  const s = exampleStats();
  assert.equal(s.example, true);
  assert.ok(s.endedAt);
  s.title = '=SUM(1,2) "example"';
  const csv = statsCsv(s, {});
  assert.match(csv, /"'=SUM/);
  assert.match(csv, /""example""/);
  assert.match(csv, /"yes"/);
  assert.equal(csv.split("\r\n").length, s.events.length + 1);
});
