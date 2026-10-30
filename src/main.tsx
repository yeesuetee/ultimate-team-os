import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Play,
  Pause,
  RotateCcw,
  LayoutDashboard,
  CalendarDays,
  Radio,
  BookOpen,
  Users,
  ChartNoAxesCombined,
  Compass,
  ChevronRight,
  Check,
  Search,
  MapPin,
  Clock,
  MoreHorizontal,
  X,
  ArrowUp,
  ArrowDown,
  Trash2,
  Flag,
  Sun,
  Target,
} from "lucide-react";
import {
  drills,
  focuses,
  pastSessions,
  type Drill,
  type Player,
  type TrainingSession,
  type Focus,
} from "./data";
import {
  attendance,
  demoRepository,
  freshState,
  generatePlan,
  groupPlayers,
  recommendations,
  totalMinutes,
} from "./domain";
import "./style.css";
import SoloCoach from "./SoloCoach";
import "./theme.css";
const nav = [
  ["/", "Solo coach", LayoutDashboard],
  ["/planner", "Training planner", CalendarDays],
  ["/live", "Live coaching", Radio],
  ["/playbook", "Playbook", BookOpen],
  ["/players", "Players", Users],
  ["/insights", "Reviews & insights", ChartNoAxesCombined],
] as const;
const uid = () => crypto.randomUUID();
function App() {
  const [state, setState] = useState(demoRepository.load);
  const [path, setPath] = useState(location.hash.slice(1) || "/");
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [detail, setDetail] = useState<Drill | Player | null>(null);
  const [playerView, setPlayerView] = useState(false);
  const [plan, setPlan] = useState(state.session);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [level, setLevel] = useState("all");
  const [maxPlayers, setMaxPlayers] = useState(28);
  const [maxTime, setMaxTime] = useState(60);
  const [groupMode, setGroupMode] = useState("balanced");
  const [groups, setGroups] = useState(() =>
    groupPlayers(
      state.players.filter((p) => state.session.attendeeIds.includes(p.id)),
      "balanced",
    ),
  );
  useEffect(() => {
    setGroups(
      groupPlayers(
        state.players.filter((p) => plan.attendeeIds.includes(p.id)),
        groupMode,
      ),
    );
  }, [plan.attendeeIds, state.players, groupMode]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(
    state.session.items[0]?.durationMinutes * 60 || 0,
  );
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [noteFocus, setNoteFocus] = useState<Focus>("Handler resets");
  const [endOpen, setEndOpen] = useState(false);
  const [outcome, setOutcome] = useState("Partially achieved");
  const [reviewFocus, setReviewFocus] = useState<string[]>(["Handler resets"]);
  const [summary, setSummary] = useState("");
  const go = (p: string) => {
    history.pushState({}, "", `#${p}`);
    setPath(p);
    setQuery("");
    setFilter("all");
    setLevel("all");
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const fn = () => {
      setPath(location.hash.slice(1) || "/");
      setQuery("");
      setFilter("all");
    };
    window.addEventListener("popstate", fn);
    window.addEventListener("hashchange", fn);
    return () => {
      window.removeEventListener("popstate", fn);
      window.removeEventListener("hashchange", fn);
    };
  }, []);
  useEffect(() => {
    try {
      demoRepository.save(state);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const next = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(next);
      if (next === 0) setRunning(false);
    }, 200);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetail(null);
        setEndOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const counts = attendance(state.players),
    suggestion = recommendations(state.observations, state.reviews)[0];
  const session = state.session;
  const current = session.items[Math.min(index, session.items.length - 1)];
  const currentDrill = drills.find((d) => d.id === current?.drillId);
  const total = totalMinutes(plan);
  const confirmed = counts.confirmed;
  const commit = (status: TrainingSession["status"]) => {
    if (!plan.items.length) {
      setNotice("Add at least one activity before saving.");
      return;
    }
    if (status === "published" && total !== plan.durationMinutes) {
      setNotice("Match the planned duration before publishing.");
      return;
    }
    const next = { ...plan, status };
    setState((s) => ({ ...s, session: next }));
    setPlan(next);
    setRunning(false);
    setIndex(0);
    setRemaining(next.items[0].durationMinutes * 60);
    setNotice(
      status === "published"
        ? "Session published to the demo player view."
        : "Draft saved on this device.",
    );
  };
  const updateItem = (
    i: number,
    patch: Partial<TrainingSession["items"][number]>,
  ) =>
    setPlan((p) => ({
      ...p,
      status: "draft",
      items: p.items.map((item, j) => (j === i ? { ...item, ...patch } : item)),
    }));
  const selectDrill = (next: number) => {
    const n = Math.max(0, Math.min(session.items.length - 1, next));
    setIndex(n);
    setRunning(false);
    setRemaining(session.items[n]?.durationMinutes * 60 || 0);
  };
  const reset = () => {
    if (!window.confirm("Reset all demo plans, attendance, notes and reviews?"))
      return;
    const fresh = freshState();
    setState(fresh);
    setPlan(fresh.session);
    setIndex(0);
    setRemaining(900);
    setRunning(false);
    setPlayerView(false);
    setDetail(null);
    setNotice("Demo data restored.");
    go("/");
  };
  const startLive = () => {
    setState((s) => ({ ...s, session: { ...s.session, status: "active" } }));
    selectDrill(0);
    go("/live");
  };
  const changeAvailability = (id: string, value: Player["availability"]) => {
    setState((s) => {
      const roster = s.players.map((p) =>
        p.id === id ? { ...p, availability: value } : p,
      );
      return { ...s, players: roster };
    });
    setNotice(
      "Attendance updated. Use RSVP count in the planner to refresh the plan.",
    );
  };
  const latestReview = state.reviews[0];
  const recapPast =
    pastSessions.find((s) => s.id === latestReview?.sessionId) ||
    pastSessions[0];
  const recapCurrent = latestReview?.sessionId === session.id;
  const heroLines: Record<Focus, [string, string]> = {
    "Handler resets": ["Build the reset.", "Keep the flow."],
    "Defensive marking": ["Set the force.", "Own the moment."],
    "Offensive flow": ["Find the space.", "Keep it moving."],
    "Zone offence": ["Move the cup.", "Open the field."],
  };
  const title = nav.find((n) => n[0] === path)?.[1] || "Page not found";
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          href="#/"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            go("/");
          }}
        >
          <span className="impact-brand">
            <span className="impact-wordmark">
              <img src="./impact-logo.png" alt="IMPACT" />
            </span>
            <span className="impact-product">
              ULTIMATE TEAM OS <span>COACH ASSISTANT</span>
            </span>
          </span>
        </a>
        <div className="team">
          <span className="team-logo">
            N<span>✦</span>
          </span>
          <div>
            <strong>Northstar Ultimate</strong>
            <small>Coach workspace · Demo team</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {nav.map(([p, label, Icon]) => (
            <a
              key={p}
              href={`#${p}`}
              className={path === p ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                go(p);
              }}
            >
              <Icon size={19} />
              {label}
              {p === "/live" && <span className="live-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sideline">
            <span>MADE FOR THE SIDELINE</span>
            <p>
              Less admin.
              <br />
              More good Ultimate.
            </p>
            <Compass size={64} />
          </div>
          <button className="reset" onClick={reset}>
            <RotateCcw size={15} /> Reset demo data
          </button>
          <div className="coach">
            <span className="avatar">JD</span>
            <div>
              <strong>Jamie Davis</strong>
              <small>Head coach</small>
            </div>
            <span className="online" />
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <a
            className="mobile-impact"
            href="#/"
            aria-label="IMPACT Ultimate Team OS home"
            onClick={(e) => {
              e.preventDefault();
              go("/");
            }}
          >
            <img src="./impact-logo.png" alt="IMPACT" />
          </a>
          <div className="crumb">
            Workspace <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="header-actions">
            <span className="demo-pill">
              <span /> Interactive demo
            </span>
            <button
              className="view-button"
              onClick={() => setPlayerView((v) => !v)}
            >
              {playerView ? "Player view" : "Coach view"} <Users size={15} />
            </button>
            <span className="avatar small">JD</span>
          </div>
        </header>
        <main>
          {storageError && (
            <div role="alert" className="warning">
              Local storage is unavailable. Changes will last only while this
              page stays open.
            </div>
          )}
          {playerView ? (
            <>
              <PageHeading
                eyebrow="TEAM NOTICEBOARD"
                title="Your next session."
                description="Published plans for Northstar Ultimate. Read-only demo player view."
              />
              {session.status === "draft" ? (
                <Empty text="Your coach hasn’t published the next plan yet." />
              ) : (
                <>
                  <div className="card">
                    <span className="eyebrow">PUBLISHED SESSION</span>
                    <h2>{session.title}</h2>
                    <p>
                      {session.focus} · {session.durationMinutes} minutes ·{" "}
                      {session.location}
                    </p>
                  </div>
                  {session.items.map((item) => (
                    <button
                      className="card full-button"
                      key={item.id}
                      onClick={() =>
                        setDetail(drills.find((d) => d.id === item.drillId)!)
                      }
                    >
                      {drills.find((d) => d.id === item.drillId)?.title}
                      <span>
                        {item.durationMinutes} min <ChevronRight size={16} />
                      </span>
                    </button>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {path === "/" && <SoloCoach players={state.players} go={go} />}
              {path === "/overview" && (
                <>
                  <PageHeading
                    eyebrow="YOUR TEAM. YOUR NEXT CHAPTER."
                    title="Good morning, Coach."
                    description="A little preparation. A better day on the field."
                    action={
                      <button
                        className="button primary"
                        onClick={() => go("/planner")}
                      >
                        <Plus size={17} /> Plan training
                      </button>
                    }
                  />
                  <div className="dashboard-grid">
                    <section className="hero">
                      <div className="hero-copy">
                        <div className="hero-top">
                          <span className="eyebrow">
                            NEXT UP · SUNDAY, 1 NOV
                          </span>
                          <span className="hero-status">{session.status}</span>
                        </div>
                        <h2>
                          {heroLines[session.focus][0]}
                          <br />
                          {heroLines[session.focus][1]}
                        </h2>
                        <p>
                          One team. More options.
                          <br />A purposeful session starts here.
                        </p>
                        <div className="hero-meta">
                          <span>
                            <Clock size={15} />{" "}
                            {`9:00–${Math.floor((540 + session.durationMinutes) / 60)}:${String((540 + session.durationMinutes) % 60).padStart(2, "0")} AM · MYT`}
                          </span>
                          <span>
                            <MapPin size={15} /> Northstar Fields · Pitch 2
                          </span>
                        </div>
                        <button
                          className="button light"
                          onClick={() => go("/planner")}
                        >
                          Open training plan <ArrowUpRight size={17} />
                        </button>
                      </div>
                      <div className="field-art" aria-hidden="true">
                        <div className="field-lines">
                          <div className="endzone top" />
                          <div className="endzone bottom" />
                          <div className="field-circle" />
                          <span className="player-dot d1" />
                          <span className="player-dot d2" />
                          <span className="player-dot d3" />
                          <span className="player-dot d4" />
                          <svg viewBox="0 0 240 320">
                            <path d="M65 230 Q190 190 150 90" />
                            <path d="m141 105 9-15 8 16" />
                            <path d="M65 230 Q45 150 90 130" />
                          </svg>
                        </div>
                        <span className="art-label">
                          THE NEXT PLAY STARTS HERE ↗
                        </span>
                      </div>
                    </section>
                    <section className="card attendance">
                      <CardTitle
                        title="Who’s coming?"
                        subtitle="Sunday’s attendance"
                        action={
                          <button
                            className="icon-button"
                            aria-label="View roster"
                            onClick={() => go("/players")}
                          >
                            <ArrowUpRight size={18} />
                          </button>
                        }
                      />
                      <div className="attendance-big">
                        {confirmed.length}
                        <span>/ {state.players.length}</span>
                        <span className="confirmed-pill">Confirmed</span>
                      </div>
                      <div className="attendance-bar">
                        <i
                          style={{
                            width: `${(confirmed.length / state.players.length) * 100}%`,
                          }}
                        />
                        <i
                          style={{
                            width: `${(counts.maybe.length / state.players.length) * 100}%`,
                          }}
                        />
                        <i
                          style={{
                            width: `${(counts.unavailable.length / state.players.length) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="attendance-key">
                        <span>
                          <i />
                          {confirmed.length} Yes
                        </span>
                        <span>
                          <i />
                          {counts.maybe.length} Maybe
                        </span>
                        <span>
                          <i />
                          {counts.unavailable.length} Out
                        </span>
                      </div>
                      <div className="role-grid">
                        {(["handler", "cutter", "hybrid"] as const).map(
                          (role) => (
                            <div key={role}>
                              <strong>
                                {
                                  confirmed.filter((p) => p.role === role)
                                    .length
                                }
                              </strong>
                              <small>{role}s</small>
                            </div>
                          ),
                        )}
                      </div>
                      <button
                        className="text-link"
                        onClick={() => go("/players")}
                      >
                        View attendee roster <ArrowRight size={15} />
                      </button>
                    </section>
                    <section className="card recommendation">
                      <div className="section-kicker">
                        <span className="tiny-icon">
                          <Target size={19} />
                        </span>
                        <span>THE FOCUS THAT MOVES YOU FORWARD</span>
                        <span className="tag">Demo recommendation</span>
                      </div>
                      <h2>{suggestion.focus}</h2>
                      <p>
                        Give the disc a way out. Build confident resets when the
                        pressure comes on.
                      </p>
                      <details>
                        <summary>
                          Why this focus?{" "}
                          <span>
                            {suggestion.sources.length} coaching observations
                          </span>
                        </summary>
                        {suggestion.sources.map((o) => (
                          <blockquote key={o.id}>“{o.note}”</blockquote>
                        ))}
                        {suggestion.contributing.map((r) => (
                          <p key={r.id}>
                            {r.outcome}: {r.summary}
                          </p>
                        ))}
                        <small>
                          Rules rank repeated focus mentions and recency. You
                          make the final call.
                        </small>
                      </details>
                      <div className="card-footer">
                        <span>Coach-led. Evidence-informed.</span>
                        <button
                          className="button outline"
                          onClick={() => {
                            setPlan((p) => ({ ...p, focus: suggestion.focus }));
                            go("/planner");
                          }}
                        >
                          Plan around this <ArrowRight size={15} />
                        </button>
                      </div>
                    </section>
                    <section className="card session-path">
                      <CardTitle
                        title="Your coaching loop"
                        subtitle="From first idea to final whistle"
                      />
                      <button onClick={() => go("/planner")}>
                        <span className="step-icon">
                          <CalendarDays size={19} />
                        </span>
                        <span>
                          <strong>Prepare with purpose</strong>
                          <small>Your next plan is {session.status}</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                      <button onClick={startLive}>
                        <span className="step-icon">
                          <Radio size={19} />
                        </span>
                        <span>
                          <strong>Stay in the moment</strong>
                          <small>Timer, cues and quick notes</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                      <button onClick={() => go("/insights")}>
                        <span className="step-icon">
                          <ChartNoAxesCombined size={19} />
                        </span>
                        <span>
                          <strong>Turn reflection into progress</strong>
                          <small>Review your last session</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    </section>
                    <section className="card plan-preview">
                      <CardTitle
                        title={`A purposeful ${session.durationMinutes} minutes`}
                        subtitle={`${session.focus} · ${session.items.length} activities`}
                        action={
                          <button
                            className="text-link"
                            onClick={() => go("/planner")}
                          >
                            Edit plan <ArrowUpRight size={15} />
                          </button>
                        }
                      />
                      <div className="timeline">
                        {session.items.map((item, i) => (
                          <button
                            key={item.id}
                            onClick={() =>
                              setDetail(
                                drills.find((d) => d.id === item.drillId)!,
                              )
                            }
                          >
                            <span className="timeline-num">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>
                              <strong>
                                {
                                  drills.find((d) => d.id === item.drillId)
                                    ?.title
                                }
                              </strong>
                              <small>
                                {i === 0
                                  ? "Find your rhythm"
                                  : i === session.items.length - 1
                                    ? "Bring it all together"
                                    : "Build the connection"}
                              </small>
                            </span>
                            <span className="minutes">
                              {item.durationMinutes} min
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="card recap">
                      <span className="eyebrow">LAST TIME ON THE FIELD</span>
                      <h2>{recapCurrent ? session.title : recapPast.title}</h2>
                      <p className="muted">
                        {new Date(
                          recapCurrent ? session.date : recapPast.date,
                        ).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          timeZone: "Asia/Kuala_Lumpur",
                        })}{" "}
                        ·{" "}
                        {recapCurrent
                          ? session.attendeeIds.length
                          : recapPast.attendance}{" "}
                        players
                      </p>
                      <blockquote>“{state.reviews[0]?.summary}”</blockquote>
                      <div className="recap-meta">
                        <span className="tag">{state.reviews[0]?.outcome}</span>
                        <span>Coach reflection</span>
                      </div>
                      <button
                        className="text-link"
                        onClick={() => go("/insights")}
                      >
                        See reviews & insights <ArrowRight size={15} />
                      </button>
                    </section>
                  </div>
                  <div className="page-foot">
                    <span>✦ Plan smarter. Coach better. Develop together.</span>
                    <span>
                      Fictional team · Local demo data{" "}
                      <button className="text-link" onClick={reset}>
                        Reset demo
                      </button>
                    </span>
                  </div>
                </>
              )}
              {path === "/planner" && (
                <>
                  <PageHeading
                    eyebrow="PREPARE WITH PURPOSE"
                    title="Make every minute count."
                    description="Shape a session around your team, your space and your focus."
                    action={
                      <span className="tag">{plan.status} · local device</span>
                    }
                  />
                  <div className="planner-layout">
                    <section className="card constraints">
                      <CardTitle
                        title="Session blueprint"
                        subtitle="You set the direction."
                      />
                      <label>
                        Training objective
                        <select
                          value={plan.focus}
                          onChange={(e) =>
                            setPlan({ ...plan, focus: e.target.value as Focus })
                          }
                        >
                          {focuses.map((f) => (
                            <option key={f}>{f}</option>
                          ))}
                        </select>
                      </label>
                      <div className="form-grid">
                        <label>
                          Duration
                          <select
                            value={plan.durationMinutes}
                            onChange={(e) =>
                              setPlan({
                                ...plan,
                                durationMinutes: +e.target.value,
                              })
                            }
                          >
                            {[60, 90, 120].map((n) => (
                              <option value={n} key={n}>
                                {n} minutes
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Players
                          <input
                            type="number"
                            min="2"
                            max="28"
                            value={plan.attendeeIds.length}
                            onChange={(e) => {
                              const n = Math.max(
                                2,
                                Math.min(28, +e.target.value),
                              );
                              const sorted = [...state.players].sort(
                                (a, b) =>
                                  Number(b.availability === "confirmed") -
                                  Number(a.availability === "confirmed"),
                              );
                              setPlan({
                                ...plan,
                                attendeeIds: sorted
                                  .slice(0, n)
                                  .map((p) => p.id),
                              });
                            }}
                          />
                        </label>
                      </div>
                      <button
                        className="text-link"
                        onClick={() =>
                          setPlan({
                            ...plan,
                            attendeeIds: confirmed.map((p) => p.id),
                          })
                        }
                      >
                        Use RSVP count ({confirmed.length})
                      </button>
                      <label>
                        Field space
                        <select
                          value={plan.fieldSpace}
                          onChange={(e) =>
                            setPlan({
                              ...plan,
                              fieldSpace: e.target.value as "half" | "full",
                            })
                          }
                        >
                          <option value="full">Full field</option>
                          <option value="half">Half field</option>
                        </select>
                      </label>
                      <div className="form-grid">
                        <label>
                          Intensity
                          <select
                            value={plan.intensity}
                            onChange={(e) =>
                              setPlan({ ...plan, intensity: e.target.value })
                            }
                          >
                            {["light", "moderate", "high"].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Experience
                          <select
                            value={plan.experience}
                            onChange={(e) =>
                              setPlan({ ...plan, experience: e.target.value })
                            }
                          >
                            {["beginner", "mixed", "advanced"].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <button
                        className="button primary wide"
                        onClick={() => {
                          setPlan(generatePlan(plan));
                          setNotice(
                            "Plan generated from drill tags and your constraints.",
                          );
                        }}
                      >
                        <Compass size={17} /> Generate plan
                      </button>
                      <p className="fineprint">
                        Demo rules match your focus, player count, field and
                        experience. Intensity changes activity variety. All
                        choices stay editable.
                      </p>
                    </section>
                    <section>
                      <div className="card plan-summary">
                        <div>
                          <span className="eyebrow">SUNDAY SESSION</span>
                          <h2>Your training plan</h2>
                        </div>
                        <span
                          className={
                            total === plan.durationMinutes
                              ? "time-total"
                              : "time-total mismatch"
                          }
                        >
                          {total}
                          <small>/ {plan.durationMinutes} min</small>
                        </span>
                      </div>
                      {total !== plan.durationMinutes && (
                        <p className="warning" role="status">
                          {Math.abs(total - plan.durationMinutes)} minutes{" "}
                          {total > plan.durationMinutes ? "over" : "under"}{" "}
                          target. Adjust timing before publishing.
                        </p>
                      )}
                      {plan.items.length === 0 && (
                        <Empty text="No activities yet. Generate a plan or add an activity below." />
                      )}
                      {plan.items.map((item, i) => {
                        const d = drills.find((d) => d.id === item.drillId)!;
                        return (
                          <article className="card activity" key={item.id}>
                            <div className="activity-head">
                              <span className="timeline-num">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <label className="grow">
                                <span className="sr-only">
                                  Activity {i + 1}
                                </span>
                                <select
                                  value={item.drillId}
                                  onChange={(e) =>
                                    updateItem(i, { drillId: e.target.value })
                                  }
                                >
                                  {drills.map((drill) => (
                                    <option value={drill.id} key={drill.id}>
                                      {drill.title}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="duration-input">
                                <input
                                  aria-label={`Minutes for ${d.title}`}
                                  type="number"
                                  min="1"
                                  max="120"
                                  value={item.durationMinutes}
                                  onChange={(e) =>
                                    updateItem(i, {
                                      durationMinutes: Math.max(
                                        1,
                                        Math.min(120, +e.target.value),
                                      ),
                                    })
                                  }
                                />
                                <span>min</span>
                              </label>
                            </div>
                            <p>{d.objective}</p>
                            <p className="cue">
                              <Target size={15} />
                              {d.coachingCues[0]}
                            </p>
                            <small>
                              Selected for {d.tags.join(" / ")} · {d.minPlayers}
                              + players · {d.field} field
                            </small>
                            {(d.minPlayers > plan.attendeeIds.length ||
                              (d.field === "full" &&
                                plan.fieldSpace === "half") ||
                              (plan.experience === "beginner" &&
                                d.difficulty !== "beginner")) && (
                              <p className="warning">
                                Check compatibility: this drill needs{" "}
                                {d.minPlayers}+ players, a {d.field} field, and{" "}
                                {d.difficulty} experience.
                              </p>
                            )}
                            <input
                              className="activity-note"
                              aria-label={`Coach notes for ${d.title}`}
                              placeholder="Add a coaching note…"
                              value={item.notes}
                              onChange={(e) =>
                                updateItem(i, { notes: e.target.value })
                              }
                            />
                            <div className="activity-actions">
                              <button
                                className="text-link"
                                onClick={() => setDetail(d)}
                              >
                                Drill details <ArrowUpRight size={14} />
                              </button>
                              <span />
                              <button
                                className="icon-button"
                                disabled={i === 0}
                                aria-label={`Move ${d.title} up`}
                                onClick={() =>
                                  setPlan((p) => {
                                    const items = [...p.items];
                                    [items[i - 1], items[i]] = [
                                      items[i],
                                      items[i - 1],
                                    ];
                                    return {
                                      ...p,
                                      items: items.map((x, j) => ({
                                        ...x,
                                        order: j,
                                      })),
                                    };
                                  })
                                }
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                className="icon-button"
                                disabled={i === plan.items.length - 1}
                                aria-label={`Move ${d.title} down`}
                                onClick={() =>
                                  setPlan((p) => {
                                    const items = [...p.items];
                                    [items[i + 1], items[i]] = [
                                      items[i],
                                      items[i + 1],
                                    ];
                                    return {
                                      ...p,
                                      items: items.map((x, j) => ({
                                        ...x,
                                        order: j,
                                      })),
                                    };
                                  })
                                }
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={`Remove ${d.title}`}
                                onClick={() =>
                                  setPlan((p) => ({
                                    ...p,
                                    items: p.items
                                      .filter((x) => x.id !== item.id)
                                      .map((x, j) => ({ ...x, order: j })),
                                  }))
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                      <button
                        className="button outline wide"
                        onClick={() =>
                          setPlan((p) => ({
                            ...p,
                            items: [
                              ...p.items,
                              {
                                id: uid(),
                                drillId: "warmup",
                                durationMinutes: 10,
                                notes: "",
                                order: p.items.length,
                              },
                            ],
                          }))
                        }
                      >
                        <Plus size={16} /> Add activity
                      </button>
                      <div className="save-bar">
                        <span>Saved plans power Live Coaching.</span>
                        <button
                          className="button outline"
                          onClick={() => commit("draft")}
                        >
                          Save draft
                        </button>
                        <button
                          className="button primary"
                          onClick={() => commit("published")}
                        >
                          Publish plan <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </section>
                  </div>
                  <section className="card">
                    <CardTitle
                      title="Two teams. Shared purpose."
                      subtitle="Group the selected players for small-sided work."
                    />
                    <div className="group-controls">
                      <label>
                        Grouping
                        <select
                          value={groupMode}
                          onChange={(e) => {
                            setGroupMode(e.target.value);
                            setGroups(
                              groupPlayers(
                                state.players.filter((p) =>
                                  plan.attendeeIds.includes(p.id),
                                ),
                                e.target.value,
                              ),
                            );
                          }}
                        >
                          <option value="balanced">
                            Balanced · alternate roles
                          </option>
                          <option value="position">Position-based</option>
                          <option value="random">Random</option>
                        </select>
                      </label>
                      <button
                        className="button outline"
                        onClick={() =>
                          setGroups(
                            groupPlayers(
                              state.players.filter((p) =>
                                plan.attendeeIds.includes(p.id),
                              ),
                              groupMode,
                            ),
                          )
                        }
                      >
                        Refresh groups
                      </button>
                    </div>
                    <div className="group-grid">
                      {groups.map((group, i) => (
                        <div key={i}>
                          <h3>
                            Team {i === 0 ? "Pine" : "Stone"} · {group.length}
                          </h3>
                          <p>{group.map((p) => p.name).join(" · ")}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
              {path === "/live" && (
                <>
                  <PageHeading
                    eyebrow="BE PRESENT. COACH THE MOMENT."
                    title="On the sideline."
                    description={`${session.title} · ${session.focus}`}
                    action={
                      <button
                        className="button outline"
                        onClick={() => setEndOpen(true)}
                      >
                        <Flag size={16} /> End session
                      </button>
                    }
                  />
                  {!currentDrill ? (
                    <Empty text="Save a training plan to start coaching." />
                  ) : (
                    <div className="live-layout">
                      <section className="card live-main">
                        <div className="live-top">
                          <span className="tag">
                            ACTIVITY {index + 1} OF {session.items.length}
                          </span>
                          <button
                            className="text-link"
                            onClick={() => setDetail(currentDrill)}
                          >
                            Drill details <ArrowUpRight size={16} />
                          </button>
                        </div>
                        <h2>{currentDrill.title}</h2>
                        <p>{currentDrill.objective}</p>
                        <div
                          className={`timer ${running ? "running" : ""}`}
                          role="timer"
                          aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
                        >
                          {String(Math.floor(remaining / 60)).padStart(2, "0")}
                          <span>:</span>
                          {String(remaining % 60).padStart(2, "0")}
                        </div>
                        <div className="timer-status">
                          {remaining === 0
                            ? "TIME TO HUDDLE UP"
                            : running
                              ? "IN PROGRESS"
                              : "READY WHEN YOU ARE"}
                        </div>
                        <div className="timer-buttons">
                          <button
                            className="button primary"
                            onClick={() => {
                              if (running) {
                                setRemaining(
                                  Math.max(
                                    0,
                                    Math.ceil(
                                      (deadline.current - Date.now()) / 1000,
                                    ),
                                  ),
                                );
                                setRunning(false);
                              } else if (remaining > 0) {
                                deadline.current =
                                  Date.now() + remaining * 1000;
                                setRunning(true);
                                setState((s) => ({
                                  ...s,
                                  session: { ...s.session, status: "active" },
                                }));
                              }
                            }}
                          >
                            {running ? <Pause size={19} /> : <Play size={19} />}{" "}
                            {running ? "Pause" : "Start timer"}
                          </button>
                          <button
                            className="button outline"
                            onClick={() => {
                              setRunning(false);
                              setRemaining(current.durationMinutes * 60);
                            }}
                          >
                            <RotateCcw size={17} /> Reset
                          </button>
                          <button
                            className="button outline"
                            onClick={() => {
                              setRemaining((n) => n + 300);
                              if (running) deadline.current += 300000;
                              setState((s) => ({
                                ...s,
                                session: {
                                  ...s.session,
                                  items: s.session.items.map((it, j) =>
                                    j === index
                                      ? {
                                          ...it,
                                          durationMinutes:
                                            it.durationMinutes + 5,
                                        }
                                      : it,
                                  ),
                                },
                              }));
                            }}
                          >
                            +5 min
                          </button>
                        </div>
                        <div className="coaching-cue">
                          <span className="eyebrow">ONE THING TO COACH</span>
                          <h3>{currentDrill.coachingCues[0]}</h3>
                          {current.notes && <p>{current.notes}</p>}
                        </div>
                        <div className="live-nav">
                          <button
                            className="button outline"
                            disabled={index === 0}
                            onClick={() => selectDrill(index - 1)}
                          >
                            <ArrowLeft size={15} /> Previous
                          </button>
                          <span>
                            Next:{" "}
                            {drills.find(
                              (d) => d.id === session.items[index + 1]?.drillId,
                            )?.title || "Team reflection"}
                          </span>
                          <button
                            className="button primary"
                            onClick={() =>
                              index === session.items.length - 1
                                ? setEndOpen(true)
                                : selectDrill(index + 1)
                            }
                          >
                            {index === session.items.length - 1
                              ? "Finish"
                              : "Skip / next"}{" "}
                            <ArrowRight size={16} />
                          </button>
                        </div>
                        <p className="fineprint">
                          Timer uses browser time while this page is open. No
                          background notifications.
                        </p>
                      </section>
                      <section className="card">
                        <CardTitle
                          title="Catch the small things."
                          subtitle="Quick notes become useful next steps."
                        />
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!note.trim()) return;
                            setState((s) => ({
                              ...s,
                              observations: [
                                ...s.observations,
                                {
                                  id: uid(),
                                  sessionId: session.id,
                                  playerId: tag || undefined,
                                  focusArea: noteFocus,
                                  note: note.trim(),
                                  createdAt: new Date().toISOString(),
                                },
                              ],
                            }));
                            setNote("");
                            setNotice("Observation saved.");
                          }}
                        >
                          <label>
                            Observation
                            <textarea
                              required
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="What are you noticing?"
                              rows={4}
                            />
                          </label>
                          <label>
                            Player tag
                            <select
                              value={tag}
                              onChange={(e) => setTag(e.target.value)}
                            >
                              <option value="">Whole team</option>
                              {state.players.map((p) => (
                                <option value={p.id} key={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Focus
                            <select
                              value={noteFocus}
                              onChange={(e) =>
                                setNoteFocus(e.target.value as Focus)
                              }
                            >
                              {focuses.map((f) => (
                                <option key={f}>{f}</option>
                              ))}
                            </select>
                          </label>
                          <button className="button primary wide">
                            <Plus size={16} /> Save observation
                          </button>
                        </form>
                        <div className="notes-list">
                          {state.observations
                            .filter((o) => o.sessionId === session.id)
                            .map((o) => (
                              <div key={o.id}>
                                <span className="tag">
                                  {o.playerId
                                    ? state.players.find(
                                        (p) => p.id === o.playerId,
                                      )?.name
                                    : "Team"}{" "}
                                  · {o.focusArea}
                                </span>
                                <p>{o.note}</p>
                              </div>
                            ))}
                        </div>
                      </section>
                    </div>
                  )}
                </>
              )}
              {path === "/playbook" && (
                <>
                  <PageHeading
                    eyebrow="GOOD SESSIONS START WITH GOOD TOOLS"
                    title="Your playbook."
                    description="Proven patterns. Clear cues. Room to make them your own."
                  />
                  <div className="toolbar">
                    <SearchBox
                      value={query}
                      set={setQuery}
                      placeholder="Search drills, skills or objectives…"
                    />
                    <label>
                      Category
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        {["all", "offence", "defence", "fundamentals"].map(
                          (c) => (
                            <option key={c}>{c}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      Level
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                      >
                        {["all", "beginner", "intermediate"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Players available
                      <input
                        type="number"
                        min="2"
                        max="28"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(+e.target.value)}
                      />
                    </label>
                    <label>
                      Max minutes
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={maxTime}
                        onChange={(e) => setMaxTime(+e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="drill-grid">
                    {drills
                      .filter(
                        (d) =>
                          (filter === "all" || d.category === filter) &&
                          (level === "all" || d.difficulty === level) &&
                          d.minPlayers <= maxPlayers &&
                          d.defaultMinutes <= maxTime &&
                          `${d.title} ${d.objective} ${d.tags.join(" ")}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .map((d, i) => (
                        <button
                          className="card drill-card"
                          key={d.id}
                          onClick={() => setDetail(d)}
                        >
                          <div
                            className={`mini-field field-${i % 3}`}
                            aria-hidden="true"
                          >
                            <div />
                            <i />
                            <i />
                            <i />
                            <i />
                            <svg viewBox="0 0 300 120">
                              <path d="M80 90 Q140 0 220 45 M210 35 l10 10 -12 8" />
                            </svg>
                            <span>
                              {String(i + 1).padStart(2, "0")} / NORTHSTAR
                              PLAYBOOK
                            </span>
                          </div>
                          <div className="drill-content">
                            <div className="drill-tags">
                              <span className="tag">{d.category}</span>
                              <span>
                                {d.defaultMinutes} min · {d.minPlayers}+ players
                              </span>
                            </div>
                            <h2>{d.title}</h2>
                            <p>{d.objective}</p>
                            <div className="card-footer">
                              <small>{d.difficulty}</small>
                              <ArrowUpRight size={18} />
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                  {!drills.some(
                    (d) =>
                      (filter === "all" || d.category === filter) &&
                      (level === "all" || d.difficulty === level) &&
                      d.minPlayers <= maxPlayers &&
                      d.defaultMinutes <= maxTime &&
                      `${d.title} ${d.objective} ${d.tags.join(" ")}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  ) && (
                    <Empty text="No drills match these filters. Try a broader search." />
                  )}
                </>
              )}
              {path === "/players" && (
                <>
                  <PageHeading
                    eyebrow="THE PEOPLE BEHIND THE PLAY"
                    title="One team. Many strengths."
                    description="28 fictional players, developing together. Attendance feeds your next plan."
                  />
                  <div className="stat-strip">
                    {Object.entries(counts).map(([name, list]) => (
                      <button
                        className={`card ${filter === name ? "selected" : ""}`}
                        key={name}
                        onClick={() =>
                          setFilter(filter === name ? "all" : name)
                        }
                      >
                        <strong>{list.length}</strong>
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="toolbar">
                    <SearchBox
                      value={query}
                      set={setQuery}
                      placeholder="Find a teammate…"
                    />
                    <label>
                      Role
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                      >
                        {["all", "handler", "cutter", "hybrid"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="button outline"
                      onClick={() => {
                        setQuery("");
                        setLevel("all");
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                  <div className="card roster">
                    <div className="roster-head">
                      <span>PLAYER</span>
                      <span>ROLE / EXPERIENCE</span>
                      <span>SUNDAY RSVP</span>
                      <span />
                    </div>
                    {state.players
                      .filter(
                        (p) =>
                          (filter === "all" || p.availability === filter) &&
                          (level === "all" || p.role === level) &&
                          p.name.toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((p, i) => (
                        <div className="roster-row" key={p.id}>
                          <button onClick={() => setDetail(p)}>
                            <span className={`avatar color-${i % 3}`}>
                              {p.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                            <strong>{p.name}</strong>
                          </button>
                          <span className="player-role">
                            {p.role}
                            <small>{p.level}</small>
                          </span>
                          <select
                            aria-label={`${p.name} attendance`}
                            value={p.availability}
                            onChange={(e) =>
                              changeAvailability(
                                p.id,
                                e.target.value as Player["availability"],
                              )
                            }
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="maybe">Maybe</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                          <button
                            className="icon-button"
                            aria-label={`View ${p.name}`}
                            onClick={() => setDetail(p)}
                          >
                            <ArrowUpRight size={17} />
                          </button>
                        </div>
                      ))}
                    {!state.players.some(
                      (p) =>
                        (filter === "all" || p.availability === filter) &&
                        (level === "all" || p.role === level) &&
                        p.name.toLowerCase().includes(query.toLowerCase()),
                    ) && (
                      <Empty text="No players found. Try clearing the filters." />
                    )}
                  </div>
                </>
              )}
              {path === "/insights" && (
                <>
                  <PageHeading
                    eyebrow="REFLECT. ADJUST. GO AGAIN."
                    title="Progress starts with noticing."
                    description="Your observations, connected. No scores. No black boxes."
                  />
                  <div className="insights-grid">
                    <section className="card">
                      <CardTitle
                        title="Close the coaching loop"
                        subtitle={`Review: ${session.title}`}
                      />
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setState((s) => ({
                            ...s,
                            session: { ...s.session, status: "completed" },
                            reviews: [
                              {
                                id: uid(),
                                sessionId: session.id,
                                outcome,
                                focusAreas: reviewFocus,
                                summary: summary.trim(),
                                createdAt: new Date().toISOString(),
                              },
                              ...s.reviews,
                            ],
                          }));
                          setSummary("");
                          setNotice(
                            "Review saved. Next-focus recommendations updated.",
                          );
                        }}
                      >
                        <label>
                          Was the objective achieved?
                          <select
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value)}
                          >
                            {[
                              "Achieved",
                              "Partially achieved",
                              "Not achieved",
                            ].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                        <fieldset>
                          <legend>Focus areas to develop</legend>
                          {focuses.map((f) => (
                            <label className="check-label" key={f}>
                              <input
                                type="checkbox"
                                checked={reviewFocus.includes(f)}
                                onChange={(e) =>
                                  setReviewFocus((x) =>
                                    e.target.checked
                                      ? [...x, f]
                                      : x.filter((v) => v !== f),
                                  )
                                }
                              />
                              {f}
                            </label>
                          ))}
                        </fieldset>
                        <label>
                          Coach reflection
                          <textarea
                            required
                            rows={4}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="What worked? What deserves another session?"
                          />
                        </label>
                        <button className="button primary wide">
                          <Check size={17} /> Save review
                        </button>
                      </form>
                    </section>
                    <section className="card chart-card">
                      <CardTitle
                        title="Showing up, together"
                        subtitle="Illustrative dummy attendance · not performance"
                      />
                      <div
                        className="bar-chart"
                        role="img"
                        aria-label={`Attendance: October 18, 19; October 25, 21; November 1, ${confirmed.length} confirmed.`}
                      >
                        {[...pastSessions].reverse().map((s) => (
                          <div className="chart-column" key={s.id}>
                            <strong>{s.attendance}</strong>
                            <div style={{ height: `${s.attendance * 6}px` }} />
                            <small>{s.date.slice(5).replace("-", " / ")}</small>
                          </div>
                        ))}
                        <div className="chart-column current">
                          <strong>{confirmed.length}</strong>
                          <div
                            style={{ height: `${confirmed.length * 6}px` }}
                          />
                          <small>11 / 01 RSVP</small>
                        </div>
                      </div>
                      <hr />
                      <h3>What we’re noticing</h3>
                      <p className="fineprint">
                        Illustrative frequency of coach-tagged observations.
                        These are mentions, not measured skill scores.
                      </p>
                      {recommendations(state.observations, state.reviews).map(
                        (r) => (
                          <div className="focus-bar" key={r.focus}>
                            <span>{r.focus}</span>
                            <div>
                              <i
                                style={{
                                  width: `${(r.sources.length / Math.max(1, state.observations.length)) * 100}%`,
                                }}
                              />
                            </div>
                            <strong>{r.sources.length}</strong>
                          </div>
                        ),
                      )}
                    </section>
                    <section className="card">
                      <CardTitle
                        title="Carry this into next Sunday"
                        subtitle="Demo recommendation · transparent rules"
                      />
                      <h2>{suggestion.focus}</h2>
                      {suggestion.sources.map((o) => (
                        <blockquote key={o.id}>“{o.note}”</blockquote>
                      ))}
                      {suggestion.contributing.map((r) => (
                        <p key={r.id}>
                          <span className="tag">Review evidence</span>{" "}
                          {r.summary}
                        </p>
                      ))}
                      <p className="fineprint">
                        Repeated mentions, recent notes and review focus areas
                        influence this suggestion. The coach decides the
                        priority.
                      </p>
                      <button
                        className="button outline"
                        onClick={() => {
                          setPlan((p) => ({ ...p, focus: suggestion.focus }));
                          go("/planner");
                        }}
                      >
                        Use this focus <ArrowRight size={16} />
                      </button>
                    </section>
                    <section className="card">
                      <CardTitle
                        title="The reflection log"
                        subtitle="Saved locally, newest first"
                      />
                      {state.reviews.map((r) => (
                        <article className="review" key={r.id}>
                          <div>
                            <span className="eyebrow">
                              {new Date(r.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  timeZone: "Asia/Kuala_Lumpur",
                                },
                              )}
                            </span>
                            <span className="tag">{r.outcome}</span>
                          </div>
                          <h3>
                            {r.sessionId === session.id
                              ? session.title
                              : pastSessions.find((s) => s.id === r.sessionId)
                                  ?.title}
                          </h3>
                          <p>{r.summary}</p>
                          <small>
                            {r.focusAreas.join(" · ") || "General reflection"}
                          </small>
                        </article>
                      ))}
                    </section>
                  </div>
                </>
              )}
              {!nav.some((n) => n[0] === path) && path !== "/overview" && (
                <Empty text="This page doesn’t exist. Use the navigation to return to your workspace." />
              )}
            </>
          )}
        </main>
      </div>
      <nav className="mobile-nav">
        {nav.map(([p, label, Icon]) => (
          <a
            key={p}
            href={`#${p}`}
            aria-label={label}
            className={path === p ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              go(p);
            }}
          >
            <Icon size={20} />
            <span>{label.split(" ")[0]}</span>
          </a>
        ))}
      </nav>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {detail && (
        <Modal
          close={() => setDetail(null)}
          title={"title" in detail ? detail.title : detail.name}
        >
          {"title" in detail ? (
            <>
              <div className="drill-tags">
                <span className="tag">{detail.category}</span>
                <span>
                  {detail.defaultMinutes} min · {detail.minPlayers}+ players ·{" "}
                  {detail.difficulty}
                </span>
              </div>
              <p className="lead">{detail.objective}</p>
              <h3>Set it up</h3>
              <p>{detail.setup}</p>
              <p className="muted">
                Equipment: {detail.equipment.join(", ")} · {detail.field} field
              </p>
              <h3>Run the drill</h3>
              <ol>
                {detail.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <div className="coaching-cue">
                <span className="eyebrow">COACHING CUES</span>
                {detail.coachingCues.map((c) => (
                  <p key={c}>{c}</p>
                ))}
              </div>
              <h3>Make it fit your team</h3>
              <p>
                <strong>Easier:</strong> {detail.variations.easier}
              </p>
              <p>
                <strong>Harder:</strong> {detail.variations.harder}
              </p>
              {!playerView && (
                <button
                  className="button primary wide"
                  onClick={() => {
                    setPlan((p) => ({
                      ...p,
                      status: "draft",
                      items: [
                        ...p.items,
                        {
                          id: uid(),
                          drillId: detail.id,
                          durationMinutes: detail.defaultMinutes,
                          notes: "",
                          order: p.items.length,
                        },
                      ],
                    }));
                    setDetail(null);
                    go("/planner");
                    setNotice("Activity added to your working plan.");
                  }}
                >
                  <Plus size={16} /> Add to training plan
                </button>
              )}
            </>
          ) : (
            <>
              <div className="profile-intro">
                <span className="avatar">
                  {detail.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <span>
                  {detail.role} · {detail.level}
                  <small>{detail.availability} for Sunday</small>
                </span>
              </div>
              <h3>Development goals</h3>
              <ul>
                {detail.developmentGoals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <h3>Coach feedback</h3>
              {state.observations
                .filter((o) => o.playerId === detail.id)
                .map((o) => (
                  <blockquote key={o.id}>{o.note}</blockquote>
                ))}
              {!state.observations.some((o) => o.playerId === detail.id) && (
                <p className="muted">
                  No individual notes yet. Tag this player during Live Coaching
                  to capture feedback.
                </p>
              )}
              <p className="fineprint">
                Fictional player profile. Goals are coach-entered demo data.
              </p>
            </>
          )}
        </Modal>
      )}
      {endOpen && (
        <Modal title="Bring the team in." close={() => setEndOpen(false)}>
          <p>
            End the live session and capture a short reflection? Your
            observations are already saved.
          </p>
          <div className="modal-actions">
            <button
              className="button outline"
              onClick={() => setEndOpen(false)}
            >
              Keep coaching
            </button>
            <button
              className="button primary"
              onClick={() => {
                setRunning(false);
                setState((s) => ({
                  ...s,
                  session: { ...s.session, status: "completed" },
                }));
                setEndOpen(false);
                go("/insights");
              }}
            >
              End & review <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function CardTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function SearchBox({
  value,
  set,
  placeholder,
}: {
  value: string;
  set: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <Search size={18} />
      <span className="sr-only">{placeholder}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="card empty">
      <Compass size={32} />
      <p>{text}</p>
    </div>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const list = ref.current?.querySelectorAll<HTMLElement>(
            "button,input,select,textarea,[href]",
          );
          if (!list?.length) return;
          const first = list[0],
            last = list[list.length - 1];
          if (
            e.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === ref.current)
          ) {
            e.preventDefault();
            last.focus();
          } else if (
            !e.shiftKey &&
            (document.activeElement === last ||
              document.activeElement === ref.current)
          ) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
