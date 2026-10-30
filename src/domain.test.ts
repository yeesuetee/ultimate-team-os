import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attendance,
  freshState,
  generatePlan,
  totalMinutes,
  recommendations,
  groupPlayers,
} from "./domain.ts";
import { drills, focuses } from "./data.ts";
test("seed roster and initial timing reconcile", () => {
  const s = freshState(),
    a = attendance(s.players);
  assert.equal(a.confirmed.length, 18);
  assert.equal(a.maybe.length, 5);
  assert.equal(a.unavailable.length, 5);
  assert.equal(totalMinutes(s.session), 90);
});
test("generated plans respect timing, focus and space across supported constraints", () => {
  const s = freshState();
  for (const focus of focuses)
    for (const durationMinutes of [60, 90, 120])
      for (const fieldSpace of ["half", "full"] as const)
        for (const experience of ["beginner", "mixed", "advanced"])
          for (const count of [2, 6, 18]) {
            const p = generatePlan({
              ...s.session,
              focus,
              durationMinutes,
              fieldSpace,
              experience,
              attendeeIds: s.players.slice(0, count).map((p) => p.id),
            });
            assert.equal(totalMinutes(p), durationMinutes);
            assert.ok(p.items.length);
            for (const item of p.items) {
              const d = drills.find((d) => d.id === item.drillId)!;
              assert.ok(d.minPlayers <= count);
              assert.ok(fieldSpace === "full" || d.field === "half");
              assert.ok(
                experience !== "beginner" || d.difficulty === "beginner",
              );
              assert.ok(item.durationMinutes > 0);
            }
          }
});
test("changing focus changes suitable drills", () => {
  const s = freshState();
  assert.notDeepEqual(
    generatePlan(s.session).items.map((i) => i.drillId),
    generatePlan({ ...s.session, focus: "Defensive marking" }).items.map(
      (i) => i.drillId,
    ),
  );
});
test("recommendation evidence points to actual records and reacts to reviews", () => {
  const s = freshState();
  const result = recommendations(s.observations, s.reviews);
  assert.equal(result[0].focus, "Handler resets");
  assert.ok(result[0].sources.every((o) => s.observations.includes(o)));
  const reviews = Array.from({ length: 10 }, (_, i) => ({
    id: String(i),
    sessionId: "sunday",
    outcome: "Not achieved",
    focusAreas: ["Zone offence"],
    summary: "Work on zone.",
    createdAt: "2026-11-01T12:00:00Z",
  }));
  assert.equal(
    recommendations(s.observations, reviews)[0].focus,
    "Zone offence",
  );
});
test("groupings preserve every player exactly once", () => {
  const roster = freshState().players.filter(
    (p) => p.availability === "confirmed",
  );
  for (const mode of ["balanced", "position", "random"]) {
    const groups = groupPlayers(roster, mode);
    assert.equal(new Set(groups.flat().map((p) => p.id)).size, 18);
    assert.equal(groups[0].length, 9);
    assert.equal(groups[1].length, 9);
  }
});
