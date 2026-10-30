import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const preview = process.argv[2] === "--preview" ? process.argv[3] : undefined;
if (
  process.argv.length > 2 &&
  (!preview || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(preview))
) {
  throw new Error(
    "Usage: node scripts/deploy-pages.mjs [--preview simple-name]",
  );
}
const run = (args, cwd = root) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
const remote = run(["remote", "get-url", "origin"]);
const name = run(["config", "user.name"]);
const email = run(["config", "user.email"]);
const temp = mkdtempSync(join(tmpdir(), "northstar-pages-"));
try {
  run(["init", "-b", "gh-pages"], temp);
  run(["remote", "add", "origin", remote], temp);
  run(["config", "user.name", name], temp);
  run(["config", "user.email", email], temp);
  const existing = run(["ls-remote", "origin", "refs/heads/gh-pages"], temp);
  if (existing) {
    run(["fetch", "--depth=1", "origin", "gh-pages"], temp);
    run(["checkout", "-B", "gh-pages", "FETCH_HEAD"], temp);
  }
  const target = preview ? join(temp, "previews", preview) : temp;
  if (preview) {
    rmSync(target, { recursive: true, force: true });
  } else {
    for (const file of readdirSync(temp)) {
      if (file !== ".git" && file !== "previews")
        rmSync(join(temp, file), { recursive: true, force: true });
    }
  }
  cpSync(join(root, "dist"), target, { recursive: true });
  writeFileSync(join(temp, ".nojekyll"), "");
  run(["add", "--all"], temp);
  if (existing && !run(["diff", "--cached", "--name-only"], temp)) {
    console.log("GitHub Pages branch already contains this build.");
  } else {
    run(
      [
        "commit",
        "-m",
        `Deploy preview from ${run(["rev-parse", "--short", "HEAD"])}`,
      ],
      temp,
    );
    console.log(run(["push", "origin", "HEAD:gh-pages"], temp));
    console.log(
      preview
        ? `Published separate preview: /ultimate-team-os/previews/${preview}/`
        : "Published build to gh-pages. Enable that branch in GitHub Settings → Pages.",
    );
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
