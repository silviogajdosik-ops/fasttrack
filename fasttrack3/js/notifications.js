// notifications.js — push notifications, milestone alerts
// v3.0.0 — imports: storage, ui

import { K, ls, fastState, getProfile } from './storage.js?v=3.0';
import { getPhase } from './phases.js?v=3.0';
import { toast } from './ui.js?v=3.0';

const NOTIF_DEF = { enabled: false, checkinHour: 7, milestones: true };

export function getNotifSettings() { return { ...NOTIF_DEF, ...ls.get(K.NOTIF, {}) }; }
export function saveNotifSettings(s) { ls.set(K.NOTIF, s); }

export async function initNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  const s = getNotifSettings();
  if (s.enabled && Notification.permission === 'granted') scheduleCheckinReminder(s.checkinHour);
}

export async function requestNotifPermission() {
  if (!('Notification' in window)) { toast('❌ Notifications not supported'); return; }
  const p = await Notification.requestPermission();
  if (p === 'granted') {
    const s = getNotifSettings();
    s.enabled = true;
    saveNotifSettings(s);
    if (fastState()) scheduleCheckinReminder(s.checkinHour);
    toast('🔔 Notifications enabled!');
    document.dispatchEvent(new CustomEvent('ft:render-data'));
  } else {
    toast('⚠️ Permission denied — check browser/OS settings');
  }
}

export function scheduleCheckinReminder(hour = 7) {
  if (!fastState() || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    if (!reg.active) return;
    const now = new Date(), next = new Date();
    next.setHours(parseInt(hour), 0, 0, 0);
    if (now >= next) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();
    const p = getProfile(), name = p ? p.name : 'there';
    reg.active.postMessage({
      type: 'SCHEDULE_NOTIF', delay,
      title: '⚡ FastTrack — Morning Check-in',
      body:  'Good morning, ' + name + '! Time to log your measurements.',
      tag:   'checkin',
    });
    toast('⏰ Check-in reminder set for ' + String(hour).padStart(2, '0') + ':00');
  }).catch(() => toast('⚠️ Could not schedule — open app as PWA first'));
}

export function checkPhaseMilestone(hrs) {
  if (!fastState()) return;
  const s = getNotifSettings();
  if (!s.enabled || !s.milestones) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const phase = getPhase(hrs);
  const last  = ls.get(K.LPHASE, -1);
  if (phase.id > last) {
    ls.set(K.LPHASE, phase.id);
    if (last >= 0 && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        if (!reg.active) return;
        reg.active.postMessage({
          type: 'SCHEDULE_NOTIF', delay: 0,
          title: '⚡ ' + phase.icon + ' New Phase Unlocked!',
          body:  phase.name + ': ' + phase.desc,
          tag:   'milestone',
        });
      }).catch(() => {});
    }
  }
}

export function setCheckinHour(hour) {
  const s = getNotifSettings();
  s.checkinHour = hour;
  saveNotifSettings(s);
  if (s.enabled) scheduleCheckinReminder(hour);
  else toast('Morning time set to ' + String(hour).padStart(2, '0') + ':00');
  document.dispatchEvent(new CustomEvent('ft:render-data'));
}

export function toggleMilestones() {
  const s = getNotifSettings();
  s.milestones = !s.milestones;
  saveNotifSettings(s);
  toast(s.milestones ? '🔔 Phase alerts on' : '🔕 Phase alerts off');
  document.dispatchEvent(new CustomEvent('ft:render-data'));
}

export function enableNotifications() {
  const s = getNotifSettings();
  s.enabled = true;
  saveNotifSettings(s);
  scheduleCheckinReminder(s.checkinHour);
  document.dispatchEvent(new CustomEvent('ft:render-data'));
}

export function disableNotifications() {
  const s = getNotifSettings();
  s.enabled = false;
  saveNotifSettings(s);
  toast('🔕 Notifications paused');
  document.dispatchEvent(new CustomEvent('ft:render-data'));
}

export function renderNotifSettings() {
  const el = document.getElementById('notif-settings');
  if (!el) return;
  const hasAPI = 'Notification' in window && 'serviceWorker' in navigator;
  if (!hasAPI) {
    el.innerHTML = '<div class="empty" style="text-align:left">Push notifications require Chrome on Android with PWA installed (Add to Home Screen).</div>';
    return;
  }
  const s    = getNotifSettings();
  const perm = Notification.permission;
  if (perm !== 'granted') {
    el.innerHTML = `<p style="font-size:.82rem;color:var(--text2);margin-bottom:13px;line-height:1.55;">
      Get reminders for morning check-ins and phase milestone alerts.
      <br><span style="color:var(--text3);font-size:.75rem;">Requires HTTPS or Add to Home Screen.</span>
    </p>
    <button class="btn btn-primary btn-sm" id="btn-enable-notif">🔔 &nbsp;Enable Notifications</button>`;
    document.getElementById('btn-enable-notif')?.addEventListener('click', requestNotifPermission);
    return;
  }
  const isOn = s.enabled;
  const hStr = h => String(h).padStart(2, '0');
  el.innerHTML = `
    <div class="info-row">
      <span class="ilab">Status</span>
      <span class="ival" style="color:${isOn ? 'var(--grn)' : 'var(--text3)'}">${isOn ? '🔔 Active' : '🔕 Paused'}</span>
    </div>
    <div style="padding:10px 0;border-bottom:1px solid var(--border);">
      <div class="ilab" style="margin-bottom:8px;">Morning reminder</div>
      <div style="display:flex;gap:6px;">
        ${[6, 7, 8, 9].map(h =>
          `<button class="btn btn-ghost btn-sm notif-hour-btn" data-hour="${h}" style="flex:1;${s.checkinHour === h && isOn ? 'border-color:var(--cyan);color:var(--cyan)' : ''}">${hStr(h)}:00</button>`
        ).join('')}
      </div>
    </div>
    <div class="info-row">
      <span class="ilab">Phase milestones</span>
      <button id="btn-toggle-milestones" class="btn btn-ghost btn-sm btn-icon" style="${s.milestones && isOn ? 'border-color:var(--cyan);color:var(--cyan)' : ''}">
        ${s.milestones ? '✅ On' : '⬜ Off'}
      </button>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      ${!isOn
        ? `<button class="btn btn-primary btn-sm" id="btn-notif-toggle" style="flex:1">🔔 Enable</button>`
        : `<button class="btn btn-ghost btn-sm"  id="btn-notif-toggle" style="flex:1">🔕 Disable</button>`}
    </div>`;

  el.querySelectorAll('.notif-hour-btn').forEach(b =>
    b.addEventListener('click', () => setCheckinHour(parseInt(b.dataset.hour)))
  );
  document.getElementById('btn-toggle-milestones')?.addEventListener('click', toggleMilestones);
  document.getElementById('btn-notif-toggle')?.addEventListener('click', isOn ? disableNotifications : enableNotifications);
}
