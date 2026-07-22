# CLAUDE.md — randomkit

Project instructions for Claude Code working in this repo. Inherits the ElevatedProgress
venture playbook from the parent folder's CLAUDE.md.

## What this is

A zero-dependency static-site generator for **free random generators** — random numbers, a
dice roller, coin flip, random letters, team/group splitters, a list picker, random colors,
and a yes/no decider. `generate.js` reads `data/random.json` + `assets/` and writes one page
per generator into `public/`. Target: https://random.elevatedprogress.com/. Consumer audience,
low ad-block, mass search demand ("random number generator", "random number 1-100", "team
generator", "dice roller"…). Preset pages (1–10, 1–100, 1–6) capture the long tail.

## The product rule

**The artifact IS the page — but this tool is INTERACTIVE, not printable.** Each page
server-renders the real generator UI (controls + big result area + Generate button) so it
works with no JS and ranks for its query. `assets/tool.js` makes it live: it reads the
controls, computes a genuinely random result, and renders it. `assets/rnd.js` holds the shared
randomness helpers (unbiased `randInt` via `crypto.getRandomValues` with rejection sampling,
Fisher–Yates `shuffle`) as a UMD module (same shape as calendarkit's `cal.js`).

**Reproducible builds:** the server-rendered result is a FIXED placeholder — never call
`Math.random`/`RND` in `generate.js`. Randomness only ever happens client-side on button
press, so `node generate.js` is byte-identical every run.

Correctness rules per generator (don't regress): numbers are inclusive of min AND max;
"no duplicates" draws without replacement (count capped to range); dice show each face and a
true sum; teams split as evenly as possible (round-robin deal); groups pack to the chosen size;
picks never repeat within one draw.

## Deploy — just push

`git push` to `main` is the deploy — GitHub Actions (`.github/workflows/deploy.yml`).

- **Never manually build and commit output.** `public/` is git-ignored build output.
- **Never hand-edit anything in `public/`.**
- Commit as the neutral identity:
  `git -c user.name="randomkit" -c user.email="randomkit@users.noreply.github.com" commit …`

## Local build / preview

```
node generate.js     # writes ./public, prints "Generated N pages"
node server.js       # preview at http://localhost:5079
```

## Page families

- `/<slug>/` — one generator per page, defined in `data/random.json` (`type` drives the
  controls + client logic; `cfg` sets the defaults baked into the server render).
- `/` — homepage, generators grouped (Numbers & dice / Names & teams / Fun).

Add a generator = add an entry to `data/random.json` (and, if it's a new `type`, a control
block in `controlRows()` + a `GEN[type]` implementation in `tool.js`).

## Don't break these (generated, must keep serving)

- `ads.txt` + AdSense loader in `<head>` — publisher `ca-pub-5580575158570188`.
- GA4 `G-TJY4TRRKD6` (shared across all EP sites; hostname splits them).
- `sitemap.xml`, `robots.txt`, `.nojekyll`, `CNAME` (random.elevatedprogress.com).
- GSC verification file once the property is verified.

## Config knobs

`DOMAIN` and `BASE`, same semantics as the other tools. Production values in the workflow.
