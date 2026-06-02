# FastTrack v3 — Plan i kontekst za novi chat

> **OBAVEZNO PROČITAJ OVO PRIJE SVEGA OSTALOG.**
> Ovaj dokument je jedini izvor istine. Memorija Claude-a nije pouzdana između sesija — sve važno je ovdje.

---

## Što postoji (ne diraj)

| Fajl | Verzija | Grana | URL |
|------|---------|-------|-----|
| `fasttrack.html` | v1.9.0 | `v1.5-wellbeing-journal` | `.../fasttrack.html` |
| `fasttrack2.html` | v2.6.1-ft2 | `v2-fasttrack2` | `.../fasttrack2.html` |

**Repo:** `https://github.com/silviogajdosik-ops/fasttrack.git`
**Live base URL:** `https://silviogajdosik-ops.github.io/fasttrack/`
**GitHub Pages source:** grana `v2-fasttrack2`, root `/`

---

## V3 — Što gradimo

FastTrack v3 = refaktor v2 u modularnu multi-file arhitekturu.
**Silvio's stroga pravila:**
- ❌ Nema Webpack, Vite, NPM, Node.js, bundlera
- ✅ Čisti ES moduli (`<script type="module">`)
- ✅ Cache-busting na svim importima: `?v=X.Y` — ručno inkrementirati
- ✅ SW kao zasebna `sw.js` datoteka (ne inline blob)
- ✅ Nema `onclick=""` u HTML-u — samo `addEventListener`
- ✅ Nav pill animacija: `transform: translateX()` (ne `left/width`)
- ✅ Modali: zatvaraju se klikom na backdrop i Escape tipkom
- ✅ Inline validacija umjesto toast poruka za greške na formama
- ✅ `aria-label` na svim emoji gumbima (Wellbeing ocjene, itd.)

---

## Struktura fajlova v3

```
fasttrack3/               ← novi folder u v2-fasttrack2 grani
├── index.html            ← entry point
├── sw.js                 ← Service Worker (zasebna datoteka)
├── css/
│   └── style.css?v=3.0   ← svi stilovi
└── js/
    ├── main.js           ← entry, import svih modula, init()
    ├── storage.js        ← sve localStorage operacije, K konstanta
    ├── fasting.js        ← faze, timer, faza progress, badge check
    ├── ui.js             ← DOM helperi, toast, modali, nav, tab
    ├── checkin.js        ← check-in forma, validacija, CRUD, historia
    ├── report.js         ← report generacija, SVG chartovi, history section
    ├── journal.js        ← fast journal (mood + notes)
    ├── struggling.js     ← Struggling Mode modal + data
    ├── badges.js         ← BADGES, LIFETIME_BADGES, checkBadges()
    ├── phases.js         ← PHASES array, getPhase(), phaseProgress()
    ├── notifications.js  ← push notifikacije, SW komunikacija
    └── gfit.js           ← Google Fit integracija (port iz v2)
```

**Live URL za v3:** `https://silviogajdosik-ops.github.io/fasttrack/fasttrack3/`

---

## Git workflow

```powershell
# UVIJEK PowerShell, nikad bash sandbox (bash ima permission greške na .git)
Set-Location "C:\Users\silvi\Desktop\Post\Post"

# V3 radi na istoj grani kao v2 (v2-fasttrack2), u podfolderu fasttrack3/
# GitHub Pages ostaje v2-fasttrack2 branch, root /
# V3 je dostupan na /fasttrack3/ URL-u automatski

git add .
git commit -m "v3.X.Y — opis"
git push origin v2-fasttrack2
```

**Naming konvencija:**
- Commit: `v3.X.Y — opis promjena`
- Ne trebamo novi branch za v3 — sve je u `v2-fasttrack2` grani

---

## Cache-busting pravilo

Svaki put kad mijenjaš CSS ili JS modul:
1. Inkrementiraj `?v=X.Y` na tom importu u `index.html` ili gdje god se importira
2. Bump `APP_VERSION` konstanta u `storage.js`
3. Bump `CACHE_VERSION` u `sw.js`

Primjer u `index.html`:
```html
<link rel="stylesheet" href="css/style.css?v=3.1">
<script type="module" src="js/main.js?v=3.1"></script>
```

Primjer u `main.js`:
```js
import { init } from './storage.js?v=3.1';
import { startTimer } from './fasting.js?v=3.1';
// itd. — SVE imports moraju imati ?v=X.Y
```

---

## Service Worker (sw.js)

```js
// sw.js — u root fasttrack3/ direktoriju
const CACHE_VERSION = 'ft3-v3.0';
const CACHE_FILES = [
  '/fasttrack/fasttrack3/',
  '/fasttrack/fasttrack3/index.html',
  '/fasttrack/fasttrack3/css/style.css',
  '/fasttrack/fasttrack3/js/main.js',
  // ... ostale JS datoteke
];
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE_VERSION).then(cache => cache.addAll(CACHE_FILES))
));
self.addEventListener('fetch', e => e.respondWith(
  caches.match(e.request).then(r => r || fetch(e.request))
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
  ))
));
```

SW se registrira u `main.js`:
```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
```

---

## LocalStorage Data Model (identičan v2, ne mijenja se)

| Key | Sadržaj |
|-----|---------|
| `ft_profile` | `{ name, age, gender, height }` |
| `ft_state` | `{ startTime, startWeight, startBodyFat }` |
| `ft_checkins` | `[{ datetime, weight, bodyFat, id, wb:{energy,hunger,clarity} }]` |
| `ft_history` | `[{ id, startTime, endTime, durationMs, startWeight, startBodyFat, finalWeight, finalFat, checkins }]` |
| `ft_journal` | `[{ fastId, day, datetime, mood, note }]` |
| `ft_struggles` | `[{ ts, category }]` |
| `ft_badges` | `[{ id, earnedAt, fastStart }]` |
| `ft_quote` | `{ text, author, ts }` |
| `ft_notif` | `{ enabled, checkinHour, milestones }` |
| `ft_lphase` | `number` |
| `ft_lbadge` | `number` |

---

## Design Tokens (identični v2)

```css
--bg: #08080f;
--surf: #0f0f1a;
--surf2: #141424;
--surf3: #1e1e30;
--border: #2a2a40;
--text1: #f0f0ff;
--text2: #a0a0c0;
--text3: #55556a;
--cyan: #00d4ff;
--purp: #a78bfa;
--ora: #ff7043;
--grn: #00ff88;
--red: #ff4757;
--gold: #ffd700;
--r: 14px;
--r: 14px;
```

---

## Fasting Phases (identičan v2)

| ID | Sati | Naziv | Boja |
|----|------|-------|------|
| 0 | 0–12h | Fuel Transition | `#55556a` |
| 1 | 12–24h | Ketosis Ignition | `#ffd740` |
| 2 | 24–48h | Deep Ketosis | `#ff7043` |
| 3 | 48–72h | Peak Autophagy | `#00d4ff` |
| 4 | 72–120h | Immune Regeneration | `#8b5cf6` |
| 5 | 120h+ | Deep Metabolic Reset | `#00e676` |

Bullets i motivacijski tekstovi: kopiraj iz `fasttrack2.html` (PHASES array).

---

## Moduli — odgovornosti

### `storage.js`
- `const K = { ... }` — sve localStorage ključeve
- `const ls = { get, set, del }` — wrapper
- `APP_VERSION`, `getProfile`, `fastState`, `checkins`, `fastHistory`, `getJournal`, itd.

### `phases.js`
- `const PHASES = [...]` — s bullets[], mot{}, color, icon
- `getPhase(hrs)`, `phaseProgress(hrs, phase)`
- `const STRUGGLING = { hunger: {...}, cravings: {...}, ... }` — 6 kategorija × 4 poruke

### `badges.js`
- `const BADGES = [...]` — 7 time-based badgeva
- `const LIFETIME_BADGES = [...]` — 9 lifetime badgeva
- `earnedBadges()`, `checkBadges(hrs)`, `checkLifetimeBadges()`
- `showBadgeToast(badge)`, `buildBadgeRack()`, `buildBadgeGrid()`

### `ui.js`
- `showTab(name)` — tab navigacija + nav pill (transform: translateX)
- `openModal(id)`, `closeModal(id)` — + backdrop click + Escape listener
- `toast(msg)` — toast notifikacije
- `fmtDate(dt, full)`, `fmtDur(ms)`, `fmtDurStr(ms)` — date/time helperi
- Sve inicijalizacije `addEventListener` (nema onclick u HTML-u)

### `fasting.js`
- `startFast(startTime, weight, bodyFat)` — inicijalizira ft_state
- `endFast(weight, bodyFat)` — sprema u ft_history, poziva checkLifetimeBadges
- `tick()` — timer update, phase update, progress bar, motivacija
- `startTimer()`, `buildActiveFast(state)`, `buildIdleScreen()`
- `buildTimeline(hrs)`, `buildRecentCheckin()`

### `checkin.js`
- `saveCheckin()` — s inline validacijom (crveni border + error tekst, ne toast)
- `renderCIHistory()`, `openEditModal(id)`, `deleteCheckin(id)`
- `wbSelect(type, val)` — wellbeing selector

### `report.js`
- `renderReport()`, `buildFullReport(d)`, `buildHistorySection()`
- `buildChart(cks)`, `buildWellbeingSparklines(cks)` — SVG
- `buildTrendChart(hist)`, `buildComparisonTable(hist)`
- `buildFastList(hist)` — s sort, PB markers, expandable
- `buildPersonalRecords()`

### `journal.js`
- `initJournal()`, `jMood(v)`, `saveJournalEntry()`, `renderJournal()`

### `struggling.js`
- `openStrugglingModal()`, `selectStrugglingCat(cat)`, `backToStrugglingStep1()`

### `main.js`
- Import svega
- `init()` — bootstrap, profile check, renderAll
- `renderAll()`, `renderHome()`, `renderData()`
- SW registracija

---

## Inline validacija (umjesto toast)

Primjer za check-in formu:
```js
// checkin.js
function validateCheckin() {
  let ok = true;
  const wtInput = document.getElementById('ci-wt');
  const wtErr   = document.getElementById('ci-wt-err');
  if (!wtInput.value) {
    wtInput.classList.add('input-error');
    wtErr.textContent = 'Weight is required';
    ok = false;
  } else {
    wtInput.classList.remove('input-error');
    wtErr.textContent = '';
  }
  return ok;
}
```
```css
.input-error { border-color: var(--red) !important; box-shadow: 0 0 0 2px rgba(255,71,87,.2); }
.field-err { color: var(--red); font-size: .72rem; margin-top: 3px; min-height: 16px; }
```
```html
<input type="number" id="ci-wt" ...>
<div class="field-err" id="ci-wt-err"></div>
```

---

## Aria-label pravilo

Svi emoji gumbi moraju imati `aria-label`:
```html
<!-- Wellbeing -->
<button class="wb-btn" data-v="1" aria-label="Energy level 1 - Exhausted">😴</button>
<button class="wb-btn" data-v="2" aria-label="Energy level 2 - Low">😩</button>
<!-- itd. -->

<!-- Mood u journalu -->
<button class="mood-btn" data-v="1" aria-label="Mood: Rough">😫</button>
```

---

## Backdrop + Escape za modalne

```js
// ui.js
function openModal(id) {
  const overlay = document.getElementById(id);
  overlay.classList.add('active');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(id);
  }, { once: true });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.active')
      .forEach(el => closeModal(el.id));
  }
});
```

---

## Nav Pill (transform, ne left/width)

```js
// ui.js
function moveNavPill(name) {
  const btn  = document.querySelector(`.nav-btn[data-tab="${name}"]`);
  const nav  = document.querySelector('.nav');
  const pill = document.getElementById('nav-pill');
  if (!btn || !pill || !nav) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  const x = btnRect.left - navRect.left;
  const w = btnRect.width;
  pill.style.transform = `translateX(${x}px) scaleX(${w / 100})`; // 100px = base width
  // Ili jednostavnije — samo translateX i fiksna širina per tab:
  pill.style.setProperty('--pill-x', x + 'px');
}
```
```css
.nav-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 25%; /* 4 taba = 25% svaki */
  height: 2px;
  background: var(--cyan);
  border-radius: 2px;
  transform: translateX(var(--pill-x, 0));
  transition: transform .3s cubic-bezier(.34,1.56,.64,1);
}
```

---

## Working rules za Claude

### Editiranje fajlova
- **Write tool:** za nove fajlove (index.html, sw.js, css/style.css, js/*.js)
- **Edit tool:** za kratke izmjene (<100 linija konteksta)
- **Python replace u bash:** za precizne izmjene u velikom fajlu (v2 metoda)

### JS syntax check (za module)
```bash
# Node može checkirati ES module sintaksu
node --input-type=module < js/main.js
# Ili
node --check --input-type=module js/fasting.js
```

### Tail check uvijek
```bash
tail -5 fasttrack3/js/main.js
```

### Git — uvijek PowerShell
```powershell
Set-Location "C:\Users\silvi\Desktop\Post\Post"
git add .; git commit -m "v3.X.Y — opis"; git push origin v2-fasttrack2
```

### Session start ritual
1. Pročitaj ovaj fajl (FASTTRACK3_PLAN.md)
2. Pročitaj CLAUDE.md
3. `ls fasttrack3/` da vidiš što je već napravljeno
4. Nastavi od gdje si stao

### Commit ritam
- Commitaj nakon svakog modula/featura
- Nikad ne čuvaj više od jednog modula uncommitano

---

## Redoslijed implementacije (preporučen)

1. `fasttrack3/index.html` — shell, linkovi na CSS i main.js
2. `fasttrack3/sw.js` — Service Worker
3. `fasttrack3/css/style.css` — svi stilovi iz v2 (kopiraj + cleanup)
4. `fasttrack3/js/storage.js` — K, ls, sve storage funkcije
5. `fasttrack3/js/phases.js` — PHASES, STRUGGLING data
6. `fasttrack3/js/badges.js` — BADGES, LIFETIME_BADGES, check funkcije
7. `fasttrack3/js/ui.js` — modali, toast, tab, nav pill, helperi
8. `fasttrack3/js/fasting.js` — timer, faze, buildActiveFast
9. `fasttrack3/js/checkin.js` — check-in forma s inline validacijom
10. `fasttrack3/js/journal.js` — journal
11. `fasttrack3/js/struggling.js` — struggling mode
12. `fasttrack3/js/report.js` — report + chartovi
13. `fasttrack3/js/notifications.js` — push notifikacije
14. `fasttrack3/js/gfit.js` — Google Fit (zadnje, kompleksno)
15. `fasttrack3/js/main.js` — sve imports, init(), renderAll()

---

## Korisne reference

- **v2 source:** `C:\Users\silvi\Desktop\Post\Post\fasttrack2.html` (2.6.1, 3085 linija)
- **Live v2:** `https://silviogajdosik-ops.github.io/fasttrack/fasttrack2.html`
- **Target v3:** `https://silviogajdosik-ops.github.io/fasttrack/fasttrack3/`
- **Lokalni server:** `start-fasttrack.bat` → `http://localhost:8080/`
