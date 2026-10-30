import {
  drills,
  focuses,
  initialSession,
  observations,
  players,
  type TrainingSession,
  type CoachingObservation,
  type SessionReview,
  type Player,
} from "./data.ts";
export const totalMinutes = (s: TrainingSession) =>
  s.items.reduce((n, i) => n + i.durationMinutes, 0);
export function attendance(roster: Player[]) {
  return {
    confirmed: roster.filter((p) => p.availability === "confirmed"),
    maybe: roster.filter((p) => p.availability === "maybe"),
    unavailable: roster.filter((p) => p.availability === "unavailable"),
  };
}
export function generatePlan(s: TrainingSession): TrainingSession {
  const count = s.attendeeIds.length;
  const eligible = drills.filter(
    (d) =>
      d.minPlayers <= count &&
      (s.fieldSpace === "full" || d.field === "half") &&
      (s.experience !== "beginner" || d.difficulty === "beginner"),
  );
  const matching = eligible.filter(
    (d) =>
      d.tags.includes(s.focus) && d.id !== "warmup" && d.id !== "scrimmage",
  );
  const chosen = [
    eligible.find((d) => d.id === "warmup"),
    ...matching.slice(0, s.intensity === "light" ? 2 : 3),
    eligible.find((d) => d.id === "scrimmage"),
  ].filter((d): d is (typeof drills)[number] => !!d);
  if (!chosen.length) return { ...s, items: [], status: "draft" };
  const weights = chosen.map((d) => d.defaultMinutes),
    sum = weights.reduce((a, b) => a + b, 0);
  let allocated = 0;
  return {
    ...s,
    status: "draft",
    items: chosen.map((d, i) => {
      const minutes =
        i === chosen.length - 1
          ? s.durationMinutes - allocated
          : Math.max(1, Math.floor((s.durationMinutes * weights[i]) / sum));
      allocated += minutes;
      return {
        id: `generated-${i}-${d.id}`,
        drillId: d.id,
        durationMinutes: minutes,
        notes: "",
        order: i,
      };
    }),
  };
}
export function groupPlayers(roster: Player[], mode: string) {
  const list = [...roster];
  if (mode === "position") list.sort((a, b) => a.role.localeCompare(b.role));
  if (mode === "random")
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  if (mode === "position")
    return [
      list.slice(0, Math.ceil(list.length / 2)),
      list.slice(Math.ceil(list.length / 2)),
    ];
  return [
    list.filter((_, i) => i % 2 === 0),
    list.filter((_, i) => i % 2 === 1),
  ];
}
export function recommendations(
  notes: CoachingObservation[],
  reviews: SessionReview[],
) {
  const newest = Math.max(
    ...notes.map((n) => Date.parse(n.createdAt)),
    ...reviews.map((r) => Date.parse(r.createdAt)),
    1,
  );
  return focuses
    .map((focus) => {
      const sources = notes.filter((n) => n.focusArea === focus);
      const contributing = reviews.filter((r) => r.focusAreas.includes(focus));
      return {
        focus,
        sources,
        contributing,
        score:
          sources.reduce(
            (n, o) =>
              n + 1 + 1 / (1 + (newest - Date.parse(o.createdAt)) / 86400000),
            0,
          ) +
          contributing.length * 2,
      };
    })
    .sort((a, b) => b.score - a.score);
}
export interface DemoState {
  version: 1;
  players: Player[];
  session: TrainingSession;
  observations: CoachingObservation[];
  reviews: SessionReview[];
}
export const freshState = (): DemoState =>
  structuredClone({
    version: 1,
    players,
    session: initialSession,
    observations,
    reviews: [
      {
        id: "r1",
        sessionId: "past1",
        outcome: "Partially achieved",
        focusAreas: ["Handler resets"],
        summary:
          "Continuation looked sharper. Keep working on reset timing under pressure.",
        createdAt: "2026-10-25T13:00:00Z",
      },
      {
        id: "r2",
        sessionId: "past2",
        outcome: "Partially achieved",
        focusAreas: ["Defensive marking"],
        summary: "Force discipline held; switches need earlier calls.",
        createdAt: "2026-10-18T13:00:00Z",
      },
    ],
  });
const key = "northstar-demo-v1";
export const demoRepository = {
  load(): DemoState {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "null");
      if (
        raw?.version === 1 &&
        Array.isArray(raw.players) &&
        raw.session?.items?.length &&
        Array.isArray(raw.observations) &&
        Array.isArray(raw.reviews)
      )
        return raw;
    } catch {}
    return freshState();
  },
  save(s: DemoState) {
    localStorage.setItem(key, JSON.stringify(s));
  },
};
