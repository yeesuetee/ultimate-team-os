# Ultimate Team OS — Coach Assistant

A frontend-only, mobile-friendly coaching demo for the fictional Northstar Ultimate team. React, TypeScript, Vite and Tailwind CSS. No account, server, environment variables or API keys.

## Development

Use Node.js 22.18+ (Node 24 recommended).

```sh
npm install
npm run dev
```

## Validation and deployment

```sh
npm test
npm run build
npm run preview
```

Deploy `dist` as a static site. Relative asset paths and hash-based routes (for example, `/#/planner`) support GitHub Pages project subdirectories and direct refresh without server rewrites.

### GitHub Pages

Run `npm run deploy:pages` from the repository with GitHub push access. This builds the app and commits the generated files to `gh-pages`, preserving its history and rejecting concurrent updates. It uses the repository’s configured Git author. It does not enable Pages settings.

In GitHub → Settings → Pages, select **Deploy from a branch**, then **gh-pages** and **/ (root)**, and save. Once GitHub finishes publishing, the preview is at `https://yeesuetee.github.io/ultimate-team-os/`. Repeat the deploy command after future source changes. Pages availability for a private repository depends on the repository’s GitHub plan and organization policy.

## Demo lifecycle

Open Overview → Training planner → adjust constraints → Generate plan → edit/reorder/swap activities → Save draft / Publish plan. Published sessions appear in the read-only player view. Live Coaching uses the saved session; start/pause/reset the timer, advance activities, extend by five minutes and capture player-tagged observations. End the session to record a review in Reviews & Insights. Reviews contribute to deterministic recommendations; supporting evidence remains visible.

Players includes 28 fictional people (18 confirmed, 5 maybe, 5 unavailable initially). Attendance changes can be applied to a draft with **Use RSVP count**. All local data is persisted through `src/domain.ts`; reset from the desktop sidebar, or the reset action in the page footer. Live timer state itself resets on reload; no background notification is promised. Explicit save commits a planner draft; unsaved planner changes remain in memory while navigating.

Recommendation rules use focus frequency, recency and review tags; charts are illustrative dummy data, never measured performance. Training constraints and candidate drill requirements are checked locally. Grouping uses position and alternating allocation; it does not infer ability from personal characteristics.

## Project structure

- `src/data.ts`: typed fictional roster, 12 complete drills, training session, historical sessions and observations.
- `src/domain.ts`: demo repository, attendance, plan generation, timing, grouping and recommendation rules.
- `src/main.tsx`: six routed screens, accessible dialogs, countdown and interactions.
- `src/style.css`: responsive athletic design and mobile navigation.
- `src/domain.test.ts`: domain acceptance checks using the Node test runner.

The supplied specification was used as product context. No backend or real AI integration is included.

## Solo coach experiment

Branch: `feature/solo-coach-stats`. The home screen focuses on one-person sideline capture. Start an empty session, record team-level goals and turnovers with one tap, undo the last tap, and optionally reveal passes/blocks or tag a player. Finish to get transparent counts, logged-pass completion with its denominator, one rules-based next step, and a CSV export. Finished logs remain available and can be resumed. Example data is opt-in and read-only. Logs persist only on this browser/device, separately from the original training demo. Clearing browser storage removes them.

The existing training dashboard remains accessible through **Training workspace**. Capture does not pretend to measure complete match performance: missed events and selective capture affect the summary.

To publish this branch later without replacing the existing Pages homepage, run:

```sh
npm run deploy:solo
```

This writes only `previews/solo-coach/` on `gh-pages`, preserving the root site and other previews. After Pages publishes, its URL is `https://yeesuetee.github.io/ultimate-team-os/previews/solo-coach/`. The deploy script preserves `previews/` during future root deployments too. Publication is separate from pushing the source branch.

### IMPACT visual theme

The solo-coach branch uses `#6a0b0b` for primary actions and branding, paired with warm ivory surfaces, stone text and restrained bronze accents. Amber remains reserved for warnings. `src/theme.css` contains the shared brand overrides. `public/impact-logo.png` is a web adaptation of the supplied IMPACT wordmark and flying-disc motif, used in the desktop sidebar and mobile header. Ultimate Team OS wording and the fictional Northstar demo roster remain in place.
