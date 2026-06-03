// badges.js — badge definitions, check logic, rack/grid builders
// v3.2.0 — imports: storage, ui

import { fastState, earnedBadges, saveEarnedBadges, ls, K } from './storage.js?v=3.0';
import { toast } from './ui.js?v=3.0';

export const BADGES = [
  { id:'12h', h:12,  icon:'⚡', name:'Ketosis Spark',     color:'#00d4ff', desc:'12 hours — the metabolic switch begins' },
  { id:'24h', h:24,  icon:'🔥', name:'Fat Burner',        color:'#ff7043', desc:'24 hours — deep ketosis engaged' },
  { id:'36h', h:36,  icon:'💪', name:'Iron Will',         color:'#8b5cf6', desc:"36 hours — most people stop here. You didn't." },
  { id:'48h', h:48,  icon:'🧬', name:'Autophagy Active',  color:'#ffd740', desc:'48 hours — cellular cleanup at full power' },
  { id:'72h', h:72,  icon:'🛡️', name:'Immune Warrior',    color:'#00e676', desc:'72 hours — immune system regenerating' },
  { id:'5d',  h:120, icon:'🌟', name:'Deep Reset Master', color:'#e040fb', desc:'5 days — profound metabolic transformation' },
  { id:'7d',  h:168, icon:'🏆', name:'Legendary',         color:'#ffd740', desc:'7 days — you are in rare territory now' },
];

export const LIFETIME_BADGES = [
  { id:'trilogy',  icon:'🎯', name:'Trilogy',   color:'#00d4ff', desc:'Complete 3 fasts',       type:'fasts',    n:3   },
  { id:'high5',    icon:'✋', name:'High Five',  color:'#00ff88', desc:'Complete 5 fasts',       type:'fasts',    n:5   },
  { id:'decade',   icon:'🔟', name:'Decade',     color:'#ffd700', desc:'Complete 10 fasts',      type:'fasts',    n:10  },
  { id:'consist',  icon:'📅', name:'Consistent', color:'#a78bfa', desc:'Log 7 check-ins total',  type:'checkins', n:7   },
  { id:'dedicatd', icon:'💎', name:'Dedicated',  color:'#00d4ff', desc:'Log 14 check-ins total', type:'checkins', n:14  },
  { id:'commited', icon:'🏗️', name:'Committed',  color:'#ff7043', desc:'Log 30 check-ins total', type:'checkins', n:30  },
  { id:'torch',    icon:'🔦', name:'Torch',      color:'#ffd740', desc:'Lose 2kg fat total',     type:'fatlost',  kg:2  },
  { id:'inferno',  icon:'🔥', name:'Inferno',    color:'#ff7043', desc:'Lose 5kg fat total',     type:'fatlost',  kg:5  },
  { id:'furnace',  icon:'🌋', name:'Furnace',    color:'#e040fb', desc:'Lose 10kg fat total',    type:'fatlost',  kg:10 },
];

function thisFastBadgeIds() {
  const state = fastState();
  if (!state) return new Set();
  return new Set(earnedBadges().filter(b => b.fastStart === state.startTime).map(b => b.id));
}

export function checkBadges(hrs) {
  const state = fastState();
  if (!state) return;
  const thisFast = thisFastBadgeIds();
  let anyNew = false;
  for (const badge of BADGES) {
    if (hrs < badge.h) break;
    if (thisFast.has(badge.id)) continue;
    const earned = earnedBadges();
    earned.push({ id: badge.id, earnedAt: Date.now(), fastStart: state.startTime });
    saveEarnedBadges(earned);
    showBadgeToast(badge);
    anyNew = true;
  }
  if (anyNew) {
    const rack = document.getElementById('badge-rack');
    if (rack) rack.innerHTML = buildBadgeRack();
  }
}

export function checkLifetimeBadges() {
  const hist = ls.get('ft_history', []);
  const allEarned = earnedBadges();
  const allIds = new Set(allEarned.map(b => b.id));
  const numFasts = hist.length;
  const totalCheckins = hist.reduce((s, f) => s + (f.checkins ? f.checkins.length : 0), 0);
  const totalFatLost = hist.reduce((s, f) => {
    if (f.startWeight && f.startBodyFat && f.finalWeight && f.finalFat) {
      return s + Math.max(0, (f.startWeight * f.startBodyFat / 100) - (f.finalWeight * f.finalFat / 100));
    }
    return s;
  }, 0);
  let anyNew = false;
  for (const badge of LIFETIME_BADGES) {
    if (allIds.has(badge.id)) continue;
    const earn =
      (badge.type === 'fasts'    && numFasts >= badge.n)    ||
      (badge.type === 'checkins' && totalCheckins >= badge.n) ||
      (badge.type === 'fatlost'  && totalFatLost >= badge.kg);
    if (earn) {
      const arr = earnedBadges();
      arr.push({ id: badge.id, earnedAt: Date.now(), fastStart: 'lifetime' });
      saveEarnedBadges(arr);
      showBadgeToast(badge);
      anyNew = true;
    }
  }
  return anyNew;
}

export function showBadgeToast(badge) {
  // Full-screen overlay for milestones
  const overlay = document.createElement('div');
  overlay.className = 'badge-unlock-overlay';
  overlay.innerHTML = `
    <div class="bum-card" style="border-color:${badge.color}44">
      <span class="bum-icon" style="filter:drop-shadow(0 0 20px ${badge.color})">${badge.icon}</span>
      <div class="bum-label">Achievement Unlocked!</div>
      <div class="bum-name" style="color:${badge.color}">${badge.name}</div>
      <div class="bum-desc">${badge.desc}</div>
      <button class="btn btn-ghost btn-sm" style="border-color:${badge.color};color:${badge.color};max-width:160px;margin:0 auto">✓ &nbsp;Nice!</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('button').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  setTimeout(() => overlay?.remove(), 6000);
}

export function buildBadgeRack() {
  const thisFast = thisFastBadgeIds();
  const state = fastState();
  const hrs = state ? (Date.now() - new Date(state.startTime).getTime()) / 3600000 : 0;
  const nextBadge = BADGES.find(b => !thisFast.has(b.id) && hrs < b.h);

  let html = [...BADGES].filter(b => thisFast.has(b.id)).map(b =>
    `<div class="br-badge earned" style="--bc:${b.color}">
      <span class="br-icon">${b.icon}</span>
      <span class="br-name" style="color:${b.color}">${b.name}</span>
    </div>`
  ).join('');

  if (nextBadge) {
    const rem = nextBadge.h - hrs;
    const rh = Math.floor(rem), rm = Math.floor((rem - rh) * 60);
    html += `<div class="br-badge next">
      <span class="br-icon">${nextBadge.icon}</span>
      <span class="br-name">${nextBadge.name}</span>
      <span class="br-eta">in ${rh}h ${rm}m</span>
    </div>`;
  }
  if (!html) html = '<span style="color:var(--text3);font-size:.8rem;padding:4px 0">Complete a milestone to earn your first badge</span>';
  return html;
}

export function buildBadgeGrid() {
  const allEarned = earnedBadges();
  const allIds = new Set(allEarned.map(b => b.id));
  const renderBadge = (badge, lockLabel) => {
    const ok = allIds.has(badge.id);
    const times = allEarned.filter(b => b.id === badge.id).length;
    return `<div class="bg-badge ${ok ? 'earned' : 'locked'}">
      <div class="bg-icon" style="${ok ? 'color:' + badge.color : 'filter:grayscale(1)'}">${badge.icon}</div>
      <div class="bg-name" style="${ok ? 'color:' + badge.color : ''}">${badge.name}</div>
      <div class="bg-desc">${badge.desc}</div>
      ${ok
        ? `<div class="bg-count" style="color:${badge.color}">×${times} earned</div>`
        : `<div class="bg-locked">🔒 ${lockLabel}</div>`}
    </div>`;
  };
  const timeSection = '<div class="bg-section-hdr">⏱ Fast Duration</div>'
    + BADGES.map(b => renderBadge(b, 'unlock at ' + b.h + 'h')).join('');
  const lifeSection = '<div class="bg-section-hdr">🏆 Lifetime Achievements</div>'
    + LIFETIME_BADGES.map(b => renderBadge(b, b.desc)).join('');
  return timeSection + lifeSection;
}
