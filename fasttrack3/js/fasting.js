// fasting.js — timer, tick, active/idle screen builders, quote fetch
// v3.1.0 — imports: storage, phases, badges, ui

import { K, ls, fastState, checkins, doneFast, earnedBadges } from './storage.js?v=3.1';
import { PHASES, getPhase, phaseProgress } from './phases.js?v=3.1';
import { checkBadges, buildBadgeRack } from './badges.js?v=3.1';
import { fmtDate, fmtDurStr } from './ui.js?v=3.1';

let timerID = null;

// ── Online quote ───────────────────────────────────────────────────
async function fetchQuote() {
  const cached = ls.get(K.QUOTE);
  if (cached && (Date.now() - cached.ts) < 3600000 * 6) return cached;
  const urls = [
    'https://api.quotable.io/random?tags=inspirational|wisdom|motivation&maxLength=160',
    'https://zenquotes.io/api/random',
  ];
  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 4000);
      const r    = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!r.ok) continue;
      const d = await r.json();
      let q;
      if (Array.isArray(d)) { q = { text: d[0].q, author: d[0].a, ts: Date.now() }; }
      else                   { q = { text: d.content, author: d.author, ts: Date.now() }; }
      if (q.text) { ls.set(K.QUOTE, q); return q; }
    } catch {}
  }
  return cached || null;
}

async function fetchAndInjectQuote() {
  const qb = document.getElementById('quote-block');
  if (!qb) return;
  qb.innerHTML = `<div class="quote-block"><div class="quote-loading">✨ Loading today's quote…</div></div>`;
  const q = await fetchQuote();
  if (q && qb) {
    qb.innerHTML = `<div class="quote-block">
      <div class="quote-text">"${q.text}"</div>
      <div class="quote-author">— ${q.author}</div>
    </div>`;
  } else if (qb) {
    qb.innerHTML = '';
  }
}

// ── Timer ──────────────────────────────────────────────────────────
export function startTimer() {
  if (timerID) clearInterval(timerID);
  tick();
  timerID = setInterval(tick, 10000);
}

export function stopTimer() {
  if (timerID) { clearInterval(timerID); timerID = null; }
}

export function tick() {
  const state = fastState();
  if (!state) return;
  const ms  = Date.now() - new Date(state.startTime).getTime();
  const pad = n => String(n).padStart(2, '0');
  const s   = Math.floor(ms / 1000);
  const d   = Math.floor(s / 86400);
  const h   = Math.floor((s % 86400) / 3600);
  const m   = Math.floor((s % 3600) / 60);

  const tdEl = document.getElementById('td');
  if (!tdEl) return;
  tdEl.textContent = pad(d);
  document.getElementById('th').textContent = pad(h);
  document.getElementById('tm').textContent = pad(m);

  const hrs   = ms / 3600000;
  const phase = getPhase(hrs);
  const prog  = phaseProgress(hrs, phase);

  document.documentElement.style.setProperty('--phase-color', phase.color);

  const chip = document.getElementById('phase-chip');
  if (chip) { chip.style.color = phase.color; chip.textContent = phase.icon + ' ' + phase.name; }

  const fill = document.getElementById('phase-fill');
  if (fill) { fill.style.width = (prog * 100) + '%'; fill.style.color = phase.color; }

  const ring = document.getElementById('ring-fill');
  if (ring) {
    ring.style.strokeDashoffset = (603.2 * (1 - prog)).toFixed(1);
    ring.style.stroke = phase.color;
  }

  const pctEl = document.getElementById('phase-pct');
  if (pctEl) pctEl.textContent = Math.round(prog * 100) + '%';

  const nmv = document.getElementById('next-milestone-val');
  if (nmv) {
    if (phase.h1 === Infinity) {
      nmv.textContent = 'Final phase';
    } else {
      const nextP = PHASES[phase.id + 1];
      const remH  = phase.h1 - hrs;
      const rh = Math.floor(remH), rm = Math.floor((remH - rh) * 60);
      nmv.textContent = (nextP ? nextP.name : '—') + ' in ' + rh + 'h ' + rm + 'm';
    }
  }

  const pdName = document.getElementById('phase-detail-name');
  if (pdName) pdName.textContent = phase.icon + ' ' + phase.name;
  const pdBullets = document.getElementById('phase-detail-bullets');
  if (pdBullets) pdBullets.innerHTML = (phase.bullets || [phase.desc]).map(b => `<li>${b}</li>`).join('');
  const pdSci = document.getElementById('phase-detail-sci');
  if (pdSci) pdSci.textContent = phase.mot.sci;

  const mt = document.getElementById('motiv-title');
  const mb = document.getElementById('motiv-body');
  if (mt) mt.textContent = phase.mot.title;
  if (mb) mb.textContent = phase.mot.body;

  const tl = document.getElementById('timeline');
  if (tl) tl.innerHTML = buildTimeline(hrs);

  // Dispatch for notifications module to listen
  document.dispatchEvent(new CustomEvent('ft:tick', { detail: { hrs } }));
  checkBadges(hrs);
}

// ── Timeline ───────────────────────────────────────────────────────
export function buildTimeline(hrs) {
  return PHASES.map(p => {
    const reached = hrs >= p.h0;
    const isCur   = hrs >= p.h0 && (p.h1 === Infinity || hrs < p.h1);
    let cls = 'tl-item';
    if (reached && !isCur) cls += ' reached';
    if (isCur) cls += ' current';
    return `<div class="${cls}" style="color:${p.color}">
      <div class="tl-dot"></div>
      <div class="tl-range">${p.range}</div>
      <div class="tl-name">${p.icon} ${p.name}</div>
      <div class="tl-desc">${p.desc}</div>
    </div>`;
  }).join('');
}

// ── Recent check-in card ───────────────────────────────────────────
export function buildRecentCheckin() {
  const cks = checkins();
  if (!cks.length) return '';
  const last = cks[cks.length - 1];
  const wb   = last.wb || {};
  const ENG  = ['', '😴', '😕', '😐', '🙂', '⚡'];
  const HUN  = ['', '🔥', '😫', '😐', '🙂', '😌'];
  const CLR  = ['', '🌫️', '😵', '🤔', '💡', '🧠'];
  const chips = [
    wb.energy  ? `<span class="rci-wb-chip">⚡ Energy ${ENG[wb.energy] || wb.energy}</span>`   : '',
    wb.hunger  ? `<span class="rci-wb-chip">🍽️ Hunger ${HUN[wb.hunger] || wb.hunger}</span>`   : '',
    wb.clarity ? `<span class="rci-wb-chip">🧠 Clarity ${CLR[wb.clarity] || wb.clarity}</span>` : '',
  ].filter(Boolean).join('');
  const fatKg = last.weight && last.bodyFat ? (last.weight * last.bodyFat / 100).toFixed(1) : '—';
  return `<div class="recent-ci-card fade">
    <div class="rci-hdr">
      <span class="rci-lbl">Last Check-in</span>
      <span class="rci-date">${fmtDate(last.datetime)}</span>
    </div>
    <div class="rci-stats">
      <div class="rci-stat"><div class="rci-val" style="color:var(--cyan)">${last.weight || '—'}</div><div class="rci-unit">kg</div></div>
      <div class="rci-stat"><div class="rci-val" style="color:var(--ora)">${last.bodyFat || '—'}%</div><div class="rci-unit">Body Fat</div></div>
      <div class="rci-stat"><div class="rci-val" style="color:var(--purp)">${fatKg}</div><div class="rci-unit">Fat kg</div></div>
    </div>
    ${chips ? `<div class="rci-wb">${chips}</div>` : ''}
  </div>`;
}

// ── Idle screen ────────────────────────────────────────────────────
export function buildIdleScreen(profile) {
  const cks  = checkins();
  const done = doneFast();
  const last = cks.length ? cks[cks.length - 1] : null;
  const p    = profile;

  let statsHtml = '';
  if (last && p) {
    const bmi   = p.height ? (last.weight / Math.pow(p.height / 100, 2)).toFixed(1) : '—';
    const fatKg = (last.weight * last.bodyFat / 100).toFixed(1);
    statsHtml = `<div class="card fade">
      <div class="card-lbl">Last Check-in — ${fmtDate(last.datetime)}</div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-v" style="color:var(--cyan)">${last.weight}</div><div class="stat-l">kg</div></div>
        <div class="stat-box"><div class="stat-v" style="color:var(--ora)">${last.bodyFat}%</div><div class="stat-l">Body Fat</div></div>
        <div class="stat-box"><div class="stat-v" style="color:var(--purp)">${fatKg}</div><div class="stat-l">Fat kg</div></div>
        <div class="stat-box"><div class="stat-v" style="color:var(--text2)">${bmi}</div><div class="stat-l">BMI</div></div>
      </div>
    </div>`;
  }

  const name       = p ? p.name : 'there';
  const totalBadges = new Set(earnedBadges().map(b => b.id)).size;
  const badgeNote  = totalBadges > 0
    ? `<p style="text-align:center;color:var(--gold);font-size:.8rem;margin-bottom:10px">🏅 ${totalBadges}/7 badges earned</p>`
    : '';
  const doneNote = done
    ? `<p style="text-align:center;color:var(--text3);font-size:.75rem;margin-bottom:10px;">Last fast: ${fmtDurStr(done.durationMs)}</p>`
    : '';

  return `<div class="start-hero fade">
    <span class="sh-icon">⚡</span>
    <h2 class="sh-title">Ready, ${name}?</h2>
    <p class="sh-sub">Your next metabolic transformation awaits. The timer can be set to any start time — even if your fast already began.</p>
    ${doneNote}
    <div class="ac">
      <button class="btn btn-primary" id="btn-start-fast">🚀 &nbsp;Start Fast</button>
      <button class="btn btn-ghost"   id="btn-goto-checkin">📊 &nbsp;Log a Check-in</button>
    </div>
  </div>
  ${statsHtml}`;
}

// ── Active fast screen ─────────────────────────────────────────────
export function buildActiveFast(state) {
  return `
    <div class="timer-card fade">
      <div class="timer-lbl">TIME FASTING</div>
      <div class="timer-ring-wrap">
        <svg class="phase-ring" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle class="ring-bg"   cx="110" cy="110" r="96"/>
          <circle class="ring-fill" id="ring-fill" cx="110" cy="110" r="96"
            stroke-dasharray="603.2" stroke-dashoffset="603.2"/>
        </svg>
        <div class="timer-inner">
          <div class="timer-row">
            <div class="t-unit"><span class="t-val" id="td">00</span><span class="t-lbl">DAYS</span></div>
            <span class="t-sep">:</span>
            <div class="t-unit"><span class="t-val" id="th">00</span><span class="t-lbl">HRS</span></div>
            <span class="t-sep">:</span>
            <div class="t-unit"><span class="t-val" id="tm">00</span><span class="t-lbl">MIN</span></div>
          </div>
          <div class="phase-chip" id="phase-chip" style="color:var(--p0)">🔋 Loading…</div>
        </div>
      </div>
      <div class="started-row">
        <span id="started-txt">Started: ${fmtDate(state.startTime, true)}</span>
        <button class="edit-start-btn" id="btn-edit-start">✏️ edit</button>
      </div>
      <div class="phase-bar-wrap">
        <div class="phase-bar-meta">
          <span class="pct" id="phase-pct">0%</span>
          <span class="next-ms"><span class="next-ms-lbl">Next: </span><span class="next-ms-val" id="next-milestone-val">—</span></span>
        </div>
        <div class="phase-bar"><div class="phase-bar-fill shimmer-on" id="phase-fill" style="width:0%"></div></div>
      </div>
    </div>

    <details class="phase-detail-card fade" id="phase-detail">
      <summary>
        <span class="pdc-name" id="phase-detail-name">Loading…</span>
        <span class="pdc-toggle">What's happening ▾</span>
      </summary>
      <ul class="pdc-bullets" id="phase-detail-bullets"><li>Loading…</li></ul>
      <div class="pdc-sci" id="phase-detail-sci"></div>
    </details>

    <div class="motiv-card fade" id="motiv-card">
      <div class="motiv-lbl">YOUR BODY RIGHT NOW</div>
      <div class="motiv-title" id="motiv-title">Loading…</div>
      <div class="motiv-body"  id="motiv-body"></div>
      <div id="quote-block"></div>
    </div>

    <div class="card fade">
      <div class="card-lbl">🏅 Badges This Fast</div>
      <div class="badge-rack" id="badge-rack">${buildBadgeRack()}</div>
    </div>

    ${buildRecentCheckin()}

    <div class="struggling-wrap fade">
      <button class="btn-struggling" id="btn-struggling">⚠️ I'm Struggling</button>
      <p class="struggling-sub">Science-backed support for tough moments</p>
    </div>

    <details class="tl-collapsible fade">
      <summary>📍 Journey Timeline</summary>
      <div class="tl-wrap" id="timeline"></div>
    </details>

    <div class="ac fade" style="margin-bottom:80px">
      <button class="btn btn-ghost" id="btn-goto-checkin2">📊 &nbsp;Morning Check-in</button>
      <button class="btn btn-ghost" id="btn-share">📸 &nbsp;Share</button>
      <button class="btn btn-danger" id="btn-end-fast">🏁 &nbsp;End Fast</button>
    </div>`;
}

// ── renderHome (called via onTab) ──────────────────────────────────
export function renderHome(profile) {
  const dash  = document.getElementById('home-dash');
  if (!dash) return;
  const state = fastState();
  if (state) {
    dash.innerHTML = buildActiveFast(state);
    startTimer();
    fetchAndInjectQuote();
    // Wire up buttons in active state (no onclick in HTML)
    document.dispatchEvent(new CustomEvent('ft:home-rendered', { detail: { active: true } }));
  } else {
    stopTimer();
    dash.innerHTML = buildIdleScreen(profile);
    document.dispatchEvent(new CustomEvent('ft:home-rendered', { detail: { active: false } }));
  }
}
