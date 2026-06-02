// storage.js — localStorage wrapper + all data accessors
// v3.0.0 — no deps

export const APP_VERSION = 'v3.1.0';

export const K = {
  PROF:      'ft_profile',
  STATE:     'ft_state',
  CHKINS:    'ft_checkins',
  DONE:      'ft_done',
  HISTORY:   'ft_history',
  QUOTE:     'ft_quote',
  NOTIF:     'ft_notif',
  LPHASE:    'ft_lphase',
  GFIT:      'ft_gfit',
  BADGES:    'ft_badges',
  LBADGE:    'ft_lbadge',
  STRUGGLES: 'ft_struggles',
  JOURNAL:   'ft_journal',
};

export const ls = {
  get: (k, d = null) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k)    => localStorage.removeItem(k),
};

export const getProfile       = ()    => ls.get(K.PROF);
export const fastState        = ()    => ls.get(K.STATE);
export const checkins         = ()    => ls.get(K.CHKINS, []);
export const doneFast         = ()    => ls.get(K.DONE);
export const fastHistory      = ()    => ls.get(K.HISTORY, []);
export const getJournal       = ()    => ls.get(K.JOURNAL, []);
export const saveJournal      = (arr) => ls.set(K.JOURNAL, arr);
export const earnedBadges     = ()    => ls.get(K.BADGES, []);
export const saveEarnedBadges = (arr) => ls.set(K.BADGES, arr);
export const getGFitCfg       = ()    => ls.get(K.GFIT, {});
export const saveGFitCfg      = (cfg) => ls.set(K.GFIT, cfg);
export const isGFitConnected  = ()    => {
  const g = getGFitCfg();
  return !!(g.token && g.expiresAt > Date.now());
};

/** Migrate legacy ft_done → ft_history (one-time, v2.0+) */
export function migrateLegacy() {
  const legacyDone = ls.get(K.DONE);
  const hist = ls.get(K.HISTORY);
  if (legacyDone && !hist) ls.set(K.HISTORY, [legacyDone]);
}
