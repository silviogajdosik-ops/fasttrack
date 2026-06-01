# FastTrack PWA — Project Reference

> Drži kratko. Svaki token koji trošiš na čitanje je token koji ne možeš koristiti za pisanje.

---

## Project Overview
Single-file PWA fasting tracker. HTML + CSS + Vanilla JS, no bundler, no framework.
All data in `localStorage`. Dark mode, mobile-first, Service Worker offline support.

---

## File Structure
```
fasttrack.html           ← v1.0  (branch: master)
fasttrack-v1.1.html      ← v1.1  (branch: v1.1-profile-online-edittime)
fasttrack-v1.2.html      ← v1.2  (branch: v1.2-push-notifications)  ← AKTIVAN
CLAUDE.md                ← this file, always auto-loaded
CLAUDE_LESSONS_LEARNED.md ← ARCHIVED — do not auto-read, see note inside
```

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
- **Write tool (novi fajl):** ✅ radi, potvrđeno do 1373 linije
- **Edit tool (izmjena postojećeg, > ~500 linija):** ⚠️ rizik od tihog truncationa
- **Sigurno rješenje za edit velikih HTML fajlova:** piši Python skript u bash:
  ```python
  path = "/sessions/.../mnt/Post/fasttrack-vX.Y.html"
  with open(path, 'r') as f: content = f.read()
  old = "tekst koji mijenjamo"
  new = "novi tekst"
  assert old in content, f"Pattern not found!"
  content = content.replace(old, new, 1)
  with open(path, 'w') as f: f.write(content)
  print("Done:", len(content.splitlines()), "lines")
  ```
- Nakon bilo kojeg edita: `tail -5 fajl` da provjeriš kraj

### 2. Git — uvijek PowerShell, nikad bash sandbox
```powershell
# Bash sandbox ima permission greške na .git/config — potvrđeno!
# Svi git komandi idu kroz mcp__Windows-MCP__PowerShell:
Set-Location "C:\Users\silvi\Desktop\Post\Post"
git checkout -b vX.Y-opis
git add .; git commit -m "vX.Y.Z — opis"
```

### 3. Naming konvencija
- Verzije: `fasttrack-vX.Y.html`
- Git branch: `vX.Y-kratki-opis`
- Commit: `vX.Y.Z — opis promjena`

### 4. Service Worker cache
Kad mijenjamo CSS ili JS unutar HTML fajla, bumpa string u SW kodu:
```js
// Unutar inline SW blob (u svakom HTML fajlu):
const C = 'ft-v1.1'; // ← bumpa na ft-v1.2, ft-v1.3, itd.
```
Bez bumpa browser servira stari cached CSS.

### 5. Zapisuj odmah
Svaki arhitekturalni nalaz, bug, ili odluka — piši u CLAUDE.md odmah.
Token limit prekida razgovor bez upozorenja. Sljedeća sesija ne zna ništa.

---

## Current State

**Aktivna grana:** `v1.5-wellbeing-journal`
**Zadnji commit:** `v1.5.0 — Wellbeing journal (energy, hunger, mental clarity)`

### Što je implementirano (v1.5)
- ✅ Sve iz v1.4 +
- ✅ Wellbeing rating sekcija na check-in formu (3 grupe × 5 emoji-buttona)
- ✅ Energy (😴😩😐💪⚡), Hunger (🔥😫😐🙂😌), Mental Clarity (🌫️😵🤔💡🧠)
- ✅ wbSelect() + wbState objekt — tap-to-select s color highlight per kategorija
- ✅ saveCheckin() čuva `wb: { energy, hunger, clarity }` uz svaki check-in
- ✅ renderCIHistory() prikazuje wellbeing chips ispod svake unosa
- ✅ CSV export uključuje 3 wellbeing kolone
- ✅ Wellbeing je opcionalno — može se snimiti check-in bez ratinga

### Google Fit token fix (v1.5.1)
- `syncGoogleFitData()` sada koristi `isGFitConnected()` (uključuje expiry check)
- Ako token istekne → auto re-auth (`connectGoogleFit()`) umjesto samo poruke o grešci
- UI prikazuje kada token ističe (HH:MM, X min remaining) dok je konektovan

### Arhitektura badgea (v1.4)
- `ft_badges` — array `{ id, earnedAt, fastStart }` — lifetime, čuva sve fastove
- `ft_lbadge` — last checked hrs (za debounce)
- `thisFastBadgeIds()` — Set ID-eva zarađenih u tekućem fastu
- Badge rack pokazuje: earned this fast (boja) + next badge (dashed, countdown)

---

## Next Up (prioritet)

| Prioritet | Verzija | Feature |
|-----------|---------|---------|
| ~~🥇~~ | ~~v1.2~~ | ~~Push notifikacije~~ ✅ Done |
| ~~🥇~~ | ~~v1.3~~ | ~~Google Fit / Health Connect API~~ ✅ Done |
| ~~🥈~~ | ~~v1.4~~ | ~~Gamifikacija / badges~~ ✅ Done |
| 🥇 | v1.5 | Wellbeing dnevnik po check-inu (energija, glad, mentalna jasnoća 1–5) |
| 🥈 | v1.6 | Shareable infographic (Canvas → PNG za social/camera roll) |
| 🥉 | v2.0 | Multi-fast history, trend analiza kroz tjedne/mjesece |

---

## Brzi debugging checklist

1. App se ne učitava nakon edita → `tail -20 fajl.html` (truncation?)
2. CSS promjena nema efekta → bump SW cache string
3. Git greška → koristiti PowerShell, ne bash sandbox
4. LocalStorage problem → DevTools → Application → Local Storage → check keys
