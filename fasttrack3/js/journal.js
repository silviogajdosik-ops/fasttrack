// journal.js — fast journal (mood + notes per day)
// v3.0.0 — imports: storage, ui

import { fastState, getJournal, saveJournal } from './storage.js?v=3.0';
import { toast, fmtDate } from './ui.js?v=3.0';

let jMoodSel = 0;

export function initJournal() {
  jMoodSel = 0;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  const note = document.getElementById('journal-note');
  if (note) note.value = '';

  const state = fastState();
  const badge = document.getElementById('journal-day-badge');
  if (badge) {
    if (state) {
      const hrs = (Date.now() - new Date(state.startTime).getTime()) / 3600000;
      badge.textContent = 'Day ' + (Math.floor(hrs / 24) + 1);
    } else {
      badge.textContent = 'No active fast';
    }
  }
  renderJournal();
}

export function jMood(v) {
  jMoodSel = v;
  document.querySelectorAll('.mood-btn').forEach(b =>
    b.classList.toggle('selected', Number(b.dataset.v) === v)
  );
}

export function saveJournalEntry() {
  const state = fastState();
  if (!state) { toast('No active fast'); return; }
  const note = (document.getElementById('journal-note') || {}).value || '';
  if (!note.trim() && !jMoodSel) { toast('Add a mood or note first'); return; }
  const hrs = (Date.now() - new Date(state.startTime).getTime()) / 3600000;
  const day = Math.floor(hrs / 24) + 1;
  const entries = getJournal();
  entries.push({
    fastId:   state.startTime,
    day,
    datetime: new Date().toISOString(),
    mood:     jMoodSel || 0,
    note:     note.trim(),
  });
  saveJournal(entries);
  toast('Journal entry saved 📔');
  initJournal();
}

export function renderJournal() {
  const el = document.getElementById('journal-history');
  if (!el) return;
  const state  = fastState();
  const fastId = state ? state.startTime : null;
  const all    = getJournal().filter(e => !fastId || e.fastId === fastId);
  const entries = [...all].reverse();
  const MOODS = ['', '😫', '😕', '😐', '🙂', '🌟'];
  const MLBL  = ['', 'Rough', 'Meh', 'Okay', 'Good', 'Great'];
  if (!entries.length) {
    el.innerHTML = '<p style="color:var(--text3);font-size:.78rem;text-align:center;margin-top:10px">No journal entries yet for this fast.</p>';
    return;
  }
  el.innerHTML = entries.map(e => `<div class="j-entry">
    <div class="j-entry-hdr">
      <span class="j-day">Day ${e.day}</span>
      <span class="j-mood">${e.mood ? MOODS[e.mood] + ' ' + MLBL[e.mood] : ''}</span>
      <span class="j-date">${fmtDate(e.datetime)}</span>
    </div>
    ${e.note ? `<div class="j-note">${e.note}</div>` : ''}
  </div>`).join('');
}

// ── Wire up buttons ────────────────────────────────────────────────
export function initJournalEvents() {
  document.querySelector('.mood-row')?.addEventListener('click', e => {
    const btn = e.target.closest('.mood-btn');
    if (btn) jMood(parseInt(btn.dataset.v));
  });
  document.getElementById('btn-save-journal')?.addEventListener('click', saveJournalEntry);
}
