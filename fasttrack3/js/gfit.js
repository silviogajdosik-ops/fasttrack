// gfit.js — Google Fit integration (port from v2)
// v3.0.0 — imports: storage, ui

import { K, ls, checkins, getGFitCfg, saveGFitCfg, isGFitConnected } from './storage.js?v=3.0';
import { toast } from './ui.js?v=3.0';

export function loadGISScript(cb) {
  if (typeof google !== 'undefined' && google.accounts) { cb(); return; }
  if (document.getElementById('gis-script')) {
    setTimeout(() => { if (typeof google !== 'undefined') cb(); }, 800);
    return;
  }
  const s = document.createElement('script');
  s.id = 'gis-script';
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload = cb;
  s.onerror = () => toast('❌ Could not load Google SDK — check internet connection');
  document.head.appendChild(s);
}

export function connectGoogleFit() {
  const cfg = getGFitCfg();
  if (!cfg.clientId) { toast('⚠️ Save your Client ID first'); return; }
  if (typeof google === 'undefined' || !google.accounts) { loadGISScript(connectGoogleFit); return; }
  try {
    google.accounts.oauth2.initTokenClient({
      client_id: cfg.clientId,
      scope: 'https://www.googleapis.com/auth/fitness.body.read',
      callback: async resp => {
        if (resp.error) { toast('❌ ' + resp.error); return; }
        saveGFitCfg({ ...cfg, token: resp.access_token, expiresAt: Date.now() + (resp.expires_in || 3600) * 1000 });
        toast('✅ Connected to Google Fit!');
        document.dispatchEvent(new CustomEvent('ft:render-data'));
        await syncGoogleFitData();
      },
    }).requestAccessToken();
  } catch (e) { toast('❌ ' + e.message); }
}

export function disconnectGoogleFit() {
  const { clientId } = getGFitCfg();
  saveGFitCfg({ clientId });
  toast('🔌 Disconnected');
  document.dispatchEvent(new CustomEvent('ft:render-data'));
}

export async function syncGoogleFitData() {
  const cfg = getGFitCfg();
  if (!isGFitConnected()) {
    if (cfg.clientId) { toast('🔑 Token expired — re-authenticating…'); connectGoogleFit(); return; }
    toast('⚠️ Not connected — save your Client ID first'); return;
  }
  toast('🔄 Syncing...');
  const now  = Date.now();
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.weight' }, { dataTypeName: 'com.google.body.fat.percentage' }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: now - 30 * 86400000,
    endTimeMillis:   now,
  };
  try {
    const r = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + cfg.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.status === 401) {
      const c = { ...cfg }; delete c.token; delete c.expiresAt; saveGFitCfg(c);
      toast('🔑 Session expired — reconnect'); document.dispatchEvent(new CustomEvent('ft:render-data')); return;
    }
    if (!r.ok) { toast('❌ API error ' + r.status); return; }
    const data = await r.json();
    const n = importGFitBuckets(data.bucket || []);
    toast(n > 0 ? `📥 ${n} new entries imported from Google Fit` : '✅ Already up to date');
    document.dispatchEvent(new CustomEvent('ft:checkin-saved'));
    document.dispatchEvent(new CustomEvent('ft:render-data'));
  } catch (e) { toast('❌ ' + e.message); }
}

function importGFitBuckets(buckets) {
  const existing   = checkins();
  const existingTs = existing.map(c => new Date(c.datetime).getTime());
  const toAdd = [];
  let n = 0;
  for (const b of buckets) {
    let wt = null, fat = null, ptTs = null;
    for (const set of (b.dataset || [])) {
      const sid = set.dataSourceId || '';
      for (const pt of (set.point || [])) {
        const val = pt.value?.[0]?.fpVal;
        if (!val) continue;
        const ts = pt.startTimeNanos
          ? Math.round(parseInt(pt.startTimeNanos) / 1e6)
          : parseInt(b.startTimeMillis);
        if (sid.includes('weight'))  { wt = val; ptTs = ts; }
        else if (sid.includes('fat')) { fat = val; }
      }
    }
    if (!wt || !ptTs) continue;
    const threshold = 60 * 60 * 1000;
    const conflict = existing.find(c => Math.abs(new Date(c.datetime).getTime() - ptTs) < threshold);
    if (conflict) continue;
    toAdd.push({ datetime: new Date(ptTs).toISOString(), weight: parseFloat(wt.toFixed(2)), bodyFat: fat ? parseFloat(fat.toFixed(1)) : null, id: ptTs, src: 'gfit' });
    n++;
  }
  if (toAdd.length) {
    const merged = [...existing, ...toAdd].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    ls.set(K.CHKINS, merged);
  }
  return n;
}

export function renderGFitSection() {
  const el = document.getElementById('gfit-section');
  if (!el) return;
  const cfg       = getGFitCfg();
  const connected = isGFitConnected();
  el.innerHTML = `
    ${connected
      ? `<div class="info-row"><span class="ilab">Status</span><span class="ival" style="color:var(--grn)">✅ Connected</span></div>
         <div style="display:flex;gap:8px;margin-top:10px">
           <button class="btn btn-ghost btn-sm" id="btn-gfit-sync" style="flex:1">🔄 Sync Now</button>
           <button class="btn btn-ghost btn-sm" id="btn-gfit-dc"   style="flex:1">🔌 Disconnect</button>
         </div>`
      : `<p style="font-size:.8rem;color:var(--text2);margin-bottom:10px;line-height:1.55;">
           Connect Google Fit (Zepp Life / Xiaomi) to auto-import weight & body fat.
         </p>
         <div class="ig">
           <label class="il" for="gfit-cid">OAuth 2.0 Client ID</label>
           <input type="text" id="gfit-cid" placeholder="xxxxxxxxx.apps.googleusercontent.com" value="${cfg.clientId || ''}">
         </div>
         <div style="display:flex;gap:8px;margin-top:10px">
           <button class="btn btn-primary btn-sm" id="btn-gfit-save" style="flex:1">💾 Save &amp; Connect</button>
         </div>`}`;

  if (connected) {
    document.getElementById('btn-gfit-sync')?.addEventListener('click', syncGoogleFitData);
    document.getElementById('btn-gfit-dc')  ?.addEventListener('click', disconnectGoogleFit);
  } else {
    document.getElementById('btn-gfit-save')?.addEventListener('click', () => {
      const cid = document.getElementById('gfit-cid')?.value.trim();
      if (!cid) { toast('⚠️ Enter Client ID'); return; }
      saveGFitCfg({ ...cfg, clientId: cid });
      loadGISScript(connectGoogleFit);
    });
  }
}
