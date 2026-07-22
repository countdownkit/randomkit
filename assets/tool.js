/*
 * Client-side interactivity for the random generators. The page is server-
 * rendered (SEO + no-JS gets a real UI); this script makes it live: read the
 * controls, compute a genuinely random result via RND, render it into the
 * result area, and wire the copy button. One .tool root per page.
 */
(function () {
  var RND = window.RND;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function initTool(root) {
    var type = root.getAttribute("data-tool");
    var resultEl = root.querySelector("[data-result]");
    var genBtn = root.querySelector('[data-ctl="generate"]');
    var copyBtn = root.querySelector('[data-ctl="copy"]');

    function ctl(name) { return root.querySelector('[data-ctl="' + name + '"]'); }
    function val(name) { var el = ctl(name); return el ? el.value : ""; }
    function num(name, dflt) { var n = parseInt(val(name), 10); return isNaN(n) ? dflt : n; }
    function lines(name) {
      return val(name).split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    }
    function empty(msg) { return { html: '<div class="result-empty">' + esc(msg) + "</div>", text: "" }; }

    var GEN = {
      number: function () {
        var min = num("min", 0), max = num("max", 100);
        var count = Math.max(1, num("count", 1));
        var dupes = val("dupes") !== "0";
        var sort = val("sort");
        if (min > max) { var t = min; min = max; max = t; }
        var range = max - min + 1;
        var nums = [];
        if (dupes) {
          for (var i = 0; i < count; i++) nums.push(RND.randInt(min, max));
        } else {
          count = Math.min(count, range);
          var pool = [];
          for (var v = min; v <= max; v++) pool.push(v);
          RND.shuffle(pool);
          nums = pool.slice(0, count);
        }
        if (sort === "asc") nums.sort(function (a, b) { return a - b; });
        else if (sort === "desc") nums.sort(function (a, b) { return b - a; });
        return {
          html: '<div class="nums">' + nums.map(function (n) {
            return '<span class="rnum">' + n + "</span>";
          }).join("") + "</div>",
          text: nums.join(", ")
        };
      },

      dice: function () {
        var die = val("die") || "d6";
        var faces = parseInt(die.slice(1), 10) || 6;
        var count = Math.max(1, num("count", 1));
        var rolls = [], sum = 0;
        for (var i = 0; i < count; i++) { var r = RND.randInt(1, faces); rolls.push(r); sum += r; }
        return {
          html: '<div class="dice">' + rolls.map(function (r) {
            return '<span class="die" data-val="' + r + '">' + r + "</span>";
          }).join("") + "</div>" +
            '<div class="sum" data-sum="' + sum + '">Total: <b>' + sum + "</b></div>",
          text: rolls.join(", ") + " (total " + sum + ")"
        };
      },

      coin: function () {
        var count = Math.max(1, num("count", 1));
        var seq = [], heads = 0;
        for (var i = 0; i < count; i++) {
          var f = RND.randInt(0, 1);
          if (f) heads++;
          seq.push(f ? "Heads" : "Tails");
        }
        var tails = count - heads;
        return {
          html: '<div class="coins">' + seq.map(function (s) {
            return '<span class="coin ' + (s === "Heads" ? "h" : "t") + '">' + s + "</span>";
          }).join("") + "</div>" +
            '<div class="tally">Heads: <b>' + heads + "</b> · Tails: <b>" + tails + "</b></div>",
          text: seq.join(", ") + " — Heads " + heads + ", Tails " + tails
        };
      },

      letter: function () {
        var count = Math.max(1, num("count", 1));
        var cs = val("case") || "upper";
        var out = [];
        for (var i = 0; i < count; i++) {
          var c = String.fromCharCode(65 + RND.randInt(0, 25));
          if (cs === "lower") c = c.toLowerCase();
          else if (cs === "mixed") c = RND.randInt(0, 1) ? c : c.toLowerCase();
          out.push(c);
        }
        return {
          html: '<div class="nums">' + out.map(function (c) {
            return '<span class="rnum">' + c + "</span>";
          }).join("") + "</div>",
          text: out.join(", ")
        };
      },

      team: function () {
        var names = lines("names");
        var t = Math.max(1, num("teams", 2));
        if (!names.length) return empty("Add some names first — one per line.");
        var pool = names.slice();
        RND.shuffle(pool);
        var teams = [];
        for (var i = 0; i < t; i++) teams.push([]);
        pool.forEach(function (n, i) { teams[i % t].push(n); });
        return { html: groupsHtml(teams, "Team"), text: groupsText(teams, "Team") };
      },

      group: function () {
        var names = lines("names");
        var size = Math.max(1, num("size", 2));
        if (!names.length) return empty("Add some names first — one per line.");
        var pool = names.slice();
        RND.shuffle(pool);
        var groups = [];
        for (var i = 0; i < pool.length; i += size) groups.push(pool.slice(i, i + size));
        return { html: groupsHtml(groups, "Group"), text: groupsText(groups, "Group") };
      },

      listpick: function () {
        var items = lines("list");
        var count = Math.max(1, num("count", 1));
        if (!items.length) return empty("Add some options first — one per line.");
        var pool = items.slice();
        RND.shuffle(pool);
        count = Math.min(count, pool.length);
        var picks = pool.slice(0, count);
        return {
          html: '<div class="picks">' + picks.map(function (p) {
            return '<div class="pick">' + esc(p) + "</div>";
          }).join("") + "</div>",
          text: picks.join("\n")
        };
      },

      color: function () {
        var count = Math.max(1, num("count", 1));
        var cols = [];
        for (var i = 0; i < count; i++) {
          var hex = "#";
          for (var j = 0; j < 3; j++) {
            var h = RND.randInt(0, 255).toString(16);
            hex += h.length < 2 ? "0" + h : h;
          }
          cols.push(hex.toUpperCase());
        }
        return {
          html: '<div class="colors">' + cols.map(function (c) {
            return '<div class="swatch"><span class="chip" style="background:' + c +
              '"></span><code>' + c + "</code></div>";
          }).join("") + "</div>",
          text: cols.join(", ")
        };
      },

      yesno: function () {
        var ans = RND.randInt(0, 1) ? "YES" : "NO";
        var q = val("q").trim();
        return {
          html: (q ? '<div class="q">' + esc(q) + "</div>" : "") +
            '<div class="verdict ' + (ans === "YES" ? "yes" : "no") + '">' + ans + "</div>",
          text: (q ? q + " — " : "") + ans
        };
      }
    };

    function groupsHtml(groups, label) {
      return '<div class="teams">' + groups.map(function (g, i) {
        return '<div class="team-col"><h4>' + label + " " + (i + 1) +
          ' <span class="cnt">(' + g.length + ')</span></h4><ul>' +
          g.map(function (m) { return '<li class="member">' + esc(m) + "</li>"; }).join("") +
          "</ul></div>";
      }).join("") + "</div>";
    }
    function groupsText(groups, label) {
      return groups.map(function (g, i) {
        return label + " " + (i + 1) + ": " + g.join(", ");
      }).join("\n");
    }

    function run() {
      var gen = GEN[type];
      if (!gen) return;
      var out = gen();
      resultEl.innerHTML = out.html;
      resultEl.setAttribute("data-copy", out.text || "");
      if (copyBtn) copyBtn.disabled = !out.text;
      if (typeof window.gtag === "function") window.gtag("event", "tool_use", { action: "generate" });
    }

    function copy() {
      var text = resultEl.getAttribute("data-copy") || "";
      if (!text) return;
      var done = function () {
        var old = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = old; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    }

    if (genBtn) genBtn.addEventListener("click", run);
    if (copyBtn) { copyBtn.addEventListener("click", copy); copyBtn.disabled = true; }
    // Enter inside a single-line input triggers a generate.
    root.querySelectorAll('input[type="number"], input[type="text"]').forEach(function (el) {
      el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); run(); } });
    });
  }

  function boot() {
    var tools = document.querySelectorAll(".tool");
    for (var i = 0; i < tools.length; i++) initTool(tools[i]);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
