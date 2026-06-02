// report.js — report generation, SVG charts, history section
// v3.0.0 — imports: storage, ui

import { K, ls, fastState, checkins, doneFast, fastHistory, getProfile, getJournal } from './storage.js?v=3.0';
import { fmtDate, fmtDur, fmtDurStr } from './ui.js?v=3.0';

let _histSort = 'date';

export function setHistSort(key) {
  _histSort = key;
  renderReport();
}

// ── Main render ────────────────────────────────────────────────────
export function renderReport() {
  const el = document.getElementById('report-content');
  if (!el) return;
  const done  = doneFast();
  const state = fastState();

  if (!done && !state) {
    el.innerHTML = `<div class="start-hero fade">
      <span class="sh-icon">📈</span>
      <h2 class="sh-title">No Report Yet</h2>
      <p class="sh-sub">Complete your first fast to unlock your full body composition report.</p>
    </div>`;
    return;
  }

  if (state && !done) {
    const ms  = Date.now() - new Date(state.startTime).getTime();
    const cks = checkins();
    const lat = cks.length ? cks[cks.length - 1] : null;
    const lost = lat ? (state.startWeight - lat.weight).toFixed(1) : null;
    el.innerHTML = `
      <div class="report-hero fade">
        <span class="rh-icon">⚡</span>
        <div class="rh-title">Fast In Progress</div>
        <div class="rh-dur">${fmtDurStr(ms)}</div>
        <div class="rh-sub">End the fast to unlock the full report.</div>
      </div>
      ${lat ? `<div class="card fade">
        <div class="card-lbl">Current Progress</div>
        <div class="cr"><span class="cl">⚖️ Weight</span>
          <div class="cv"><span class="cf">${state.startWeight} kg</span><span class="ca">→</span>
          <span class="ct">${lat.weight} kg</span>${lost && parseFloat(lost) > 0 ? `<span class="cd">(−${lost} kg)</span>` : ''}</div></div>
        <div class="cr"><span class="cl">📊 Body Fat</span>
          <div class="cv"><span class="cf">${state.startBodyFat}%</span><span class="ca">→</span>
          <span class="ct">${lat.bodyFat}%</span></div></div>
      </div>` : ''}
      ${cks.length > 1 ? buildChart(cks) : ''}${buildWellbeingSparklines(cks)}`;
    return;
  }

  if (done) el.innerHTML = buildFullReport(done) + buildPersonalRecords() + buildHistorySection();
}

// ── Full report ────────────────────────────────────────────────────
function buildFullReport(d) {
  const { days, hours } = fmtDur(d.durationMs);
  const lost     = d.startWeight - d.finalWeight;
  const sFatKg   = d.startWeight * d.startBodyFat / 100;
  const fFatKg   = d.finalWeight  * d.finalFat    / 100;
  const fatLost  = Math.max(0, sFatKg - fFatKg);
  const leanLost = lost - fatLost;
  const fatPct   = lost > 0 ? Math.round(fatLost / lost * 100) : 0;
  const kcalFat  = (fatLost * 7700).toFixed(0);
  const p = getProfile();
  const name = p ? p.name : 'you';

  return `
    <div class="report-hero fade">
      <span class="rh-icon">🏆</span>
      <div class="rh-title">Fast Complete!</div>
      <div class="rh-dur">${days > 0 ? days + 'd ' : ''}${hours}h fasted</div>
      <div class="rh-sub">You did something extraordinary, ${name}.</div>
      <button class="btn btn-ghost btn-sm" id="btn-share-report" style="margin-top:12px">📸 &nbsp;Share Infographic</button>
    </div>
    <div class="card fade">
      <div class="card-lbl">Weight &amp; Body Composition</div>
      <div class="cr"><span class="cl">⚖️ Weight</span>
        <div class="cv"><span class="cf">${d.startWeight} kg</span><span class="ca">→</span>
        <span class="ct">${d.finalWeight} kg</span><span class="cd">−${Math.abs(lost).toFixed(1)} kg</span></div></div>
      <div class="cr"><span class="cl">📊 Body Fat</span>
        <div class="cv"><span class="cf">${d.startBodyFat}%</span><span class="ca">→</span>
        <span class="ct">${d.finalFat}%</span><span class="cd">−${Math.abs(d.startBodyFat - d.finalFat).toFixed(1)}%</span></div></div>
      <div class="cr"><span class="cl">🔥 Fat Mass (start)</span>
        <div class="cv"><span class="ct">${sFatKg.toFixed(2)} kg</span></div></div>
      <div class="cr"><span class="cl">🔥 Fat Mass (end)</span>
        <div class="cv"><span class="ct">${fFatKg.toFixed(2)} kg</span></div></div>
    </div>
    <div class="card fade">
      <div class="card-lbl">Weight Loss Breakdown</div>
      <p style="font-size:.81rem;color:var(--text2);margin-bottom:13px;line-height:1.55;">
        Of your <strong style="color:var(--text)">${Math.abs(lost).toFixed(2)} kg</strong> total loss:
      </p>
      <div class="bk-item">
        <div class="bk-dot" style="background:var(--red)"></div>
        <span class="bk-lbl">🔥 Actual Fat Mass Lost</span>
        <span class="bk-val" style="color:var(--grn)">${fatLost.toFixed(2)} kg <span class="bk-pct">(${fatPct}%)</span></span>
      </div>
      <div class="bk-item">
        <div class="bk-dot" style="background:var(--cyan)"></div>
        <span class="bk-lbl">💧 Lean Mass / Water / Glycogen</span>
        <span class="bk-val" style="color:var(--text2)">${Math.max(0, leanLost).toFixed(2)} kg <span class="bk-pct">(${100 - fatPct}%)</span></span>
      </div>
      <div class="bk-item">
        <div class="bk-dot" style="background:var(--gold)"></div>
        <span class="bk-lbl">⚡ Energy from Fat Burned</span>
        <span class="bk-val" style="color:var(--gold)">${Number(kcalFat).toLocaleString()} kcal</span>
      </div>
      <p style="font-size:.69rem;color:var(--text3);margin-top:11px;line-height:1.45;">
        * Calculated from body fat % measurements. Lean mass includes muscle, water, glycogen, bone, and organs.
        Most water/glycogen loss rehydrates within 24–48h of refeeding.
      </p>
    </div>
    <div class="card fade" style="margin-bottom:10px;">
      <div class="card-lbl">Refeeding Protocol</div>
      <p style="font-size:.84rem;color:var(--text2);line-height:1.65;">
        Break your fast gently — bone broth, diluted juice, or small easily digestible food first.
        Avoid large meals immediately. Replenish electrolytes (sodium, potassium, magnesium).
        Expect weight to temporarily rise as glycogen refills (~3–4g water per gram of glycogen).
      </p>
    </div>
    ${d.checkins && d.checkins.length > 1 ? buildChart(d.checkins) : ''}${buildWellbeingSparklines(d.checkins || [])}`;
}

// ── Personal records ───────────────────────────────────────────────
function buildPersonalRecords() {
  const hist = fastHistory();
  if (!hist.length) return '';
  const longest = hist.reduce((a, b) => a.durationMs > b.durationMs ? a : b);
  const bestWt  = hist.filter(f => f.startWeight && f.finalWeight)
                      .reduce((a, b) => (b.startWeight - b.finalWeight) > (a.startWeight - a.finalWeight) ? b : a, { startWeight: 0, finalWeight: 0 });
  const mostCks = hist.reduce((a, b) => ((b.checkins?.length || 0) > (a.checkins?.length || 0)) ? b : a);
  const allJ    = getJournal();
  const jPerFast = hist.map(f => ({ id: f.startTime, n: allJ.filter(e => e.fastId === f.startTime).length }));
  const mostJ   = jPerFast.reduce((a, b) => b.n > a.n ? b : a, { n: 0 });
  const rows = [
    { icon:'⏱', label:'Longest Fast',      val: fmtDurStr(longest.durationMs) },
    { icon:'⚖️', label:'Best Weight Loss',  val: bestWt.startWeight ? (bestWt.startWeight - bestWt.finalWeight).toFixed(1) + ' kg' : '—' },
    { icon:'📊', label:'Most Check-ins',    val: (mostCks.checkins?.length || 0) + ' in one fast' },
    { icon:'📔', label:'Most Journal Days', val: mostJ.n + ' entries in one fast' },
  ];
  return `<div class="card fade">
    <div class="card-lbl">🏆 Personal Records</div>
    ${rows.map(r => `<div class="info-row">
      <span class="ilab">${r.icon} ${r.label}</span>
      <span class="ival" style="color:var(--gold)">${r.val}</span>
    </div>`).join('')}
  </div>`;
}

// ── History section ────────────────────────────────────────────────
function buildHistorySection() {
  const hist = fastHistory();
  if (hist.length < 1) return '';
  return `
    <div style="margin-top:24px">
      <div class="card-lbl" style="padding:0 2px 6px;font-size:.75rem;letter-spacing:.1em;color:var(--text3);text-transform:uppercase;">📚 Fast History</div>
      ${buildHistoryStats(hist)}
      ${hist.length > 1 ? buildTrendChart(hist) : ''}
      ${hist.length > 1 ? buildComparisonTable(hist) : ''}
      ${hist.length > 1 ? `<div class="hist-sort-bar">
        <span style="color:var(--text3);font-size:.7rem">Sort:</span>
        <button class="sort-btn ${_histSort === 'date' ? 'active' : ''}" data-sort="date">Date</button>
        <button class="sort-btn ${_histSort === 'duration' ? 'active' : ''}" data-sort="duration">Duration</button>
        <button class="sort-btn ${_histSort === 'wtlost' ? 'active' : ''}" data-sort="wtlost">Wt Lost</button>
      </div>` : ''}
      ${buildFastList(hist)}
    </div>`;
}

function buildHistoryStats(hist) {
  const n = hist.length;
  const totalMs  = hist.reduce((s, f) => s + f.durationMs, 0);
  const longestMs = Math.max(...hist.map(f => f.durationMs));
  const totalWtLost  = hist.reduce((s, f) => s + (f.startWeight - f.finalWeight), 0);
  const totalFatLost = hist.reduce((s, f) => {
    const sf = f.startWeight * f.startBodyFat / 100;
    const ef = f.finalWeight  * f.finalFat    / 100;
    return s + Math.max(0, sf - ef);
  }, 0);
  return `<div class="card fade">
    <div class="card-lbl">All-Time Stats</div>
    <div class="cr"><span class="cl">🏅 Total Fasts</span><span class="cv ct">${n}</span></div>
    <div class="cr"><span class="cl">⏱️ Avg Duration</span><span class="cv ct">${fmtDurStr(totalMs / n)}</span></div>
    <div class="cr"><span class="cl">🏆 Longest Fast</span><span class="cv ct">${fmtDurStr(longestMs)}</span></div>
    <div class="cr"><span class="cl">⚖️ Total Weight Lost</span><span class="cv ct" style="color:var(--grn)">−${totalWtLost.toFixed(2)} kg</span></div>
    <div class="cr"><span class="cl">🔥 Total Fat Lost</span><span class="cv ct" style="color:var(--grn)">−${totalFatLost.toFixed(2)} kg</span></div>
  </div>`;
}

function buildTrendChart(hist) {
  const sorted = [...hist].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const wts  = sorted.map(f => f.finalWeight);
  const minW = Math.min(...wts), maxW = Math.max(...wts), rangeW = maxW - minW || 1;
  const W = 320, H = 140, PX = 30, PY = 12;
  const cW = W - PX * 2, cH = H - PY * 2;
  const pts = sorted.map((f, i) => ({
    x: PX + (i / (sorted.length - 1 || 1)) * cW,
    y: PY + (1 - (f.finalWeight - minW) / rangeW) * cH,
    w: f.finalWeight,
  }));
  const lp = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fp = lp + ` L${pts[pts.length - 1].x.toFixed(1)} ${H - PY} L${PX} ${H - PY} Z`;
  const grid = [0, .5, 1].map(t => {
    const y = (PY + (1 - t) * cH).toFixed(1);
    return `<line x1="${PX}" y1="${y}" x2="${W - PX}" y2="${y}" stroke="#2a2a40" stroke-width="1"/>
            <text x="${PX - 4}" y="${(+y + 4).toFixed(0)}" fill="#55556a" font-size="9" text-anchor="end">${(minW + t * rangeW).toFixed(1)}</text>`;
  }).join('');
  const dots   = pts.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#a78bfa" stroke="#08080f" stroke-width="2"><title>Fast #${i + 1}: ${p.w} kg</title></circle>`).join('');
  const labels = pts.map((p, i) => `<text x="${p.x.toFixed(1)}" y="${H - 1}" fill="#55556a" font-size="8" text-anchor="middle">#${i + 1}</text>`).join('');
  return `<div class="card fade"><div class="card-lbl">Weight Trend (Final Weight per Fast)</div>
    <div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${grid}
      <path d="${fp}" fill="rgba(167,139,250,.08)" stroke="none"/>
      <path d="${lp}" fill="none" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}${labels}
    </svg></div></div>`;
}

function buildComparisonTable(hist) {
  const sorted = [...hist].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const rows = sorted.map((f, i) => {
    const { days, hours } = fmtDur(f.durationMs);
    const wLost = (f.startWeight - f.finalWeight).toFixed(1);
    const fLost = Math.max(0, f.startWeight * f.startBodyFat / 100 - f.finalWeight * f.finalFat / 100).toFixed(2);
    const d = new Date(f.endTime);
    return `<tr>
      <td style="color:var(--text3);font-size:.75rem">#${i + 1}<br>${d.getMonth() + 1}/${d.getDate()}</td>
      <td style="text-align:center">${days > 0 ? days + 'd ' : ''}${hours}h</td>
      <td style="text-align:center;color:var(--grn)">−${wLost}</td>
      <td style="text-align:center;color:var(--grn)">−${fLost}</td>
    </tr>`;
  }).join('');
  return `<div class="card fade"><div class="card-lbl">Fast Comparison</div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.81rem">
      <thead><tr style="color:var(--text3);font-size:.72rem;border-bottom:1px solid #2a2a40">
        <th style="text-align:left;padding:4px 0">Fast</th>
        <th style="text-align:center;padding:4px 0">Duration</th>
        <th style="text-align:center;padding:4px 0">Wt Lost(kg)</th>
        <th style="text-align:center;padding:4px 0">Fat Lost(kg)</th>
      </tr></thead>
      <tbody style="color:var(--text)">${rows}</tbody>
    </table></div></div>`;
}

function buildFastList(hist) {
  let sorted;
  if      (_histSort === 'duration') sorted = [...hist].sort((a, b) => b.durationMs - a.durationMs);
  else if (_histSort === 'wtlost')   sorted = [...hist].sort((a, b) => (b.startWeight - b.finalWeight) - (a.startWeight - a.finalWeight));
  else                               sorted = [...hist].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  const pbDur = hist.reduce((a, b) => b.durationMs > a.durationMs ? b : a, hist[0]).id;
  const pbWt  = hist.filter(f => f.startWeight && f.finalWeight)
                    .reduce((a, b) => (b.startWeight - b.finalWeight) > (a.startWeight - a.finalWeight) ? b : a, { id: null }).id;
  const pbFat = hist.filter(f => f.startWeight && f.startBodyFat && f.finalWeight && f.finalFat)
                    .reduce((a, b) => {
                      const af = a.startWeight * a.startBodyFat / 100 - a.finalWeight * a.finalFat / 100;
                      const bf = b.startWeight * b.startBodyFat / 100 - b.finalWeight * b.finalFat / 100;
                      return bf > af ? b : a;
                    }, { id: null }).id;

  const allJ = getJournal();
  const cards = sorted.map(f => {
    const { days, hours } = fmtDur(f.durationMs);
    const wLost  = (f.startWeight - f.finalWeight).toFixed(1);
    const fLost  = Math.max(0, f.startWeight * f.startBodyFat / 100 - f.finalWeight * f.finalFat / 100).toFixed(2);
    const dEnd   = new Date(f.endTime);
    const dStart = new Date(f.startTime);
    const num    = hist.indexOf(f) + 1;
    const ckCount = f.checkins ? f.checkins.length : 0;
    const jCount  = allJ.filter(e => e.fastId === f.startTime).length;
    const pbDurBadge = f.id === pbDur ? '<span class="pb-badge">🏆 Longest</span>' : '';
    const pbWtBadge  = f.id === pbWt  ? '<span class="pb-badge">🏆 Best Wt</span>' : '';
    const pbFatBadge = f.id === pbFat ? '<span class="pb-badge">🏆 Best Fat</span>' : '';
    return `<details class="fast-card fade">
      <summary>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;color:var(--text)">Fast #${num}${pbDurBadge}</span>
          <span style="font-size:.72rem;color:var(--text3)">${dEnd.toLocaleDateString()} ▾</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center">
          <div><div style="font-size:.67rem;color:var(--text3)">Duration</div>
               <div style="font-size:.86rem;color:var(--cyan);font-weight:600">${days > 0 ? days + 'd ' : ''}${hours}h</div></div>
          <div><div style="font-size:.67rem;color:var(--text3)">Wt Lost${pbWtBadge}</div>
               <div style="font-size:.86rem;color:var(--grn);font-weight:600">−${wLost} kg</div></div>
          <div><div style="font-size:.67rem;color:var(--text3)">Fat Lost${pbFatBadge}</div>
               <div style="font-size:.86rem;color:var(--grn);font-weight:600">−${fLost} kg</div></div>
        </div>
      </summary>
      <div class="fast-detail">
        <div class="fast-detail-row"><span>Started</span><span style="color:var(--text)">${dStart.toLocaleString()}</span></div>
        <div class="fast-detail-row"><span>Ended</span><span style="color:var(--text)">${dEnd.toLocaleString()}</span></div>
        <div class="fast-detail-row"><span>Check-ins</span><span style="color:var(--cyan)">${ckCount}</span></div>
        <div class="fast-detail-row"><span>Journal entries</span><span style="color:var(--cyan)">${jCount}</span></div>
        ${f.startWeight ? `<div class="fast-detail-row"><span>Start weight</span><span>${f.startWeight} kg @ ${f.startBodyFat}% fat</span></div>` : ''}
        ${f.finalWeight ? `<div class="fast-detail-row"><span>End weight</span><span>${f.finalWeight} kg @ ${f.finalFat}% fat</span></div>` : ''}
      </div>
    </details>`;
  }).join('');

  return `<div class="card-lbl" style="padding:8px 2px 6px;font-size:.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;">Previous Fasts</div>${cards}`;
}

// ── Weight chart ───────────────────────────────────────────────────
export function buildChart(cks) {
  if (!cks || cks.length < 2) return '';
  const wts  = cks.map(c => c.weight);
  const minW = Math.min(...wts), maxW = Math.max(...wts), range = maxW - minW || 1;
  const W = 320, H = 150, PX = 28, PY = 14;
  const cW = W - PX * 2, cH = H - PY * 2;
  const pts = cks.map((c, i) => ({
    x: PX + (i / (cks.length - 1)) * cW,
    y: PY + (1 - (c.weight - minW) / range) * cH,
    w: c.weight,
  }));
  const lp = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fp = lp + ` L${pts[pts.length - 1].x.toFixed(1)} ${H - PY} L${PX} ${H - PY} Z`;
  const grid = [0, .25, .5, .75, 1].map(t => {
    const y = (PY + (1 - t) * cH).toFixed(1);
    return `<line x1="${PX}" y1="${y}" x2="${W - PX}" y2="${y}" stroke="#2a2a40" stroke-width="1"/>
            <text x="${PX - 4}" y="${(+y + 4).toFixed(0)}" fill="#55556a" font-size="9" text-anchor="end">${(minW + t * range).toFixed(1)}</text>`;
  }).join('');
  const dots   = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#00d4ff" stroke="#08080f" stroke-width="2"><title>${p.w} kg</title></circle>`).join('');
  const labels = cks.map((c, i) => {
    if (cks.length > 8 && i % Math.ceil(cks.length / 4) !== 0 && i !== cks.length - 1) return '';
    const d = new Date(c.datetime);
    return `<text x="${(PX + (i / (cks.length - 1)) * cW).toFixed(1)}" y="${H - 1}" fill="#55556a" font-size="8" text-anchor="middle">${d.getMonth() + 1}/${d.getDate()}</text>`;
  }).join('');
  return `<div class="card fade"><div class="card-lbl">Weight Over Time</div>
    <div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${grid}
      <path d="${fp}" fill="rgba(0,212,255,.08)" stroke="none"/>
      <path d="${lp}" fill="none" stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}${labels}
    </svg></div></div>`;
}

// ── Wellbeing sparklines ───────────────────────────────────────────
export function buildWellbeingSparklines(cks) {
  if (!cks) return '';
  const wbCks = cks.filter(c => c.wb && (c.wb.energy || c.wb.hunger || c.wb.clarity));
  if (wbCks.length < 2) return '';
  const W = 320, H = 112, PX = 16, PY = 8, LH = 12;
  const cW = W - PX * 2, cH = H - PY * 2 - LH;
  const n   = wbCks.length;
  const xOf = i => PX + (n > 1 ? i / (n - 1) : 0.5) * cW;
  const yOf = v => PY + (1 - (v - 1) / 4) * cH;
  const drawLine = (key, color) => {
    let path = '', prev = null;
    const dots = [];
    wbCks.forEach((c, i) => {
      const v = c.wb && c.wb[key];
      if (!v) { prev = null; return; }
      const x = xOf(i).toFixed(1), y = yOf(v).toFixed(1);
      path += (prev === null ? 'M' : 'L') + x + ' ' + y + ' ';
      dots.push(`<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="#08080f" stroke-width="1.5"/>`);
      prev = 1;
    });
    return path ? `<path d="${path.trim()}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` + dots.join('') : '';
  };
  const grid = [1, 3, 5].map(v => {
    const y = yOf(v).toFixed(1);
    return `<line x1="${PX}" y1="${y}" x2="${W - PX}" y2="${y}" stroke="#1e1e30" stroke-width="1"/>
      <text x="${PX - 3}" y="${(parseFloat(y) + 3).toFixed(0)}" fill="#55556a" font-size="8" text-anchor="end">${v}</text>`;
  }).join('');
  const xlabels = wbCks.map((c, i) => {
    if (n > 7 && i % Math.ceil(n / 5) !== 0 && i !== n - 1) return '';
    const d = new Date(c.datetime);
    return `<text x="${xOf(i).toFixed(1)}" y="${H - 1}" fill="#55556a" font-size="8" text-anchor="middle">${d.getMonth() + 1}/${d.getDate()}</text>`;
  }).join('');
  return `<div class="card fade">
    <div class="card-lbl">📊 Wellbeing Trends</div>
    <div class="sl-legend">
      <span style="color:#ffd740">⚡ Energy</span>
      <span style="color:#ff4757">🍽️ Hunger</span>
      <span style="color:#00d4ff">🧠 Clarity</span>
    </div>
    <div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${grid}${drawLine('energy', '#ffd740')}${drawLine('hunger', '#ff4757')}${drawLine('clarity', '#00d4ff')}${xlabels}
    </svg></div>
  </div>`;
}

// ── Sort button event delegation ───────────────────────────────────
export function initReportEvents() {
  document.getElementById('report-content')?.addEventListener('click', e => {
    const btn = e.target.closest('.sort-btn');
    if (btn && btn.dataset.sort) setHistSort(btn.dataset.sort);
    const shareBtn = e.target.closest('#btn-share-report');
    if (shareBtn) document.dispatchEvent(new CustomEvent('ft:open-share'));
  });
}
