// main.js — entry point: imports, init, glue, event listeners
// v3.1.0

import { APP_VERSION, K, ls, fastState, checkins, doneFast, fastHistory, getProfile, migrateLegacy } from './storage.js?v=3.1';
import { checkLifetimeBadges, buildBadgeGrid } from './badges.js?v=3.1';
import { showTab, onTab, openModal, closeModal, onModalOpen, showScreen, updateHeaderName, toast, fmtDate, fmtDurStr, dtLocalStr, moveNavPill } from './ui.js?v=3.1';
import { renderHome, startTimer, stopTimer } from './fasting.js?v=3.1';
import { initCIForm, renderCIHistory, initCheckinEvents } from './checkin.js?v=3.1';
import { initJournal, initJournalEvents } from './journal.js?v=3.1';
import { openStrugglingModal, initStrugglingEvents } from './struggling.js?v=3.1';
import { renderReport, initReportEvents } from './report.js?v=3.1';
import { initNotifications, renderNotifSettings, checkPhaseMilestone } from './notifications.js?v=3.1';
import { renderGFitSection, loadGISScript } from './gfit.js?v=3.1';

// ── Register tab renderers ─────────────────────────────────────────
onTab('home',    () => renderHome(getProfile()));
onTab('checkin', () => { initCIForm(); renderCIHistory(); initJournal(); });
onTab('report',  () => renderReport());
onTab('data',    () => renderData());

// ── Bootstrap ──────────────────────────────────────────────────────
function init() {
  migrateLegacy();
  document.getElementById('app-ver').textContent = APP_VERSION;
  checkLifetimeBadges();

  const p = getProfile();
  if (!p || !p.height || !p.name) {
    showScreen('setup-screen');
  } else {
    showScreen('main-app');
    renderAll();
  }

  initNotifications();
  const gfc = ls.get(K.GFIT, {});
  if (gfc.clientId) loadGISScript(() => {});

  registerSW();
  wireEvents();
  setTimeout(() => moveNavPill('home'), 50);
}

// ── Render all ─────────────────────────────────────────────────────
function renderAll() {
  renderHome(getProfile());
  renderCIHistory();
  renderData();
  updateHeaderName();
}

// ── Data tab ───────────────────────────────────────────────────────
function renderData() {
  const p = getProfile();
  const pr = document.getElementById('profile-rows');
  if (pr && p) {
    const cks  = checkins();
    const last = cks.length ? cks[cks.length - 1] : null;
    const bmi  = last && p.height ? (last.weight / Math.pow(p.height / 100, 2)).toFixed(1) : '—';
    const state = fastState();
    pr.innerHTML = [
      ['Name', p.name], ['Age', p.age], ['Gender', p.gender],
      ['Height', p.height + ' cm'], ['Current BMI', bmi],
      ['Check-ins logged', cks.length],
      ['Version', APP_VERSION],
      ['Fast active', state ? 'Yes (' + fmtDurStr(Date.now() - new Date(state.startTime).getTime()) + ')' : 'No'],
    ].map(([l, v]) =>
      `<div class="info-row"><span class="ilab">${l}</span><span class="ival">${v}</span></div>`
    ).join('');
  }
  renderNotifSettings();
  renderGFitSection();
  const bg = document.getElementById('badge-grid-wrap');
  if (bg) bg.innerHTML = buildBadgeGrid();
  const ac = document.getElementById('all-checkins');
  if (ac) {
    const cks = checkins();
    if (!cks.length) { ac.innerHTML = '<div class="empty">No check-ins yet</div>'; return; }
    ac.innerHTML = [...cks].reverse().map(c =>
      `<div class="hist-item">
        <span class="hd">${fmtDate(c.datetime, true)}</span>
        <span class="hw">${c.weight} kg</span>
        <span class="hf">${c.bodyFat != null ? c.bodyFat + '%' : '—'}</span>
      </div>`
    ).join('');
  }
}

// ── Setup ──────────────────────────────────────────────────────────
function completeSetup() {
  const name   = document.getElementById('su-name').value.trim();
  const age    = parseInt(document.getElementById('su-age').value);
  const gender = document.getElementById('su-gender').value;
  const height = parseFloat(document.getElementById('su-height').value);
  if (!name)                       { toast('⚠️ Enter your name'); return; }
  if (!age || age < 10 || age > 120) { toast('⚠️ Enter a valid age'); return; }
  if (!height || height < 100 || height > 250) { toast('⚠️ Enter height (100–250 cm)'); return; }
  ls.set(K.PROF, { name, age, gender, height });
  showScreen('main-app');
  renderAll();
}

// ── Profile modal ──────────────────────────────────────────────────
function prefillProfileModal() {
  const p = getProfile() || {};
  document.getElementById('pm-name')  .value = p.name   || '';
  document.getElementById('pm-age')   .value = p.age    || '';
  document.getElementById('pm-gender').value = p.gender || 'Male';
  document.getElementById('pm-height').value = p.height || '';
}
function saveProfile() {
  const name   = document.getElementById('pm-name').value.trim();
  const age    = parseInt(document.getElementById('pm-age').value);
  const gender = document.getElementById('pm-gender').value;
  const height = parseFloat(document.getElementById('pm-height').value);
  if (!name)                       { toast('⚠️ Enter your name'); return; }
  if (!age || age < 10 || age > 120) { toast('⚠️ Enter a valid age'); return; }
  if (!height || height < 100 || height > 250) { toast('⚠️ Enter height (100–250 cm)'); return; }
  ls.set(K.PROF, { name, age, gender, height });
  closeModal('profile-modal');
  renderAll();
  toast('✅ Profile saved!');
}
onModalOpen('profile-modal', prefillProfileModal);

// ── Start fast modal ───────────────────────────────────────────────
function openStartFastModal() {
  const now = dtLocalStr(new Date());
  document.getElementById('sm-dt').value = now;
  const cks = checkins();
  if (cks.length) {
    const last = cks[cks.length - 1];
    document.getElementById('sm-wt').value = last.weight;
    document.getElementById('sm-bf').value = last.bodyFat;
  }
  openModal('start-modal');
}
function confirmStartFast() {
  const dtVal = document.getElementById('sm-dt').value;
  const wt    = parseFloat(document.getElementById('sm-wt').value);
  const bf    = parseFloat(document.getElementById('sm-bf').value);
  if (!dtVal)          { toast('⚠️ Set a start date/time'); return; }
  if (isNaN(wt) || isNaN(bf)) { toast('⚠️ Enter weight and body fat %'); return; }
  const startTime = new Date(dtVal);
  if (startTime > new Date()) { toast("⚠️ Start time can't be in the future"); return; }
  ls.set(K.STATE, { startTime: startTime.toISOString(), startWeight: wt, startBodyFat: bf });
  ls.set(K.LPHASE, -1);
  const cks = checkins();
  cks.push({ datetime: dtVal, weight: wt, bodyFat: bf, id: Date.now() });
  cks.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  ls.set(K.CHKINS, cks);
  closeModal('start-modal');
  renderAll();
  const hrs = (Date.now() - startTime.getTime()) / 3600000;
  toast(hrs > 0.5
    ? `🚀 Fast started! Timer set to ${fmtDurStr(Date.now() - startTime.getTime())} ago.`
    : '🚀 Fast started! Your journey begins now.');
}

// ── Edit start time ────────────────────────────────────────────────
function openEditStartModal() {
  const state = fastState();
  if (!state) return;
  document.getElementById('est-dt').value = dtLocalStr(new Date(state.startTime));
  openModal('editstart-modal');
}
function confirmEditStart() {
  const dtVal = document.getElementById('est-dt').value;
  if (!dtVal) { toast('⚠️ Pick a start time'); return; }
  const startTime = new Date(dtVal);
  if (startTime > new Date()) { toast("⚠️ Start time can't be in the future"); return; }
  const state = fastState();
  state.startTime = startTime.toISOString();
  ls.set(K.STATE, state);
  closeModal('editstart-modal');
  renderAll();
  toast('✅ Start time updated!');
}

// ── End fast ───────────────────────────────────────────────────────
function openEndFastModal() {
  const cks = checkins();
  if (cks.length) {
    document.getElementById('em-wt').value = cks[cks.length - 1].weight || '';
    document.getElementById('em-bf').value = cks[cks.length - 1].bodyFat || '';
  }
  openModal('end-modal');
}
function confirmEndFast() {
  const wt = parseFloat(document.getElementById('em-wt').value);
  const bf = parseFloat(document.getElementById('em-bf').value);
  if (isNaN(wt) || isNaN(bf)) { toast('⚠️ Enter final weight and body fat %'); return; }
  const state   = fastState();
  const endTime = new Date();
  const durationMs = endTime - new Date(state.startTime);
  const fastRecord = {
    id: Date.now(),
    startTime: state.startTime, endTime: endTime.toISOString(), durationMs,
    startWeight: state.startWeight, startBodyFat: state.startBodyFat,
    finalWeight: wt, finalFat: bf, checkins: checkins(),
  };
  ls.set(K.DONE, fastRecord);
  const h = fastHistory(); h.push(fastRecord); ls.set(K.HISTORY, h);
  checkLifetimeBadges();
  ls.del(K.STATE);
  stopTimer();
  closeModal('end-modal');
  renderAll();
  showTab('report');
  toast('🏆 Incredible! Check your report!');
}

// ── Export CSV ────────────────────────────────────────────────────
function exportCSV() {
  const cks   = checkins();
  const state = fastState();
  let csv = 'Date/Time,Weight (kg),Body Fat (%),Fat Mass (kg),Lean Mass (kg),Energy (1-5),Hunger (1-5),Clarity (1-5)\n';
  cks.forEach(c => {
    const fm = (c.weight * c.bodyFat / 100).toFixed(2);
    const e = c.wb?.energy || '', h = c.wb?.hunger || '', cl = c.wb?.clarity || '';
    csv += `"${c.datetime}",${c.weight},${c.bodyFat},${fm},${(c.weight - parseFloat(fm)).toFixed(2)},${e},${h},${cl}\n`;
  });
  const allFasts = fastHistory();
  if (allFasts.length) {
    allFasts.forEach((fd, fi) => {
      csv += `\n[FAST #${fi + 1}]\n`;
      csv += `Start,${fd.startTime}\nEnd,${fd.endTime}\nDuration,${fmtDurStr(fd.durationMs)}\n`;
      csv += `Start Weight,${fd.startWeight} kg\nFinal Weight,${fd.finalWeight} kg\n`;
      csv += `Weight Lost,${(fd.startWeight - fd.finalWeight).toFixed(2)} kg\n`;
    });
  }
  if (state) {
    csv += '\n[ACTIVE FAST]\n';
    csv += `Start,${state.startTime}\nDuration so far,${fmtDurStr(Date.now() - new Date(state.startTime).getTime())}\n`;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = `fasttrack_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  toast('📤 CSV exported!');
}

// ── Reset ──────────────────────────────────────────────────────────
function confirmReset() {
  [K.PROF, K.STATE, K.CHKINS, K.DONE, K.HISTORY, K.QUOTE, K.NOTIF, K.LPHASE, K.GFIT, K.BADGES, K.LBADGE, K.STRUGGLES, K.JOURNAL]
    .forEach(k => ls.del(k));
  stopTimer();
  closeModal('reset-modal');
  location.reload();
}

// ── Share / infographic ───────────────────────────────────────────
function openShareModal() {
  const d = doneFast(), state = fastState();
  if (!d && !state) { toast('⚠️ No fast data yet'); return; }
  const snap = d || buildActiveFastSnap(state);
  drawInfographic(snap);
  if (navigator.canShare) document.getElementById('btn-native-share').style.display = '';
  openModal('share-modal');
}
function buildActiveFastSnap(state) {
  const ms  = Date.now() - new Date(state.startTime).getTime();
  const cks = checkins();
  const lat = cks.length ? cks[cks.length - 1] : null;
  return { durationMs: ms, isActive: true, startWeight: state.startWeight, finalWeight: lat?.weight || state.startWeight, startBodyFat: state.startBodyFat, finalFat: lat?.bodyFat || state.startBodyFat, checkins: cks };
}
function drawInfographic(d) {
  const canvas = document.getElementById('share-canvas');
  const S = 1080; canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#08080f'; ctx.fillRect(0, 0, S, S);
  const grd = ctx.createRadialGradient(S/2,160,0,S/2,160,200);
  grd.addColorStop(0,'rgba(0,212,255,0.15)'); grd.addColorStop(1,'rgba(0,212,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0,0,S,380);
  ctx.font = 'bold 52px system-ui,sans-serif'; ctx.fillStyle = '#00d4ff'; ctx.textAlign = 'center';
  ctx.fillText('⚡ FastTrack', S/2, 100);
  const { days, hours } = fmtDurStr(d.durationMs).match(/(\d+)d/) ? { days: parseInt(fmtDurStr(d.durationMs)), hours: parseInt(fmtDurStr(d.durationMs).match(/(\d+)h/)?.[1]) } : { days:0, hours: parseInt(fmtDurStr(d.durationMs)) };
  ctx.font = 'bold 120px system-ui,sans-serif'; ctx.fillStyle = '#eeeeff';
  ctx.fillText(fmtDurStr(d.durationMs).replace('m','').trim(), S/2, 240);
  ctx.font = '28px system-ui,sans-serif'; ctx.fillStyle = '#9999bb';
  ctx.fillText(d.isActive ? 'AND STILL GOING' : 'TOTAL TIME FASTED', S/2, 285);
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(80,320); ctx.lineTo(S-80,320); ctx.stroke();
  [{ label:'START', val:d.startWeight.toFixed(1)+' kg', color:'#9999bb' },
   { label:'END',   val:d.finalWeight.toFixed(1)+' kg',  color:'#00d4ff' },
   { label:'LOST',  val:(Math.max(0,d.startWeight-d.finalWeight)).toFixed(1)+' kg', color:'#00e676' }
  ].forEach((s,i) => {
    const cx = S/3*i + S/6;
    ctx.font = 'bold 48px system-ui,sans-serif'; ctx.fillStyle = s.color; ctx.textAlign = 'center';
    ctx.fillText(s.val, cx, 400);
    ctx.font = '22px system-ui,sans-serif'; ctx.fillStyle = '#55556a';
    ctx.fillText(s.label, cx, 430);
  });
  const p = getProfile();
  if (p) {
    ctx.font = 'bold 30px system-ui,sans-serif'; ctx.fillStyle = '#9999bb'; ctx.textAlign = 'center';
    ctx.fillText(p.name + ' · ' + new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), S/2, 850);
  }
  document.getElementById('share-preview').src = canvas.toDataURL('image/png');
}
function downloadInfographic() {
  const canvas = document.getElementById('share-canvas');
  const a = document.createElement('a');
  const p = getProfile();
  a.download = 'fasttrack-' + (p ? p.name.toLowerCase() : 'fast') + '-' + new Date().toISOString().slice(0,10) + '.png';
  a.href = canvas.toDataURL('image/png');
  a.click(); toast('📥 Saved!');
}
async function nativeShare() {
  const canvas = document.getElementById('share-canvas');
  try {
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const file = new File([blob], 'fasttrack.png', { type: 'image/png' });
    await navigator.share({ title: 'FastTrack', text: 'My fasting journey', files: [file] });
  } catch (e) { if (e.name !== 'AbortError') toast('⚠️ Share not supported'); }
}

// ── Service Worker ────────────────────────────────────────────────
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ── Swipe navigation ──────────────────────────────────────────────
function initSwipeGestures() {
  const TABS = ['home', 'checkin', 'report', 'data'];
  let startX = 0, startY = 0;
  const el = document.getElementById('app');
  if (!el) return;
  el.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].clientX;
    startY = e.changedTouches[0].clientY;
  }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return; // ignore verticals
    const cur = TABS.indexOf(getActiveTab());
    if (dx < 0 && cur < TABS.length - 1) showTab(TABS[cur + 1]);
    if (dx > 0 && cur > 0)               showTab(TABS[cur - 1]);
  }, { passive: true });
}

// ── Wire all events ────────────────────────────────────────────────
function wireEvents() {
  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn =>
    btn.addEventListener('click', () => showTab(btn.dataset.tab))
  );
  // Profile button
  document.getElementById('profile-btn')?.addEventListener('click', () => openModal('profile-modal'));
  // Setup form
  document.getElementById('btn-setup-submit')?.addEventListener('click', completeSetup);
  // Profile modal save
  document.getElementById('btn-profile-save')?.addEventListener('click', saveProfile);
  // Start fast
  document.getElementById('btn-confirm-start')    ?.addEventListener('click', confirmStartFast);
  // Edit start
  document.getElementById('btn-confirm-edit-start')?.addEventListener('click', confirmEditStart);
  // End fast
  document.getElementById('btn-confirm-end')?.addEventListener('click', confirmEndFast);
  // Reset
  document.getElementById('btn-confirm-reset')?.addEventListener('click', confirmReset);
  // Export CSV
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
  // Reset modal open
  document.getElementById('btn-open-reset')?.addEventListener('click', () => openModal('reset-modal'));
  // Share
  document.getElementById('btn-download-infographic')?.addEventListener('click', downloadInfographic);
  document.getElementById('btn-native-share')        ?.addEventListener('click', nativeShare);

  // Home dynamic buttons (re-wired on each render)
  document.addEventListener('ft:home-rendered', (e) => {
    if (e.detail.active) {
      document.getElementById('btn-edit-start')   ?.addEventListener('click', openEditStartModal);
      document.getElementById('btn-struggling')   ?.addEventListener('click', openStrugglingModal);
      document.getElementById('btn-end-fast')     ?.addEventListener('click', openEndFastModal);
      document.getElementById('btn-share')        ?.addEventListener('click', openShareModal);
      document.getElementById('btn-goto-checkin2')?.addEventListener('click', () => showTab('checkin'));
    } else {
      document.getElementById('btn-start-fast')   ?.addEventListener('click', openStartFastModal);
      document.getElementById('btn-goto-checkin') ?.addEventListener('click', () => showTab('checkin'));
    }
  });

  // Event-based re-renders
  document.addEventListener('ft:checkin-saved', () => {
    renderAll();
  });
  document.addEventListener('ft:render-data', renderData);
  document.addEventListener('ft:open-modal',  (e) => openModal(e.detail.id));
  document.addEventListener('ft:close-modal', (e) => closeModal(e.detail.id));
  document.addEventListener('ft:open-share',  openShareModal);

  // Tick → notifications
  document.addEventListener('ft:tick', (e) => checkPhaseMilestone(e.detail.hrs));

  // Module event wiring
  initCheckinEvents();
  initJournalEvents();
  initStrugglingEvents();
  initReportEvents();
  initSwipeGestures();
}

// ── Boot ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
