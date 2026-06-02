// checkin.js — check-in form, inline validation, CRUD, wellbeing
// v3.0.0 — imports: storage, ui

import { K, ls, checkins, fastState } from './storage.js?v=3.0';
import { toast, fmtDate, dtLocalStr } from './ui.js?v=3.0';

// ── Wellbeing state ────────────────────────────────────────────────
const wbState = { energy: 0, hunger: 0, clarity: 0 };

export function wbSelect(field, val) {
  wbState[field] = val;
  const colors = { energy: '#00d4ff', hunger: '#ff7043', clarity: '#8b5cf6' };
  const el = document.getElementById('wb-' + field);
  if (!el) return;
  el.querySelectorAll('.wb-btn').forEach(b => {
    const active = parseInt(b.dataset.v) === val;
    b.classList.toggle('active', active);
    if (active) b.style.setProperty('--wc', colors[field]);
  });
}

// ── Form init ──────────────────────────────────────────────────────
export function initCIForm() {
  const dtEl = document.getElementById('ci-dt');
  if (dtEl) dtEl.value = dtLocalStr(new Date());
  wbState.energy = 0;
  wbState.hunger = 0;
  wbState.clarity = 0;
  ['energy', 'hunger', 'clarity'].forEach(f => {
    document.getElementById('wb-' + f)
      ?.querySelectorAll('.wb-btn')
      .forEach(b => { b.classList.remove('active'); b.style.removeProperty('--wc'); });
  });
}

// ── Inline validation ──────────────────────────────────────────────
function setFieldError(inputId, errId, msg) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (inp) inp.classList.toggle('input-error', !!msg);
  if (err) err.textContent = msg || '';
}

function validateCheckin() {
  let ok = true;
  const wt = document.getElementById('ci-wt');
  if (!wt?.value || isNaN(parseFloat(wt.value))) {
    setFieldError('ci-wt', 'ci-wt-err', 'Weight is required');
    ok = false;
  } else {
    setFieldError('ci-wt', 'ci-wt-err', '');
  }
  const bf = document.getElementById('ci-bf');
  if (!bf?.value || isNaN(parseFloat(bf.value))) {
    setFieldError('ci-bf', 'ci-bf-err', 'Body fat % is required');
    ok = false;
  } else {
    setFieldError('ci-bf', 'ci-bf-err', '');
  }
  return ok;
}

// ── Save check-in ──────────────────────────────────────────────────
export function saveCheckin() {
  if (!validateCheckin()) return;
  const dt = document.getElementById('ci-dt').value;
  const wt = parseFloat(document.getElementById('ci-wt').value);
  const bf = parseFloat(document.getElementById('ci-bf').value);
  const wb = {
    energy:  wbState.energy  || null,
    hunger:  wbState.hunger  || null,
    clarity: wbState.clarity || null,
  };
  const cks = checkins();
  cks.push({ datetime: dt, weight: wt, bodyFat: bf, id: Date.now(), wb });
  cks.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  ls.set(K.CHKINS, cks);
  document.getElementById('ci-wt').value = '';
  document.getElementById('ci-bf').value = '';
  renderCIHistory();
  toast('✅ Check-in saved!');
  document.dispatchEvent(new CustomEvent('ft:checkin-saved'));
}

// ── Render history ─────────────────────────────────────────────────
export function renderCIHistory() {
  const el = document.getElementById('ci-history');
  if (!el) return;
  const cks = checkins();
  if (!cks.length) {
    el.innerHTML = '<div class="empty">No check-ins yet. Tap ＋ to add one.</div>';
    return;
  }
  const wbIcons = {
    energy:  ['😴', '😩', '😐', '💪', '⚡'],
    hunger:  ['🔥', '😫', '😐', '🙂', '😌'],
    clarity: ['🌫️', '😵', '🤔', '💡', '🧠'],
  };
  el.innerHTML = `<div class="slbl">Recent Entries</div>` +
    [...cks].reverse().slice(0, 20).map(ck => {
      let wbHtml = '';
      if (ck.wb && (ck.wb.energy || ck.wb.hunger || ck.wb.clarity)) {
        const chips = [
          ck.wb.energy  ? `<span class="wb-chip">⚡${wbIcons.energy[ck.wb.energy - 1]} ${ck.wb.energy}</span>` : '',
          ck.wb.hunger  ? `<span class="wb-chip">🍽️${wbIcons.hunger[ck.wb.hunger - 1]} ${ck.wb.hunger}</span>` : '',
          ck.wb.clarity ? `<span class="wb-chip">🧠${wbIcons.clarity[ck.wb.clarity - 1]} ${ck.wb.clarity}</span>` : '',
        ].filter(Boolean).join('');
        wbHtml = `<div class="wb-row" style="width:100%">${chips}</div>`;
      }
      return `<div class="hist-item" style="flex-wrap:wrap;align-items:center">
        <span class="hd">${fmtDate(ck.datetime, true)}</span>
        <span class="hw">${ck.weight} kg</span>
        <span class="hf">${ck.bodyFat != null ? ck.bodyFat + '%' : '—'}</span>
        <div class="hist-actions">
          <button class="hist-act" data-edit-id="${ck.id}" title="Edit" aria-label="Edit entry">✏️</button>
          <button class="hist-act" data-del-id="${ck.id}"  title="Delete" aria-label="Delete entry">🗑️</button>
        </div>
        ${wbHtml}
      </div>`;
    }).join('');
}

// ── Edit modal ─────────────────────────────────────────────────────
export function openEditModal(id) {
  const title = document.getElementById('ci-edit-title');
  const idEl  = document.getElementById('ci-edit-id');
  const dtEl  = document.getElementById('ci-edit-dt');
  const wtEl  = document.getElementById('ci-edit-wt');
  const bfEl  = document.getElementById('ci-edit-bf');
  if (!idEl) return;

  if (id) {
    const ck = checkins().find(c => String(c.id) === String(id));
    if (!ck) return;
    if (title) title.textContent = '✏️ Edit Check-in';
    idEl.value = ck.id;
    if (dtEl) dtEl.value = dtLocalStr(new Date(ck.datetime));
    if (wtEl) wtEl.value = ck.weight;
    if (bfEl) bfEl.value = ck.bodyFat != null ? ck.bodyFat : '';
  } else {
    if (title) title.textContent = '＋ Add Check-in';
    idEl.value = '';
    if (dtEl) dtEl.value = dtLocalStr(new Date());
    if (wtEl) wtEl.value = '';
    if (bfEl) bfEl.value = '';
  }
  // Dispatch to main.js to openModal
  document.dispatchEvent(new CustomEvent('ft:open-modal', { detail: { id: 'ci-edit-modal' } }));
}

export function saveEditCheckin() {
  const id    = document.getElementById('ci-edit-id')?.value;
  const dt    = document.getElementById('ci-edit-dt')?.value;
  const wt    = parseFloat(document.getElementById('ci-edit-wt')?.value);
  const bfRaw = document.getElementById('ci-edit-bf')?.value;
  const bf    = bfRaw !== '' ? parseFloat(bfRaw) : null;

  if (!dt || isNaN(wt)) {
    setFieldError('ci-edit-wt', 'ci-edit-wt-err', 'Date and weight are required');
    return;
  }
  setFieldError('ci-edit-wt', 'ci-edit-wt-err', '');

  let cks = checkins();
  if (id) {
    cks = cks.map(c => String(c.id) === String(id) ? { ...c, datetime: dt, weight: wt, bodyFat: bf } : c);
    toast('✅ Entry updated');
  } else {
    cks.push({ datetime: dt, weight: wt, bodyFat: bf, id: Date.now(), src: 'manual' });
    cks.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    toast('✅ Entry added');
  }
  ls.set(K.CHKINS, cks);
  document.dispatchEvent(new CustomEvent('ft:close-modal', { detail: { id: 'ci-edit-modal' } }));
  renderCIHistory();
  document.dispatchEvent(new CustomEvent('ft:checkin-saved'));
}

export function deleteCheckin(id) {
  if (!confirm('Delete this check-in?')) return;
  const cks = checkins().filter(c => String(c.id) !== String(id));
  ls.set(K.CHKINS, cks);
  renderCIHistory();
  toast('🗑️ Deleted');
  document.dispatchEvent(new CustomEvent('ft:checkin-saved'));
}

// ── Event delegation for history actions ──────────────────────────
export function initCheckinEvents() {
  // Wellbeing buttons
  document.getElementById('wb-energy')?.addEventListener('click', e => {
    const btn = e.target.closest('.wb-btn');
    if (btn) wbSelect('energy', parseInt(btn.dataset.v));
  });
  document.getElementById('wb-hunger')?.addEventListener('click', e => {
    const btn = e.target.closest('.wb-btn');
    if (btn) wbSelect('hunger', parseInt(btn.dataset.v));
  });
  document.getElementById('wb-clarity')?.addEventListener('click', e => {
    const btn = e.target.closest('.wb-btn');
    if (btn) wbSelect('clarity', parseInt(btn.dataset.v));
  });

  // Save check-in button
  document.getElementById('btn-save-checkin')?.addEventListener('click', saveCheckin);

  // Add entry button
  document.getElementById('btn-add-entry')?.addEventListener('click', () => openEditModal(null));

  // Edit / delete (event delegation on container)
  document.getElementById('ci-history')?.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-id]');
    const delBtn  = e.target.closest('[data-del-id]');
    if (editBtn) openEditModal(editBtn.dataset.editId);
    if (delBtn)  deleteCheckin(delBtn.dataset.delId);
  });

  // Edit modal save
  document.getElementById('btn-save-edit-checkin')?.addEventListener('click', saveEditCheckin);
}
