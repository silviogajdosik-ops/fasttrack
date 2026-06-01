# FastTrack PWA — Project Reference

> Drži kratko. Svaki token koji trošiš na čitanje je token koji ne možeš koristiti za pisanje.

---

## Project Overview
Single-file PWA fasting tracker. HTML + CSS + Vanilla JS, no bundler, no framework.
All data in `localStorage`. Dark mode, mobile-first, Service Worker offline support.

---

## File Structure
```
fasttrack.html           ← AKTIVAN (uvijek najnovija verzija, currently v1.6.6)
start-fasttrack.bat      ← lokalni server launcher (http://localhost:8080/fasttrack.html)
CLAUDE.md                ← this file, always auto-loaded
CLAUDE_LESSONS_LEARNED.md ← ARCHIVED — do not auto-read, see note inside
```

**Naming konvencija (od v1.5.3):** Fiksno ime `fasttrack.html` — git branches i tagovi čuvaju historiju verzija. Ne trebamo versioned fajlove više. `fasttrack-v*.html` fajlovi su legacy, možemo ih brisati.

**Ne čitaj stare verzije** osim ako eksplicitno uspoređuješ. Koristi `grep` umjesto čitanja cijelog fajla.

---

## Data Model (localStorage)

| Key | Sadržaj |
|-----|---------|
| `ft_profile` | `{ name, age, gender, height }` |
| `ft_state` | `{ startTime, startWeight, startBodyFat }` — null kad nije aktivan post |
| `ft_checkins` | `[{ datetime, weight, bodyFat, id }, ...]` |
| `ft_done` | Completed fast data + checkins snapshot |
| `ft_quote` | `{ text, author, ts }` — online quote, cache 6h |
| `ft_notif` | `{ enabled, checkinHour, milestones }` — notification settings |
| `ft_lphase` | `number` — last notified phase ID (za milestone detection) |
| `ft_badges` | `[{ id, earnedAt, fastStart }]` — lifetime, čuva sve fastove |
| `ft_lbadge` | `number` — last checked hrs (za badge debounce) |

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
- **Write tool (novi fajl):** ✅ radi
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
- **CLAUDE.md editovanje:** koristiti Write tool (ne Edit, ne Python replace) — kraći fajl, Write je siguran

### 2. Git — uvijek PowerShell, nikad bash sandbox
```powershell
# Bash sandbox ima permission greške na .git/config — potvrđeno!
# Svi git komandi idu kroz mcp__Windows-MCP__PowerShell:
Set-Location "C:\Users\silvi\Desktop\Post\Post"
git checkout -b vX.Y-opis
git add .; git commit -m "vX.Y.Z — opis"
git push origin v1.5-wellbeing-journal
```

### 3. Naming konvencija
- Git branch: `vX.Y-kratki-opis`
- Commit: `vX.Y.Z — opis promjena`

### 4. Service Worker cache
Kad mijenjamo CSS ili JS unutar HTML fajla, bumpa string u SW kodu:
```js
const C = 'ft-v1.1'; // ← bumpa na ft-v1.2, ft-v1.3, itd.
```
Bez bumpa browser servira stari cached CSS.

### 5. Zapisuj odmah
Svaki arhitekturalni nalaz, bug, ili odluka — piši u CLAUDE.md odmah.
Token limit prekida razgovor bez upozorenja. Sljedeća sesija ne zna ništa.

---

## Current State

**Repo:** `https://github.com/silviogajdosik-ops/fasttrack.git`
**Live:** `https://silviogajdosik-ops.github.io/fasttrack/fasttrack.html`
**Lokalni server:** `start-fasttrack.bat` → `http://localhost:8080/fasttrack.html`
**Aktivna grana:** `v1.5-wellbeing-journal`
**Zadnji commit:** `v1.6.6 — fix profile modal infinite recursion (name btn + Edit btn)`

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
| v1.6.0 | Shareable infographic — Canvas 1080×1080 PNG, Download + Web Share API |
| v1.6.1 | Version broj u headeru + Data tabu; nav overlap fix (margin-bottom 80px) |
| v1.6.2 | GFit: fleksibilan import (weight bez fat), ±1h dedup, conflict resolution modal, dijagnostički toast |
| v1.6.3 | Check-in CRUD: ✏️ edit, 🗑️ delete, ＋ Add Entry; GFit 🔍 debug modal (stvarni dataSourceId-evi) |
| v1.6.4 | GFit: UTC→local datum fix (getDate() umjesto toISOString()) |
| v1.6.5 | GFit: stvarni timestamp mjerenja iz `pt.startTimeNanos` umjesto bucket ponoći |
| v1.6.6 | Fix: `openProfileModal()` pozivao `openModal()` rekurzivno → stack overflow → 👤 name btn i ✏️ Edit btn nisu radili |

---

## Napomene o integracijama

### Google Fit / Zepp Life (potvrđeno)
- Zepp Life **ne šalje body fat** prema Google Fit API-ju — samo tjelesna težina
- Body fat se mora unositi ručno (✏️ edit) ili kroz Zepp Life CSV export
- Google OAuth: Authorized JS origins mora sadržavati `https://silviogajdosik-ops.github.io`
- GitHub Pages: svaki `git push` origin deploya automatski (~1 min)

### Badge arhitektura
- `ft_badges` — array `{ id, earnedAt, fastStart }` — lifetime, čuva sve fastove
- `ft_lbadge` — last checked hrs (za debounce)
- `thisFastBadgeIds()` — Set ID-eva zarađenih u tekućem fastu
- Badge rack pokazuje: earned this fast (boja) + next badge (dashed, countdown)

---

## Next Up

| Prioritet | Verzija | Feature |
|-----------|---------|---------|
| 🥇 | v2.0 | Multi-fast history, trend analiza kroz tjedne/mjesece |

---

## Brzi debugging checklist

1. App se ne učitava nakon edita → `tail -20 fasttrack.html` (truncation?)
2. CSS promjena nema efekta → bump SW cache string (`const C = 'ft-vX.X'`)
3. Git greška → koristiti PowerShell, ne bash sandbox
4. LocalStorage problem → DevTools → Application → Local Storage → check keys
5. Modal se ne otvara → provjeri rekurziju u `openModal` / `open*Modal` funkcijama
