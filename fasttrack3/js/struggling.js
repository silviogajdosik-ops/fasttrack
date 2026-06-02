// struggling.js — Struggling Mode modal
// v3.0.0 — imports: storage, phases, ui

import { K, ls, fastState } from './storage.js?v=3.0';
import { STRUGGLING } from './phases.js?v=3.0';
import { openModal, closeModal } from './ui.js?v=3.0';

export function openStrugglingModal() {
  const s1 = document.getElementById('struggling-step1');
  const s2 = document.getElementById('struggling-step2');
  if (s1) s1.style.display = '';
  if (s2) s2.style.display = 'none';
  const struggles = ls.get(K.STRUGGLES, []);
  struggles.push({ ts: Date.now(), category: null });
  ls.set(K.STRUGGLES, struggles);
  openModal('struggling-modal');
}

export function selectStrugglingCat(cat) {
  const data = STRUGGLING[cat];
  if (!data) return;
  const item  = data.msgs[Math.floor(Math.random() * data.msgs.length)];
  const state = fastState();
  const hrs   = state ? (Date.now() - new Date(state.startTime).getTime()) / 3600000 : 0;
  const d = Math.floor(hrs / 24), h = Math.floor(hrs % 24);
  const ts = d > 0 ? `${d}d ${h}h` : `${Math.floor(hrs)}h`;

  const timeEl = document.getElementById('sg-time');
  if (timeEl) timeEl.innerHTML = `You have already made it <strong style="color:var(--cyan)">${ts}</strong>. That is real progress.`;

  const msgEl = document.getElementById('sg-msg');
  if (msgEl) msgEl.textContent = item.msg;

  const sciEl = document.getElementById('sg-sci');
  if (sciEl) sciEl.textContent = item.sci;

  document.getElementById('struggling-step1').style.display = 'none';
  document.getElementById('struggling-step2').style.display = '';

  const struggles = ls.get(K.STRUGGLES, []);
  if (struggles.length) struggles[struggles.length - 1].category = cat;
  ls.set(K.STRUGGLES, struggles);
}

export function backToStrugglingStep1() {
  document.getElementById('struggling-step1').style.display = '';
  document.getElementById('struggling-step2').style.display = 'none';
}

// ── Event delegation ───────────────────────────────────────────────
export function initStrugglingEvents() {
  document.getElementById('struggling-modal')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if (btn) selectStrugglingCat(btn.dataset.cat);
    if (e.target.closest('#btn-struggling-back')) backToStrugglingStep1();
  });
}
