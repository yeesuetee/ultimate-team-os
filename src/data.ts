export type Focus =
  "Handler resets" | "Defensive marking" | "Offensive flow" | "Zone offence";
export const focuses: Focus[] = [
  "Handler resets",
  "Defensive marking",
  "Offensive flow",
  "Zone offence",
];
export interface Player {
  id: string;
  name: string;
  role: "handler" | "cutter" | "hybrid";
  level: "beginner" | "intermediate" | "advanced";
  availability: "confirmed" | "maybe" | "unavailable";
  developmentGoals: string[];
}
export interface Drill {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  minPlayers: number;
  defaultMinutes: number;
  field: "half" | "full";
  equipment: string[];
  objective: string;
  setup: string;
  steps: string[];
  coachingCues: string[];
  variations: { easier: string; harder: string };
  tags: string[];
}
export interface SessionDrill {
  id: string;
  drillId: string;
  durationMinutes: number;
  notes: string;
  order: number;
}
export interface TrainingSession {
  id: string;
  title: string;
  date: string;
  location: string;
  focus: Focus;
  status: "draft" | "published" | "active" | "completed";
  durationMinutes: number;
  fieldSpace: "half" | "full";
  intensity: string;
  experience: string;
  items: SessionDrill[];
  attendeeIds: string[];
}
export interface CoachingObservation {
  id: string;
  sessionId: string;
  playerId?: string;
  focusArea: string;
  note: string;
  createdAt: string;
}
export interface SessionReview {
  id: string;
  sessionId: string;
  outcome: string;
  focusAreas: string[];
  summary: string;
  createdAt: string;
}
const names = [
  "Alex Morgan",
  "Jamie Chen",
  "Sam Rivera",
  "Taylor Brooks",
  "Jordan Lee",
  "Casey Patel",
  "Riley Park",
  "Avery James",
  "Morgan Blake",
  "Drew Wilson",
  "Quinn Davis",
  "Charlie Kim",
  "Finley Scott",
  "Sage Williams",
  "Robin Ellis",
  "Emerson Tan",
  "Harper Reed",
  "Kai Thompson",
  "Rowan Cole",
  "Reese Nguyen",
  "Skyler Ross",
  "Parker Lim",
  "Dakota Lewis",
  "Cameron Bell",
  "Jules Ahmed",
  "Hayden Cruz",
  "Blair Young",
  "Devon Shaw",
];
export const players: Player[] = names.map((name, i) => ({
  id: `p${i}`,
  name,
  role: (["handler", "cutter", "hybrid"] as const)[i % 3],
  level: (["advanced", "intermediate", "beginner"] as const)[
    Math.floor(i / 3) % 3
  ],
  availability: i < 18 ? "confirmed" : i < 23 ? "maybe" : "unavailable",
  developmentGoals: [
    focuses[i % 4],
    i % 2 ? "Earlier communication" : "Confident release points",
  ],
}));
const drillSpecs: [
  string,
  string,
  string,
  number,
  number,
  Focus,
  string,
  string,
  string,
][] = [
  [
    "warmup",
    "Warm-up & throwing",
    "fundamentals",
    2,
    15,
    "Handler resets",
    "Build balanced pivots and reliable releases.",
    "Pairs 10 metres apart with one disc.",
    "Lead with your eyes, then your pivot.",
  ],
  [
    "weave",
    "Three-person weave",
    "fundamentals",
    3,
    10,
    "Offensive flow",
    "Time a throw into a moving receiver’s path.",
    "Three lanes, one disc; rotate after each throw.",
    "Throw to space; keep moving after release.",
  ],
  [
    "footwork",
    "Reset footwork & timing",
    "offence",
    4,
    15,
    "Handler resets",
    "Create a reset window before the stall gets high.",
    "Groups of four: thrower, reset, mark and observer.",
    "Commit to the reset at stall four.",
  ],
  [
    "pressure",
    "4v4 resets under pressure",
    "offence",
    8,
    20,
    "Handler resets",
    "Find a reliable reset against a tight mark.",
    "A 25 × 20 metre box; score after three resets.",
    "Attack the open hip, then change direction.",
  ],
  [
    "continuation",
    "Handler-to-cutter continuation",
    "offence",
    6,
    20,
    "Offensive flow",
    "Connect the reset to the next attacking pass.",
    "Two handlers and four cutters in alternating lanes.",
    "Clear hard to open the next window.",
  ],
  [
    "vertical",
    "Vertical stack initiation",
    "offence",
    7,
    15,
    "Offensive flow",
    "Create clean first cuts from a disciplined stack.",
    "Five cutters in a central stack with two handlers.",
    "One cut at a time; clear to the back.",
  ],
  [
    "horizontal",
    "Horizontal stack flow",
    "offence",
    8,
    20,
    "Offensive flow",
    "Maintain width and connect lateral movement.",
    "Four cutters across the field with two handler pairs.",
    "Hold width until the disc moves.",
  ],
  [
    "mark",
    "Force & marking",
    "defence",
    3,
    15,
    "Defensive marking",
    "Protect the force side without overcommitting.",
    "Trios rotate through thrower, marker and observer.",
    "Small feet, wide arms, balanced hips.",
  ],
  [
    "switch",
    "Defensive communication",
    "defence",
    6,
    20,
    "Defensive marking",
    "Call and complete a switch early.",
    "Three attacking pairs cross in a 20 metre square.",
    "Call the name, the switch and the new assignment.",
  ],
  [
    "cup",
    "Zone cup positioning",
    "defence",
    7,
    15,
    "Zone offence",
    "Recognise the spaces a moving cup leaves.",
    "Three cup defenders face four passing attackers.",
    "Move as a unit; protect the inside lane.",
  ],
  [
    "swings",
    "Zone offence swings",
    "offence",
    8,
    20,
    "Zone offence",
    "Move the cup and attack the weak side.",
    "Three handlers, two wings and three cup defenders.",
    "Swing early; attack before the cup settles.",
  ],
  [
    "scrimmage",
    "Constraint-based scrimmage",
    "offence",
    8,
    20,
    "Handler resets",
    "Transfer the focus into game-like decisions.",
    "Two balanced teams; a reset is required before scoring.",
    "Reward the decision, not just the completion.",
  ],
];
export const drills: Drill[] = drillSpecs.map(
  ([
    id,
    title,
    category,
    minPlayers,
    defaultMinutes,
    focus,
    objective,
    setup,
    cue,
  ]) => ({
    id,
    title,
    category,
    difficulty: ["warmup", "weave", "footwork", "mark"].includes(id)
      ? "beginner"
      : "intermediate",
    minPlayers,
    defaultMinutes,
    field: ["horizontal", "vertical"].includes(id) ? "full" : "half",
    equipment: ["Discs", "Cones", "Bibs"],
    objective,
    setup,
    steps: [
      "Walk through the pattern together at half speed.",
      `Run ${id === "scrimmage" ? "four-minute points" : "two-minute repetitions"}, then rotate roles.`,
      `Pause to discuss: ${cue}`,
      "Repeat with the opposite force and finish with a short reflection.",
    ],
    coachingCues: [cue, "Keep heads up and communicate before the disc moves."],
    variations: {
      easier: "Remove the mark and widen the passing lanes.",
      harder: "Add an active defender and a stall-five limit.",
    },
    tags: [focus, ...(id === "scrimmage" ? focuses : [])],
  }),
);
export const initialSession: TrainingSession = {
  id: "sunday",
  title: "Sunday team training",
  date: "2026-11-01T09:00:00+08:00",
  location: "Northstar Fields · Pitch 2 (fictional)",
  focus: "Handler resets",
  status: "draft",
  durationMinutes: 90,
  fieldSpace: "full",
  intensity: "moderate",
  experience: "mixed",
  attendeeIds: players
    .filter((p) => p.availability === "confirmed")
    .map((p) => p.id),
  items: ["warmup", "footwork", "pressure", "continuation", "scrimmage"].map(
    (drillId, i) => ({
      id: `item${i}`,
      drillId,
      durationMinutes: drills.find((d) => d.id === drillId)!.defaultMinutes,
      notes: "",
      order: i,
    }),
  ),
};
export const pastSessions = [
  {
    id: "past1",
    title: "Build the next option",
    date: "2026-10-25",
    attendance: 21,
    focus: "Offensive flow",
  },
  {
    id: "past2",
    title: "Own the force side",
    date: "2026-10-18",
    attendance: 19,
    focus: "Defensive marking",
  },
];
export const observations: CoachingObservation[] = [
  {
    id: "o1",
    sessionId: "past1",
    focusArea: "Handler resets",
    note: "Reset timing breaks down against tight marks.",
    createdAt: "2026-10-25T12:00:00Z",
  },
  {
    id: "o2",
    sessionId: "past2",
    focusArea: "Defensive marking",
    note: "Defensive communication was inconsistent during switches.",
    createdAt: "2026-10-18T12:00:00Z",
  },
  {
    id: "o3",
    sessionId: "past1",
    focusArea: "Offensive flow",
    note: "Continuation options improved after small-sided games.",
    createdAt: "2026-10-25T12:00:00Z",
  },
  {
    id: "o4",
    sessionId: "past1",
    playerId: "p0",
    focusArea: "Handler resets",
    note: "An earlier reset cut would give Alex a second throwing window.",
    createdAt: "2026-10-25T12:05:00Z",
  },
];
