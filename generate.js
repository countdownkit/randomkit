/*
 * Static generator for the Random Generator site.
 * Run: node generate.js   ->   writes everything into ./public
 *
 * The artifact IS the page: each page server-renders a real generator UI
 * (controls + result area + Generate button) so it works with no JS and ranks
 * for its query. assets/tool.js makes it live using assets/rnd.js. The
 * server-rendered result is a FIXED placeholder — no randomness is baked into
 * the build, so rebuilds are byte-identical.
 *
 * Page families:
 *   /<slug>/   one generator per page (data/random.json)
 *   /          homepage, generators grouped
 */
const fs = require("fs");
const path = require("path");

// ---- config -------------------------------------------------------------
const DOMAIN = process.env.DOMAIN || "https://random.elevatedprogress.com";
const BASE = process.env.BASE || "";
const SITE = "Random Generator";
const OUT = path.join(__dirname, "public");
const ASSETS = path.join(__dirname, "assets");
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "random.json"), "utf8"));
const DIE_OPTS = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

// ---- html layout --------------------------------------------------------
function layout({ title, desc, urlPath, h1, body }) {
  const canonical = DOMAIN + BASE + urlPath;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="${BASE}/styles.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5580575158570188" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TJY4TRRKD6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-TJY4TRRKD6');</script>
</head>
<body>
<header class="site-head"><div class="wrap">
  <a class="brand" href="${BASE}/">🎲 ${SITE}</a>
  <nav class="nav"><a href="${BASE}/#numbers">Numbers</a><a href="${BASE}/#teams">Teams</a><a href="${BASE}/#fun">Fun</a></nav>
</div></header>
<main class="wrap">
  <div class="crumbs"><a href="${BASE}/">Home</a> ›&nbsp;${h1}</div>
  <h1>${h1}</h1>
  ${body}
</main>
<footer class="site-foot"><div class="wrap">
  <a href="${BASE}/">Home</a><a href="${BASE}/#numbers">Numbers &amp; dice</a><a href="${BASE}/#teams">Names &amp; teams</a><a href="${BASE}/#fun">Fun</a>
  <span>· ${SITE} — free random generators. No downloads, no signups: everything runs in your browser. Part of <a href="https://elevatedprogress.com/">Elevated Progress</a>. · <a href="https://elevatedprogress.com/privacy/">Privacy Policy</a></span>
</div></footer>
<script src="${BASE}/rnd.js"></script>
<script src="${BASE}/tool.js" defer></script>
</body>
</html>`;
}

function grid(links) {
  return `<div class="grid">` + links.map(l =>
    `<a href="${BASE}${l.href}">${l.emoji ? `<span class="chip-emoji">${l.emoji}</span>` : ""}${l.label}</a>`).join("") + `</div>`;
}

// ---- controls per generator type ----------------------------------------
function field(label, inner) {
  return `<div><label>${label}</label>${inner}</div>`;
}
function bigField(label, inner) {
  return `<div class="titlecell"><label>${label}</label>${inner}</div>`;
}
function numInput(name, value, extra) {
  return `<input type="number" data-ctl="${name}" value="${value}"${extra || ""}>`;
}
function select(name, opts) {
  return `<select data-ctl="${name}">${opts.map(o =>
    `<option value="${o.v}"${o.sel ? " selected" : ""}>${o.t}</option>`).join("")}</select>`;
}
function textarea(name, value) {
  return `<textarea data-ctl="${name}" spellcheck="false">${value}</textarea>`;
}

function controlRows(type, cfg) {
  switch (type) {
    case "number":
      return `<div class="row">
        ${field("Minimum", numInput("min", cfg.min))}
        ${field("Maximum", numInput("max", cfg.max))}
        ${field("How many", numInput("count", cfg.count, ' min="1"'))}
      </div>
      <div class="row">
        ${field("Allow duplicates", select("dupes", [{ v: "1", t: "Yes", sel: cfg.dupes !== 0 }, { v: "0", t: "No", sel: cfg.dupes === 0 }]))}
        ${field("Sort results", select("sort", [
        { v: "none", t: "No sorting", sel: cfg.sort === "none" },
        { v: "asc", t: "Low to high", sel: cfg.sort === "asc" },
        { v: "desc", t: "High to low", sel: cfg.sort === "desc" }]))}
      </div>`;
    case "dice":
      return `<div class="row">
        ${field("Dice type", select("die", DIE_OPTS.map(d => ({ v: d, t: d, sel: d === cfg.die }))))}
        ${field("How many dice", numInput("count", cfg.count, ' min="1"'))}
      </div>`;
    case "coin":
      return `<div class="row">
        ${field("How many coins", numInput("count", cfg.count, ' min="1"'))}
      </div>`;
    case "letter":
      return `<div class="row">
        ${field("How many letters", numInput("count", cfg.count, ' min="1"'))}
        ${field("Letter case", select("case", [
        { v: "upper", t: "UPPERCASE", sel: cfg.case === "upper" },
        { v: "lower", t: "lowercase", sel: cfg.case === "lower" },
        { v: "mixed", t: "Mixed", sel: cfg.case === "mixed" }]))}
      </div>`;
    case "team":
      return `<div class="row">
        ${bigField("Names (one per line)", textarea("names", cfg.names))}
        ${field("Number of teams", numInput("teams", cfg.teams, ' min="1"'))}
      </div>`;
    case "group":
      return `<div class="row">
        ${bigField("Names (one per line)", textarea("names", cfg.names))}
        ${field("People per group", numInput("size", cfg.size, ' min="1"'))}
      </div>`;
    case "listpick":
      return `<div class="row">
        ${bigField("Your list (one item per line)", textarea("list", cfg.list))}
        ${field("How many to pick", numInput("count", cfg.count, ' min="1"'))}
      </div>`;
    case "color":
      return `<div class="row">
        ${field("How many colors", numInput("count", cfg.count, ' min="1"'))}
      </div>`;
    case "yesno":
      return `<div class="row">
        ${bigField("Your question (optional)", `<input type="text" data-ctl="q" value="${cfg.q || ""}" placeholder="e.g. Should I order pizza?">`)}
      </div>`;
    default:
      return "";
  }
}

const GEN_LABEL = {
  number: "Generate number", dice: "Roll dice", coin: "Flip", letter: "Generate letter",
  team: "Make teams", group: "Make groups", listpick: "Pick", color: "Generate color", yesno: "Decide"
};

// ---- write helpers ------------------------------------------------------
const urls = [];
function writePage(urlPath, html) {
  const dir = path.join(OUT, urlPath.replace(/^\/+|\/+$/g, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  urls.push(urlPath);
}

// ---- page builder -------------------------------------------------------
function toolPage(page, related, relatedLabel) {
  const genLabel = GEN_LABEL[page.type] || "Generate";
  const body = `<p class="lead">${page.blurb}</p>
  <div class="tool" data-tool="${page.type}">
    <div class="controls">
      ${controlRows(page.type, page.cfg)}
      <div class="ctl-foot">
        <button type="button" class="gen-btn" data-ctl="generate">🎲 ${genLabel}</button>
        <button type="button" class="copy-btn" data-ctl="copy">Copy result</button>
        <span class="hint">Runs in your browser · nothing is uploaded</span>
      </div>
    </div>
    <div class="result-area" data-result><div class="result-empty">Press <b>&nbsp;${genLabel}&nbsp;</b> to see a result.</div></div>
  </div>
  <div class="ad-slot">Advertisement</div>
  <div class="prose">
    <p>${page.tip}</p>
    <p><b>No JavaScript, no results:</b> this generator needs JavaScript enabled to produce random output — the page and controls still load, but the Generate button won't do anything without it. Nothing is ever sent to a server.</p>
  </div>
  <h2>${relatedLabel}</h2>
  ${grid(related)}
  <div class="ad-slot">Advertisement</div>`;
  writePage(`/${page.slug}/`, layout({
    title: page.title, desc: page.desc, urlPath: `/${page.slug}/`, h1: page.h1, body
  }));
}

// ---- build --------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });
for (const entry of fs.readdirSync(OUT)) {
  if (entry === ".git" || entry === "CNAME") continue;
  fs.rmSync(path.join(OUT, entry), { recursive: true, force: true });
}
for (const f of fs.readdirSync(ASSETS)) fs.copyFileSync(path.join(ASSETS, f), path.join(OUT, f));

const pageLink = p => ({ href: `/${p.slug}/`, emoji: p.emoji, label: p.label });

// one page per generator; related = same-group siblings, then a couple cross-links
for (const page of DATA.pages) {
  const sameGroup = DATA.pages.filter(p => p.group === page.group && p.slug !== page.slug);
  const otherGroups = DATA.pages.filter(p => p.group !== page.group);
  const related = sameGroup.concat(otherGroups).slice(0, 6).map(pageLink);
  toolPage(page, related, "More random generators");
}

// -- homepage --
{
  const title = `Random Generator — Numbers, Dice, Teams, Colors & More`;
  const desc = `Free random generators: random numbers, dice roller, coin flip, random letters, team and group splitters, list picker, random colors, and yes/no. Instant, no signup.`;
  let sections = "";
  for (const g of DATA.groups) {
    const links = DATA.pages.filter(p => p.group === g.id).map(pageLink);
    sections += `<h2 id="${g.id}">${g.label}</h2>\n  ${grid(links)}\n  `;
  }
  const body = `<p class="lead">Simple, instant random generators — pick one, set your options, and press Generate. Everything runs in your browser using its built-in secure randomness, so nothing is uploaded and there's nothing to install.</p>
  ${sections}
  <div class="ad-slot">Advertisement</div>
  <div class="prose"><p>Every tool here is a real, working generator, not a preview: the controls you see are the ones that produce the result. Numbers respect your range exactly, teams split as evenly as the count allows, and picks never repeat within a single draw. All of it is free and needs no account.</p></div>`;
  writePage(`/`, layout({ title, desc, urlPath: `/`, h1: `Random Generators`, body }));
}

// -- sitemap + robots + meta files --
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${DOMAIN}${BASE}${u}</loc></url>`).join("\n")}
</urlset>`;
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}${BASE}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
fs.writeFileSync(path.join(OUT, "CNAME"), "random.elevatedprogress.com\n");
fs.writeFileSync(path.join(OUT, "ads.txt"), "google.com, pub-5580575158570188, DIRECT, f08c47fec0942fa0\n");

console.log(`Generated ${urls.length} pages into ./public`);
