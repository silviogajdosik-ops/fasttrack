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

**Aktivna grana:** `v1.1-profile-online-edittime`
**Zadnji commit:** `v1.1.0 — Editable profile, editable fast start time, online quotes`

### Što je implementirano (v1.1)
- ✅ Editable profil: ime, dob, spol, visina (setup + edit modal u Data tabu)
- ✅ Editable fast start time (datetime-local, podržava prošle datume)
- ✅ Realni timer D:H:M koji se ažurira svakih 10s
- ✅ Online citati: Quotable.io + ZenQuotes fallback, 6h cache
- ✅ Phase timeline s real-time highlighting i pulsing dot animacijom
- ✅ Motivacijski tekst po fazi s biološkim obrazloženjem
- ✅ End-of-fast report: weight delta, body fat delta, fat/lean breakdown, kcal burned
- ✅ SVG weight chart, CSV export, Reset
- ✅ PWA: inline blob SW, offline ready
- ✅ Git inicijaliziran, v1.0 na master, v1.1 na feature branch

---

## Next Up (prioritet)

| Prioritet | Verzija | Feature |
|-----------|---------|---------|
| 🥇 | v1.2 | Push notifikacije (morning check-in reminder, phase milestone alerts) |
| 🥇 | v1.3 | Google Fit / Health Connect API → auto-import Xiaomi Scale 2 podataka |
| 🥈 | v1.4 | Gamifikacija / badges (12h, 24h, 48h, 72h, 5d achievements) |
| 🥈 | v1.5 | Wellbeing dnevnik po check-inu (energija, glad, mentalna jasnoća 1–5) |
| 🥉 | v1.6 | Shareable infographic (Canvas → PNG za social/camera roll) |
| 🥉 | v2.0 | Multi-fast history, trend analiza kroz tjedne/mjesece |

---

## Brzi debugging checklist

1. App se ne učitava nakon edita → `tail -20 fajl.html` (truncation?)
2. CSS promjena nema efekta → bump SW cache string
3. Git greška → koristiti PowerShell, ne bash sandbox
4. LocalStorage problem → DevTools → Application → Local Storage → check keys
