import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Download,
  Flag,
  MousePointer2,
  Plus,
  RotateCcw,
  Target,
  Undo2,
  Users,
  X,
} from "lucide-react";
import type { Player } from "./data";
import {
  exampleStats,
  loadStats,
  newStatSession,
  saveStats,
  statLabels,
  statsCsv,
  summarizeStats,
  type StatSession,
  type StatType,
} from "./stats";
import "./solo.css";
export default function SoloCoach({
  players,
  go,
}: {
  players: Player[];
  go: (path: string) => void;
}) {
  const [sessions, setSessions] = useState<StatSession[]>(loadStats);
  const [selected, setSelected] = useState(() => sessions[0]?.id || "");
  const [tab, setTab] = useState<"capture" | "summary">("capture");
  const [playerId, setPlayerId] = useState("");
  const [toast, setToast] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [simple, setSimple] = useState(true);
  const session = sessions.find((s) => s.id === selected) || sessions[0];
  const result = summarizeStats(session?.events || []);
  const active = !!session && !session.endedAt && !session.example;
  useEffect(() => {
    try {
      saveStats(sessions);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [sessions]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);
  const start = () => {
    if (
      active &&
      !window.confirm(
        "Finish this session and start a new one? Your log will be kept.",
      )
    )
      return;
    const fresh = newStatSession();
    setSessions((list) => [
      fresh,
      ...list.map((s) =>
        s.id === session?.id && !s.endedAt
          ? { ...s, endedAt: new Date().toISOString() }
          : s,
      ),
    ]);
    setSelected(fresh.id);
    setPlayerId("");
    setTab("capture");
  };
  const capture = (type: StatType) => {
    if (!active) return;
    const event = {
      id: crypto.randomUUID(),
      type,
      at: new Date().toISOString(),
      playerId: playerId || undefined,
    };
    setSessions((list) =>
      list.map((s) =>
        s.id === session.id ? { ...s, events: [...s.events, event] } : s,
      ),
    );
    setToast(
      `${statLabels[type]} recorded${playerId ? " · " + players.find((p) => p.id === playerId)?.name : ""}`,
    );
  };
  const undo = () => {
    if (!active || !session.events.length) return;
    const last = session.events.at(-1)!;
    setSessions((list) =>
      list.map((s) =>
        s.id === session.id ? { ...s, events: s.events.slice(0, -1) } : s,
      ),
    );
    setToast(`Undid: ${statLabels[last.type]}`);
  };
  const exportCsv = () => {
    if (!session) return;
    const blob = new Blob(
      [
        statsCsv(
          session,
          Object.fromEntries(players.map((p) => [p.id, p.name])),
        ),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `northstar-stats-${session.id}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="solo">
      <div className="solo-heading">
        <div>
          <span className="eyebrow">ONE COACH. LESS TO JUGGLE.</span>
          <h1>
            Eyes on the game.
            <br />
            <span>We’ll keep the count.</span>
          </h1>
          <p>A few taps now. A clear next step after the whistle.</p>
        </div>
        <button className="button outline" onClick={() => go("/overview")}>
          Training workspace <ArrowUpRight size={16} />
        </button>
      </div>
      {saveError && (
        <p className="warning" role="alert">
          Device storage is unavailable. Export your log before closing this
          page.
        </p>
      )}
      <div className="solo-intro">
        <span className="solo-intro-icon">
          <MousePointer2 size={23} />
        </span>
        <div>
          <strong>You don’t need to track everything.</strong>
          <p>
            Start with goals and turnovers. Add passes when you have the
            headspace. Team-only capture is enough.
          </p>
        </div>
        <span className="solo-label">BUILT FOR ONE PAIR OF HANDS</span>
      </div>
      <div className="solo-controls">
        <div className="solo-tabs" aria-label="Stats view">
          <button
            aria-pressed={tab === "capture"}
            className={tab === "capture" ? "selected" : ""}
            onClick={() => setTab("capture")}
          >
            <MousePointer2 size={16} /> Take stats
          </button>
          <button
            aria-pressed={tab === "summary"}
            className={tab === "summary" ? "selected" : ""}
            onClick={() => setTab("summary")}
          >
            <Target size={16} /> Make sense of it
          </button>
        </div>
        <button className="button primary" onClick={start}>
          <Plus size={16} />
          {session ? "New session" : "Start a session"}
        </button>
      </div>
      {!session ? (
        <section className="solo-empty card">
          <div className="empty-field" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span className="eyebrow">YOUR NEXT SESSION, A LITTLE LIGHTER</span>
          <h2>Coach first. Count the essentials.</h2>
          <p>
            No setup checklist. No player assignments.
            <br />
            Start a session and tap what you see.
          </p>
          <button className="button primary" onClick={start}>
            <PlayIcon /> Start capturing
          </button>
          <button
            className="text-link"
            onClick={() => {
              const example = exampleStats();
              setSessions((list) => [example, ...list]);
              setSelected(example.id);
              setTab("summary");
            }}
          >
            See an example summary <ArrowRight size={15} />
          </button>
          <div className="solo-empty-steps">
            <span>
              <b>01</b> Tap an event
            </span>
            <span>
              <b>02</b> Undo if needed
            </span>
            <span>
              <b>03</b> Get one next step
            </span>
          </div>
        </section>
      ) : (
        <>
          <div className="solo-session-line">
            <div>
              <span className={`capture-dot ${active ? "on" : ""}`} />
              <strong>{session.title}</strong>
              <span className="tag">
                {session.example
                  ? "Illustrative example"
                  : active
                    ? "Recording"
                    : "Finished"}
              </span>
            </div>
            <label className="sr-only" htmlFor="stats-session">
              Choose a session
            </label>
            <select
              id="stats-session"
              value={session.id}
              onChange={(e) => {
                setSelected(e.target.value);
                setPlayerId("");
              }}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ·{" "}
                  {new Date(s.startedAt).toLocaleString("en-GB", {
                    timeZone: "Asia/Kuala_Lumpur",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {s.example ? " · Example" : ""}
                </option>
              ))}
            </select>
          </div>
          {session.example && (
            <p className="solo-example">
              This is fictional example data. Start a new session to record your
              own observations.
            </p>
          )}
          {tab === "capture" ? (
            <div className="capture-layout">
              <section className="card capture-card">
                <div className="capture-card-head">
                  <div>
                    <span className="eyebrow">TAP WHAT YOU SEE</span>
                    <h2>Keep your head in the game.</h2>
                  </div>
                  <label className="simple-toggle">
                    <input
                      type="checkbox"
                      checked={simple}
                      onChange={(e) => setSimple(e.target.checked)}
                    />{" "}
                    Essentials only
                  </label>
                </div>
                <div className="capture-score">
                  <div>
                    <small>NORTHSTAR</small>
                    <strong>{result.counts.ourGoal}</strong>
                  </div>
                  <span>:</span>
                  <div>
                    <small>OPPOSITION</small>
                    <strong>{result.counts.theirGoal}</strong>
                  </div>
                  <span className="score-caption">Recorded goals only</span>
                </div>
                <div className="capture-buttons">
                  {(
                    [
                      "ourGoal",
                      "theirGoal",
                      ...(simple ? [] : ["pass", "block"]),
                      "throwaway",
                      "drop",
                    ] as StatType[]
                  ).map((type) => (
                    <button
                      key={type}
                      disabled={!active}
                      className={`stat-button stat-${type}`}
                      onClick={() => capture(type)}
                    >
                      <span className="stat-symbol">
                        {type === "ourGoal" || type === "theirGoal" ? (
                          <Plus size={24} />
                        ) : (
                          <ArrowUpRight
                            size={24}
                            style={{
                              transform:
                                type === "block"
                                  ? "rotate(-90deg)"
                                  : type === "pass"
                                    ? undefined
                                    : "rotate(90deg)",
                            }}
                          />
                        )}
                      </span>
                      <strong>{statLabels[type]}</strong>
                      <span className="stat-count">{result.counts[type]}</span>
                      <small>
                        {type === "throwaway"
                          ? "Pass misses the receiver"
                          : type === "drop"
                            ? "Catchable disc is dropped"
                            : type === "pass"
                              ? "A pass is caught"
                              : type === "block"
                                ? "Defender wins the disc"
                                : type === "ourGoal"
                                  ? "Northstar goal"
                                  : "Opposition goal"}
                      </small>
                    </button>
                  ))}
                </div>
                <div className="capture-bottom">
                  <button
                    className="button outline"
                    onClick={undo}
                    disabled={!active || !session.events.length}
                  >
                    <Undo2 size={17} /> Undo last tap
                  </button>
                  <span>{session.events.length} events recorded</span>
                </div>
                <label className="optional-player">
                  <Users size={17} />
                  <span>
                    Optional player tag
                    <small>Leave this on “Team only” to stay fast.</small>
                  </span>
                  <select
                    aria-label="Player tag for next events"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                  >
                    <option value="">Team only</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                {playerId && (
                  <p className="tag-reminder">
                    Next events will be tagged to{" "}
                    {players.find((p) => p.id === playerId)?.name}.{" "}
                    <button
                      className="text-link"
                      onClick={() => setPlayerId("")}
                    >
                      Clear tag
                    </button>
                  </p>
                )}
                {!active && (
                  <p className="fineprint">
                    This log is read-only.{" "}
                    {session.example
                      ? "Example sessions cannot be edited."
                      : "Resume to add events or undo a mistake."}
                  </p>
                )}
                <div className="capture-end">
                  {active ? (
                    <button
                      className="text-link"
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Finish recording and see the summary? You can resume later.",
                          )
                        )
                          return;
                        setSessions((list) =>
                          list.map((s) =>
                            s.id === session.id
                              ? { ...s, endedAt: new Date().toISOString() }
                              : s,
                          ),
                        );
                        setTab("summary");
                      }}
                    >
                      <Flag size={16} /> Finish & see summary
                    </button>
                  ) : !session.example ? (
                    <button
                      className="text-link"
                      onClick={() =>
                        setSessions((list) =>
                          list.map((s) =>
                            s.id === session.id
                              ? { ...s, endedAt: undefined }
                              : s,
                          ),
                        )
                      }
                    >
                      Resume recording <ArrowRight size={15} />
                    </button>
                  ) : null}
                </div>
              </section>
              <aside className="capture-side">
                <section className="card">
                  <span className="eyebrow">YOUR RECENT TAPS</span>
                  <h2>A simple paper trail.</h2>
                  {!session.events.length ? (
                    <p className="fineprint">
                      Your first event will appear here. Wrong tap? Undo removes
                      the most recent one.
                    </p>
                  ) : (
                    <ol className="stat-log">
                      {session.events
                        .slice(-8)
                        .reverse()
                        .map((e) => (
                          <li key={e.id}>
                            <span className={`log-dot log-${e.type}`} />
                            <div>
                              <strong>{statLabels[e.type]}</strong>
                              <small>
                                {e.playerId
                                  ? players.find((p) => p.id === e.playerId)
                                      ?.name
                                  : "Team only"}
                              </small>
                            </div>
                            <time>
                              {new Date(e.at).toLocaleTimeString("en-GB", {
                                timeZone: "Asia/Kuala_Lumpur",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          </li>
                        ))}
                    </ol>
                  )}
                </section>
                <div className="solo-tip">
                  <span className="eyebrow">GIVE YOURSELF PERMISSION</span>
                  <h3>Missed a play? Keep coaching.</h3>
                  <p>
                    This is a log of what you saw, not a complete match report.
                    A small, consistent record beats a perfect spreadsheet you
                    never finish.
                  </p>
                </div>
              </aside>
            </div>
          ) : (
            <div className="solo-summary">
              <section className="card summary-lead">
                <span className="eyebrow">THE SHORT VERSION</span>
                <h2>
                  {session.events.length
                    ? "Here’s what your taps tell us."
                    : "Nothing recorded. Nothing assumed."}
                </h2>
                <p>
                  {session.example ? "Illustrative example · " : ""}
                  {session.events.length} recorded events. {result.turnovers}{" "}
                  throwing turnovers. {result.counts.block} defensive blocks.
                </p>
                <div className="summary-metrics">
                  <div>
                    <strong>
                      {result.counts.ourGoal} – {result.counts.theirGoal}
                    </strong>
                    <span>Recorded goals</span>
                    <small>Northstar – opposition</small>
                  </div>
                  <div>
                    <strong>{result.turnovers}</strong>
                    <span>Throwing turnovers</span>
                    <small>Throwaways + drops</small>
                  </div>
                  <div>
                    <strong>
                      {result.completion === null
                        ? "—"
                        : result.completion + "%"}
                    </strong>
                    <span>Logged pass completion</span>
                    <small>
                      {result.attempts
                        ? `${result.counts.pass} caught / ${result.attempts} logged attempts`
                        : "No pass attempts logged"}
                    </small>
                  </div>
                </div>
                <p className="summary-caveat">
                  Only the events you recorded are included. Goals and blocks do
                  not count as pass attempts. Partial capture can skew
                  percentages; this is not a full-team performance rating.
                </p>
              </section>
              <section className="card next-step">
                <div className="next-step-icon">
                  <Target size={25} />
                </div>
                <span className="eyebrow">ONE THING TO TRY NEXT</span>
                <h2>{result.focus}</h2>
                <p>{result.evidence}</p>
                <span className="tag">Simple rule · coach decides</span>
                {result.turnovers > 0 && (
                  <button
                    className="button outline"
                    onClick={() => go("/playbook")}
                  >
                    Find a supporting drill <ArrowUpRight size={16} />
                  </button>
                )}
              </section>
              <section className="card turnover-card">
                <span className="eyebrow">WHERE POSSESSION WAS LOST</span>
                <h2>Two counts. A clearer conversation.</h2>
                {(["throwaway", "drop"] as const).map((type) => (
                  <div className="loss-row" key={type}>
                    <span>{statLabels[type]}</span>
                    <div>
                      <i
                        style={{
                          width: `${result.turnovers ? (result.counts[type] / result.turnovers) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <strong>{result.counts[type]}</strong>
                  </div>
                ))}
                <p className="fineprint">
                  These counts describe recorded events, not their cause. Ask
                  what happened before choosing a training focus.
                </p>
              </section>
              <section className="card summary-actions">
                <span className="eyebrow">KEEP WHAT’S USEFUL</span>
                <h2>Your log belongs to you.</h2>
                <p>
                  Export every event, timestamp and optional player tag. No
                  account or analysis tool required.
                </p>
                <button className="button outline" onClick={exportCsv}>
                  <Download size={16} /> Download event log (.csv)
                </button>
                <button className="text-link" onClick={() => setTab("capture")}>
                  <ChevronLeft size={15} /> Back to event log
                </button>
              </section>
            </div>
          )}
        </>
      )}
      <div className="solo-footer">
        <span>
          <Check size={14} />{" "}
          {saveError ? "Export to keep your data" : "Saved on this device"} · No
          backend
        </span>
        <span>Solo coach concept · Separate preview branch</span>
      </div>
      {toast && (
        <div role="status" className="solo-toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
function PlayIcon() {
  return <ArrowRight size={17} />;
}
