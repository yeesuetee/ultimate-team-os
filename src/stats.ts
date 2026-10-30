export const statTypes = [
  "pass",
  "throwaway",
  "drop",
  "block",
  "ourGoal",
  "theirGoal",
] as const;
export type StatType = (typeof statTypes)[number];
export const statLabels: Record<StatType, string> = {
  pass: "Completed pass",
  throwaway: "Throwaway",
  drop: "Dropped disc",
  block: "Defensive block",
  ourGoal: "We scored",
  theirGoal: "They scored",
};
export interface StatEvent {
  id: string;
  type: StatType;
  playerId?: string;
  at: string;
}
export interface StatSession {
  id: string;
  title: string;
  startedAt: string;
  endedAt?: string;
  example: boolean;
  events: StatEvent[];
}
export const newStatSession = (): StatSession => ({
  id: crypto.randomUUID(),
  title: "Sideline session",
  startedAt: new Date().toISOString(),
  example: false,
  events: [],
});
export function summarizeStats(events: StatEvent[]) {
  const counts = Object.fromEntries(
    statTypes.map((type) => [
      type,
      events.filter((e) => e.type === type).length,
    ]),
  ) as Record<StatType, number>;
  const attempts = counts.pass + counts.throwaway + counts.drop;
  const turnovers = counts.throwaway + counts.drop;
  const completion = attempts
    ? Math.round((counts.pass / attempts) * 100)
    : null;
  let focus = "Watch first. Capture only what you can comfortably see.";
  let evidence =
    "No events recorded yet. Choose team-only capture and start with goals and turnovers if you are coaching alone.";
  if (events.length) {
    focus = "Keep collecting a small, consistent set of events.";
    evidence =
      "There are no recorded throwing turnovers yet. That does not mean none happened.";
  }
  if (turnovers > 0) {
    focus =
      counts.throwaway >= counts.drop
        ? "Next practice: give the thrower an early reset option."
        : "Next practice: slow down and secure the catch.";
    evidence =
      counts.throwaway >= counts.drop
        ? `${counts.throwaway} throwaway${counts.throwaway === 1 ? "" : "s"} and ${counts.drop} drop${counts.drop === 1 ? "" : "s"} recorded. Try a short handler-reset drill; confirm the cause with your own observations.`
        : `${counts.drop} drops and ${counts.throwaway} throwaways recorded. Try a short catch-and-pivot warm-up; the log alone cannot tell you why a catch was missed.`;
  }
  return { counts, attempts, turnovers, completion, focus, evidence };
}
const key = "northstar-solo-stats-v1";
export function loadStats(): StatSession[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(raw))
      return raw.filter(
        (s): s is StatSession =>
          s &&
          typeof s.id === "string" &&
          typeof s.title === "string" &&
          typeof s.startedAt === "string" &&
          Array.isArray(s.events) &&
          s.events.every(
            (e: StatEvent) =>
              e &&
              typeof e.id === "string" &&
              statTypes.includes(e.type) &&
              typeof e.at === "string",
          ),
      );
  } catch {}
  return [];
}
export function saveStats(sessions: StatSession[]) {
  localStorage.setItem(key, JSON.stringify(sessions));
}
export function exampleStats(): StatSession {
  const s = newStatSession();
  s.example = true;
  s.title = "Example · Sunday scrimmage";
  s.endedAt = s.startedAt;
  const sequence: StatType[] = [
    "pass",
    "pass",
    "throwaway",
    "block",
    "pass",
    "ourGoal",
    "theirGoal",
    "pass",
    "drop",
    "pass",
    "pass",
    "ourGoal",
    "throwaway",
    "theirGoal",
  ];
  s.events = sequence.map((type, i) => ({
    id: `example-${i}`,
    type,
    at: new Date(Date.parse(s.startedAt) + i * 15000).toISOString(),
  }));
  return s;
}
export function statsCsv(s: StatSession, names: Record<string, string>) {
  const cell = (v: string) =>
    `"${v.replace(/"/g, '""').replace(/^[=+@-]/, "'$&")}"`;
  return [
    ["Session", "Example data", "Time (UTC)", "Event", "Player (optional)"]
      .map(cell)
      .join(","),
    ...s.events.map((e) =>
      [
        s.title,
        s.example ? "yes" : "no",
        e.at,
        statLabels[e.type],
        e.playerId ? names[e.playerId] || "Unknown player" : "Team only",
      ]
        .map(cell)
        .join(","),
    ),
  ].join("\r\n");
}
