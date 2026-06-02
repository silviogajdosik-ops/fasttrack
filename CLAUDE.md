# FastTrack PWA — Project Reference

> Drži kratko. Svaki token koji trošiš na čitanje je token koji ne možeš koristiti za pisanje.

---

## Project Overview
Single-file PWA fasting tracker. HTML + CSS + Vanilla JS, no bundler, no framework.
All data in `localStorage`. Dark mode, mobile-first, Service Worker offline support.

---

## File Structure
```
fasttrack.html           ← STARA APP — v1.9.0, završena, NE DIRAJ
fasttrack2.html          ← NOVA APP — v2-fasttrack2 branch, aktivni razvoj
start-fasttrack.bat      ← lokalni server launcher (http://localhost:8080/fasttrack.html)
FASTTRACK2_PLAN.md       ← 10 featura za fasttrack2, uvijek čitaj na startu sesije
CLAUDE.md                ← this file, always auto-loaded
CLAUDE_LESSONS_LEARNED.md ← ARCHIVED — do not auto-read
```

**Naming konvencija (od v1.5.3):** Fiksno ime `fasttrack.html` — git branches i tagovi čuvaju historiju verzija. Ne trebamo versioned fajlove više.

**Ne čitaj stare verzije** osim ako eksplicitno uspoređuješ. Koristi `grep` umjesto čitanja cijelog fajla.

---

## Data Model (localStorage)

| Key | Sadržaj |
|-----|---------|
| `ft_profile` | `{ name, age, gender, height }` |
| `ft_state` | `{ startTime, startWeight, startBodyFat }` — null kad nije aktivan post |
| `ft_checkins` | `[{ datetime, weight, bodyFat, id, wb:{energy,hunger,clarity} }, ...]` |
| `ft_done` | Last completed fast (backward compat) |
| `ft_history` | `[{ id, startTime, endTime, durationMs, startWeight, startBodyFat, finalWeight, finalFat, checkins }, ...]` — SVE završene sesije |
| `ft_quote` | `{ text, author, ts }` — online quote, cache 6h |
| `ft_notif` | `{ enabled, checkinHour, milestones }` — notification settings |
| `ft_lphase` | `number` — last notified phase ID |
| `ft_badges` | `[{ id, earnedAt, fastStart }]` — lifetime, čuva sve sesije |
| `ft_lbadge` | `number` — last checked hrs (za badge debounce) |

**Migracija:** `init()` automatski migrira stari `ft_done` u `ft_history[0]` (one-time, v2.0+).

---

## Fasting Phases (PHASES array)
| ID | Sati | Naziv |
|----|------|-------|
| 0 | 0–12h | Fuel Transition |
| 1 | 12–24h | Ketosis Ignition |
| 2 | 24–48h | Deep Ketosis |
| 3 | 48–72h | Peak Autophagy |
| 4 | 72–120h | Immune Regeneration |
| 5 | 120h+ | Deep Metabolic Reset |

---

## Working Rules

### 1. Pisanje/editiranje fajlova
- **Write tool (novi fajl / CLAUDE.md):** ✅ radi
- **Edit tool (izmjena postojećeg, > ~500 linija):** ⚠️ rizik od tihog truncationa
- **Sigurno rješenje za edit velikih HTML fajlova:** piši Python skript u bash:
  ```python
  path = "/sessions/.../mnt/Post/fasttrack.html"
  with open(path, 'r') as f: content = f.read()
  old = "tekst koji mijenjamo"
  new = "novi tekst"
  assert old in content, f"Pattern not found!"
  content = content.replace(old, new, 1)
  with open(path, 'w') as f: f.write(content)
  print("Done:", len(content.splitlines()), "lines")
  ```
- Nakon bilo kojeg edita: `tail -5 fajl` da provjeriš kraj
- JS syntax check: `python3 -c "import re; ..."` da izvučeš `<script>` blok, zatim `node --check /tmp/ft_check.js`

### 2. Git — uvijek PowerShell, nikad bash sandbox
```powershell
# Bash sandbox ima permission greške na .git/config — potvrđeno!
Set-Location "C:\Users\silvi\Desktop\Post\Post"
git add .; git commit -m "vX.Y.Z — opis"
git push origin v1.5-wellbeing-journal
```

### 3. Naming konvencija
- Git branch: `vX.Y-kratki-opis`
- Commit: `vX.Y.Z — opis promjena`

### 4. Service Worker cache
```js
const C = 'ft-v2.0'; // bumpa pri svakoj CSS/JS promjeni
```

### 5. Zapisuj odmah
Svaki arhitekturalni nalaz, bug, ili odluka — piši u CLAUDE.md odmah.
Token limit prekida razgovor bez upozorenja. Sljedeća sesija ne zna ništa.

---

## Current State

**Repo:** `https://github.com/silviogajdosik-ops/fasttrack.git`
**Live (stara):** `https://silviogajdosik-ops.github.io/fasttrack/fasttrack.html`
**Live (nova):** `https://silviogajdosik-ops.github.io/fasttrack/fasttrack2.html`
**Lokalni server:** `start-fasttrack.bat` → `http://localhost:8080/fasttrack.html`

### fasttrack.html (stara app)
**Grana:** `v1.5-wellbeing-journal` (finished, do not touch)
**Zadnji commit:** `v2.0.0 — Multi-fast history`

### fasttrack2.html (aktivna app)
**Grana:** `v2-fasttrack2`
**Zadnji commit:** `v2.6.0-ft2 — F9/F4/F10`
**Zadnji commit (F6):** `v2.6.0-ft2 — History dashboard improvements`
**SW cache:** `ft2-v2.1`
**APP_VERSION:** `v2.1.0-ft2` (bump needed)

---

## Verzijska historija

| Verzija | Feature |
|---------|---------|
| v1.0 | Osnovna PWA — timer, faze, check-in, end-fast report |
| v1.1 | Push notifikacije (Service Worker) |
| v1.2 | Google Fit / Health Connect API integracija |
| v1.3 | Badges / gamifikacija — 7 achievementa |
| v1.4 | Badge rack u aktivnom fastu, grid u Data tabu |
| v1.5.0 | Wellbeing journal — Energy/Hunger/Clarity (1–5 emoji) na check-in, history chips, CSV kolone |
| v1.5.1 | GFit token auto re-auth (isGFitConnected + expiry check) |
| v1.5.2 | Fix JS syntax bug (apostrophe u motivational strings) |
| v1.5.3 | Rename na `fasttrack.html` (fiksno ime) |
| v1.6.0 | Shareable infographic — Ca
| v1.6.0 | Shareable infographic — Canvas 1080×1080 PNG |
| v1.6.1–1.6.6 | GFit fixes, check-in CRUD, modal rekurzija fix |
| v2.0.0 | Multi-fast history: ft_history array, stats, trend chart |
| v2.1.0-ft2 | fasttrack2: Feature 7 Homepage redesign |
| v2.2.0-ft2 | fasttrack2: Feature 8 Phase cards (bullets) |
| v2.3.0-ft2 | fasttrack2: Feature 2 Struggling Mode |
| v2.4.0-ft2 | fasttrack2: Feature 3 Fast Journal |

---

## fasttrack2 — Next Up

| Status | Feature |
|--------|---------|
| ✅ done | F7, F8, F2, F3, F5, F9, F4, F10, F6 — SVE IMPLEMENTIRANO |

## Brzi debugging checklist

1. App se ne učitava → `tail -20 fasttrack2.html` (truncation?)
2. CSS nema efekta → bump SW cache `const C='ft2-vX.X'`
3. Git greška → koristiti PowerShell, ne bash sandbox
4. JS error → `node --check /tmp/ft2_check.js`
5. Modal se ne otvara → provjeri rekurziju u `openModal`/`open*Modal`
