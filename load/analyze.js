// Wertet die k6-JSON-Zeitreihen aus und erzeugt abhängigkeitsfreie SVG-Diagramme
// (Latenz & VUs über Zeit, Durchsatz über Zeit) sowie eine Markdown-Ergebnistabelle.
//
// Aufruf:  node load/analyze.js
const fs = require("fs");
const path = require("path");

const RESULTS = path.join(__dirname, "results");
const CHARTS = path.join(__dirname, "charts");
fs.mkdirSync(CHARTS, { recursive: true });

const TESTS = [
  { key: "articles-load", title: "Load Test – GET /api/articles" },
  { key: "auth-stress", title: "Stress/Spike – POST /api/users/login" },
];

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

// Liest k6 JSON-lines und gruppiert Punkte je Sekunde.
function parse(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  let t0 = null;
  const bins = new Map(); // second -> { dur:[], reqs, failed, vus }

  for (const line of lines) {
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (rec.type !== "Point" || !rec.data) continue;
    const t = Date.parse(rec.data.time);
    if (t0 === null || t < t0) t0 = t;
  }

  for (const line of lines) {
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (rec.type !== "Point" || !rec.data) continue;
    const sec = Math.floor((Date.parse(rec.data.time) - t0) / 1000);
    if (!bins.has(sec)) bins.set(sec, { dur: [], reqs: 0, failed: 0, vus: 0 });
    const b = bins.get(sec);
    const v = rec.data.value;
    switch (rec.metric) {
      case "http_req_duration":
        b.dur.push(v);
        break;
      case "http_reqs":
        b.reqs += v;
        break;
      case "http_req_failed":
        b.failed += v;
        break;
      case "vus":
        b.vus = Math.max(b.vus, v);
        break;
    }
  }

  const secs = [...bins.keys()].sort((a, b) => a - b);
  const series = secs.map((s) => {
    const b = bins.get(s);
    const sorted = [...b.dur].sort((a, b) => a - b);
    return {
      t: s,
      avg: b.dur.reduce((x, y) => x + y, 0) / (b.dur.length || 1),
      p95: percentile(sorted, 95),
      rps: b.reqs,
      vus: b.vus,
      failedRate: b.reqs ? b.failed / b.reqs : 0,
    };
  });

  // Gesamt-Kennzahlen
  const allDur = [];
  let totalReqs = 0,
    totalFailed = 0,
    maxVus = 0;
  for (const b of bins.values()) {
    allDur.push(...b.dur);
    totalReqs += b.reqs;
    totalFailed += b.failed;
    maxVus = Math.max(maxVus, b.vus);
  }
  allDur.sort((a, b) => a - b);
  const summary = {
    reqs: totalReqs,
    failedPct: totalReqs ? (100 * totalFailed) / totalReqs : 0,
    avg: allDur.reduce((x, y) => x + y, 0) / (allDur.length || 1),
    p90: percentile(allDur, 90),
    p95: percentile(allDur, 95),
    max: allDur.length ? allDur[allDur.length - 1] : 0,
    maxVus,
    durationSec: secs.length ? secs[secs.length - 1] : 0,
  };
  return { series, summary };
}

// ---- SVG-Helfer -------------------------------------------------------------
const W = 760,
  H = 360,
  M = { t: 40, r: 60, b: 45, l: 60 };
const plotW = W - M.l - M.r,
  plotH = H - M.t - M.b;

function scaleX(t, tMax) {
  return M.l + (tMax ? (t / tMax) * plotW : 0);
}
function scaleY(v, vMax) {
  return M.t + plotH - (vMax ? (v / vMax) * plotH : 0);
}
function polyline(series, tMax, vMax, color) {
  const pts = series
    .map((d) => `${scaleX(d.x, tMax).toFixed(1)},${scaleY(d.y, vMax).toFixed(1)}`)
    .join(" ");
  return `<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}"/>`;
}
function yGrid(vMax, unit, color = "#888") {
  let out = "";
  for (let i = 0; i <= 4; i++) {
    const v = (vMax / 4) * i;
    const y = scaleY(v, vMax);
    out += `<line x1="${M.l}" y1="${y}" x2="${M.l + plotW}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`;
    out += `<text x="${M.l - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="${color}">${v.toFixed(0)}${unit}</text>`;
  }
  return out;
}
function xAxis(tMax, color = "#888") {
  let out = `<line x1="${M.l}" y1="${M.t + plotH}" x2="${M.l + plotW}" y2="${M.t + plotH}" stroke="#374151"/>`;
  for (let i = 0; i <= 5; i++) {
    const t = (tMax / 5) * i;
    const x = scaleX(t, tMax);
    out += `<text x="${x}" y="${M.t + plotH + 18}" text-anchor="middle" font-size="11" fill="${color}">${t.toFixed(0)}s</text>`;
  }
  return out;
}
function legend(items) {
  return items
    .map((it, i) => {
      const x = M.l + 10 + i * 175;
      const y = M.t - 18;
      return `<rect x="${x}" y="${y - 9}" width="14" height="4" fill="${it.color}"/><text x="${x + 20}" y="${y - 4}" font-size="12" fill="#111">${it.label}</text>`;
    })
    .join("");
}
function svgWrap(title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif">
<rect width="${W}" height="${H}" fill="white"/>
<text x="${W / 2}" y="22" text-anchor="middle" font-size="15" font-weight="bold" fill="#111">${title}</text>
${body}
</svg>`;
}

function latencyChart(title, series) {
  const tMax = Math.max(...series.map((d) => d.t), 1);
  const latMax = Math.max(...series.map((d) => d.p95), 1) * 1.1;
  const vuMax = Math.max(...series.map((d) => d.vus), 1) * 1.1;

  const avgLine = polyline(series.map((d) => ({ x: d.t, y: d.avg })), tMax, latMax, "#2563eb");
  const p95Line = polyline(series.map((d) => ({ x: d.t, y: d.p95 })), tMax, latMax, "#dc2626");
  // VUs auf rechter Achse (eigene Skala) -> auf latMax mappen
  const vuLine = polyline(
    series.map((d) => ({ x: d.t, y: (d.vus / vuMax) * latMax })),
    tMax,
    latMax,
    "#16a34a",
  );

  let rightAxis = "";
  for (let i = 0; i <= 4; i++) {
    const vu = (vuMax / 4) * i;
    const y = scaleY((vu / vuMax) * latMax, latMax);
    rightAxis += `<text x="${M.l + plotW + 8}" y="${y + 4}" font-size="11" fill="#16a34a">${vu.toFixed(0)}</text>`;
  }

  const body = `${yGrid(latMax, "ms")}${xAxis(tMax)}${rightAxis}
<text x="14" y="${M.t + plotH / 2}" transform="rotate(-90 14 ${M.t + plotH / 2})" text-anchor="middle" font-size="11" fill="#111">Latenz (ms)</text>
<text x="${W - 14}" y="${M.t + plotH / 2}" transform="rotate(90 ${W - 14} ${M.t + plotH / 2})" text-anchor="middle" font-size="11" fill="#16a34a">VUs</text>
${avgLine}${p95Line}${vuLine}
${legend([{ label: "avg Latenz", color: "#2563eb" }, { label: "p95 Latenz", color: "#dc2626" }, { label: "VUs", color: "#16a34a" }])}`;
  return svgWrap(title, body);
}

function throughputChart(title, series) {
  const tMax = Math.max(...series.map((d) => d.t), 1);
  const rpsMax = Math.max(...series.map((d) => d.rps), 1) * 1.1;
  const rpsLine = polyline(series.map((d) => ({ x: d.t, y: d.rps })), tMax, rpsMax, "#7c3aed");
  const body = `${yGrid(rpsMax, "")}${xAxis(tMax)}
<text x="14" y="${M.t + plotH / 2}" transform="rotate(-90 14 ${M.t + plotH / 2})" text-anchor="middle" font-size="11" fill="#111">Durchsatz (req/s)</text>
${rpsLine}
${legend([{ label: "Requests/s", color: "#7c3aed" }])}`;
  return svgWrap(title, body);
}

// ---- Hauptlauf --------------------------------------------------------------
const rows = [];
const allSeries = {};
for (const test of TESTS) {
  const file = path.join(RESULTS, `${test.key}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`! fehlt: ${file} (Test zuerst ausführen)`);
    continue;
  }
  const { series, summary } = parse(file);
  fs.writeFileSync(path.join(CHARTS, `${test.key}-latency.svg`), latencyChart(`${test.title} – Latenz & Last`, series));
  fs.writeFileSync(path.join(CHARTS, `${test.key}-throughput.svg`), throughputChart(`${test.title} – Durchsatz`, series));
  allSeries[test.key] = series.map((d) => ({
    t: d.t,
    avg: Math.round(d.avg),
    p95: Math.round(d.p95),
    rps: d.rps,
    vus: d.vus,
  }));
  rows.push({ title: test.title, ...summary });
  console.log(`\n# ${test.title}`);
  console.log(`  Requests:     ${summary.reqs}`);
  console.log(`  Fehlerrate:   ${summary.failedPct.toFixed(2)} %`);
  console.log(`  Latenz avg:   ${summary.avg.toFixed(1)} ms`);
  console.log(`  Latenz p90:   ${summary.p90.toFixed(1)} ms`);
  console.log(`  Latenz p95:   ${summary.p95.toFixed(1)} ms`);
  console.log(`  Latenz max:   ${summary.max.toFixed(1)} ms`);
  console.log(`  max VUs:      ${summary.maxVus}`);
}

// Markdown-Tabelle für den Report
let md = "| Test | Requests | Fehler % | avg (ms) | p90 (ms) | p95 (ms) | max (ms) | max VUs |\n";
md += "|---|---|---|---|---|---|---|---|\n";
for (const r of rows) {
  md += `| ${r.title} | ${r.reqs} | ${r.failedPct.toFixed(2)} | ${r.avg.toFixed(1)} | ${r.p90.toFixed(1)} | ${r.p95.toFixed(1)} | ${r.max.toFixed(1)} | ${r.maxVus} |\n`;
}
fs.writeFileSync(path.join(RESULTS, "summary.md"), md);
fs.writeFileSync(path.join(RESULTS, "series.json"), JSON.stringify(allSeries));
console.log(`\nSVGs -> load/charts/, Tabelle -> load/results/summary.md, Serien -> load/results/series.json`);
