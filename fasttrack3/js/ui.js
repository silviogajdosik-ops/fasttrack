// ui.js — modali, toast, tab nav, nav pill, date helpers
// v3.2.0 — imports: storage

import { getProfile } from './storage.js?v=3.2';

// ── Tab renderer registry (registered by main.js) ──────────────────
const _tabRenderers = {};
export function onTab(name, fn) { _tabRenderers[name] = fn; }

let _activeTab = 'home';
export function getActiveTab() { return _activeTab; }

export function showTab(name) {
  _activeTab = name;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name)
  );
  const el = document.getElementById('tab-' + name);
  if (el) el.classList.add('active');
  if (_tabRenderers[name]) _tabRenderers[name]();
  moveNavPill(name);
  window.scrollTo(0, 0);
}

// ── Nav pill (transform: translateX) ──────────────────────────────
export function moveNavPill(name) {
  const btn  = document.querySelector(`.nav-btn[data-tab="${name}"]`);
  const nav  = document.querySelector('.bottom-nav');
  const pill = document.getElementById('nav-pill');
  if (!btn || !pill || !nav) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  pill.style.setProperty('--pill-x', (btnRect.left - navRect.left) + 'px');
}

// ── Modals (backdrop click + Escape) ──────────────────────────────
const _preOpenHooks = {};
export function onModalOpen(id, fn) { _preOpenHooks[id] = fn; }

export function openModal(id) {
  if (_preOpenHooks[id]) _preOpenHooks[id]();
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
  const handleBdClick = (e) => {
    if (e.target === overlay) {
      closeModal(id);
      overlay.removeEventListener('click', handleBdClick);
    }
  };
  overlay.addEventListener('click', handleBdClick);
}

export function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}

// Escape closes all open modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.open').forEach(el => closeModal(el.id));
  }
});

// ── Toast ─────────────────────────────────────────────────────────
export function toast(msg) {
  const w = document.getElementById('toast-wrap');
  if (!w) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  w.appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

// ── Screen (setup → main-app) ──────────────────────────────────────
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = s.id === id ? '' : 'none';
  });
  const el = document.getElementById(id);
  if (el) { el.style.display = ''; el.classList.add('active'); }
}

// ── Header name ────────────────────────────────────────────────────
export function updateHeaderName() {
  const p = getProfile();
  const btn = document.getElementById('profile-btn');
  if (btn && p) btn.textContent = '👤 ' + p.name;
}

// ── Date / time helpers ────────────────────────────────────────────
export function dtLocalStr(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fmtDate(str, withTime = false) {
  try {
    const d = new Date(str);
    if (withTime) return (
      d.toLocaleDateString('en-US', { month:'short', day:'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })
    );
    return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  } catch { return str; }
}

export function fmtDur(ms) {
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60) };
}

export function fmtDurStr(ms) {
  const { days, hours, minutes } = fmtDur(ms);
  let s = '';
  if (days > 0) s += days + 'd ';
  s += hours + 'h ' + minutes + 'm';
  return s;
}
