# FastTrack2 — Implementation Plan

> Nastavljamo u novom chatu. Pročitaj ovo prije svega ostalog.

---

## Setup za novi chat

**Polazna točka:** `fasttrack.html` (v1.9.0) → kopiramo u `fasttrack2.html`
**Nova grana:** `v2-fasttrack2`
**Live URL cilj:** `https://silviogajdosik-ops.github.io/fasttrack/fasttrack2.html`

### Korak 0 — Priprema (radi odmah na početku sessiona)
```powershell
Set-Location "C:\Users\silvi\Desktop\Post\Post"
git checkout -b v2-fasttrack2
Copy-Item fasttrack.html fasttrack2.html
git add .; git commit -m "v2.0.0-ft2 — init: kopia fasttrack.html v1.9.0 kao baza"
```

---

## Produkt filozofija

FastTrack2 = **fasting companion**, ne tracker.
Korisnik treba osjećati: progres, achievement, anticipation, support.
**Motivacija > Podaci** uvijek.

---

## 10 Featura — Prioritizovano

### FEATURE 1 — Phase Progress System ⭐ (visoka prioritet, Home screen)
**Što:** Vizualni progress bar za:
1. Ukupni fast progress (od starta do sada)
2. Trenutna faza — koliko % faze je prošlo
3. Countdown do sljedeće faze/milestone

**UI primjer:**
```
72h elapsed
🧬 Peak Autophagy
████████░░░░░░░░  60%
⏱ Next: Immune Regeneration in 23h 14m
```

**Implementacija:**
- Izračun: `(elapsedInPhase / phaseDuration) * 100`
- CSS animiran progress bar (keyframe pulse na leading edge)
- Smjesti u `buildActiveFast()` ispod timera
- Animacija: `animation: shimmer 2s infinite`

---

### FEATURE 2 — Struggling Mode ⭐⭐ (kritično za adherence)
**Što:** Emergency button `⚠️ I'm Struggling` na Home screenu dok je fast aktivan.

**Kategorije + primjeri poruka:**

| Kategorija | Poruka (od više randomizovanih) |
|------------|--------------------------------|
| Hunger | "Most hunger waves last 15–20 min. You're transitioning fuel systems. Drink 500ml water, walk 10 min, reassess." |
| Cravings | "Cravings peak and pass. Your brain is running on ketones now — the craving is neurological noise, not real need." |
| Low Energy | "Hour 24–36 is the energy valley. ATP production is shifting. This dip is temporary and followed by clarity." |
| Boredom | "You're not hungry. You're bored. Go do something with your hands for 20 minutes." |
| Social Pressure | "Food is social currency. You can decline gracefully. 'I'm not hungry right now' is complete and true." |
| Thinking About Quitting | "The version of you who started this fast knew something. That version was right." |

**Implementacija:**
- Novi modal `struggling-modal`
- Korak 1: grid 6 buttona (kategorije)
- Korak 2: randomizovana poruka za odabranu kategoriju + progress reinforcement ("You've already made it X hours!")
- Svaka kategorija: min 4 poruke u arrayu, `Math.random()`
- localStorage: bilježi koliko puta `ft_struggles` — za future analytics

---

### FEATURE 3 — Fast Journal ⭐ (daily notes)
**Što:** Po danu fasta korisnik može unijeti:
- Kratak tekst (notes/observations)
- Mood emoji (5 opcija)

**Data model:**
```js
// ft_journal: [{ fastId, day, datetime, mood, note }, ...]
// day = Math.floor(elapsedHours / 24) + 1
```

**UI:** Tab ili sekcija ispod Check-in forme. Searchable u Report tabu.

---

### FEATURE 4 — Personal Records
**Što:** All-time rekorde prikazati u Report tabu.

| Record | Izračun |
|--------|---------|
| Longest Fast | `Math.max(...ft_history.map(f => f.durationMs))` |
| Best Weight Loss | `Math.max(...ft_history.map(f => f.startWeight - f.finalWeight))` |
| Most Check-ins | `Math.max(...ft_history.map(f => f.checkins.length))` |
| Most Journal Entries | count po fastu |

**UI:** Card u Report tabu, trophy ikone.

---

### FEATURE 5 — Advanced Gamification
**Dodati badge kategorije (uz postojeće):**

| Badge | Trigger |
|-------|---------|
| Trilogy | 3 completed fasts |
| High Five | 5 completed fasts |
| Decade | 10 completed fasts |
| Consistent | 7 check-ins ukupno |
| Dedicated | 14 check-ins ukupno |
| Committed | 30 check-ins ukupno |
| Torch | 2kg cumulative fat lost |
| Inferno | 5kg cumulative fat lost |
| Furnace | 10kg cumulative fat lost |

**Unlock animacija:** CSS keyframe pop+glow na badge elementu.

---

### FEATURE 6 — Fast History Dashboard (već djelomično u v1.9.0)
**Poboljšanja:**
- Sortiranje: po datumu / trajanju / weight lost
- Personal best markers (🏆 ikona na rekordu)
- Expandable detalji po fastu

---

### FEATURE 7 — Companion Homepage Redesign
**Nova hijerarhija (odozgo prema dolje):**
1. Active Timer (veliko, prominentno)
2. Current Phase (ime + ikona)
3. Progress Bars (Feature 1)
4. Next Milestone countdown
5. Motivation Card (rotating quote/science fact)
6. Badge Progress (sljedeći badge + progress)
7. Recent Check-in summary
8. ⚠️ Struggling button (bottom, prominent)

**Princip:** Expandable "Learn More" za detalje faze umjesto dugog teksta.

---

### FEATURE 8 — Phase Cards Rework
**Trenutni problem:** Opisi faza su predugački.

**Nova struktura po fazi:**
```
🧬 Peak Autophagy
• Cellular recycling at peak
• mTOR suppressed
• Growth hormone elevated
[Learn More ▼]  ← expand/collapse
```

**Implementacija:** `<details>/<summary>` HTML element ili JS toggle.

---

### FEATURE 9 — Data Insights (Wellbeing Trends)
**Što:** Energy/Hunger/Clarity trendovi kroz check-ine.

**UI:** Mini sparkline grafovi (SVG, isti pristup kao buildChart).
- 3 sparkline linije (energy: žuta, hunger: crvena, clarity: plava)
- Prikazati u Report tabu ili novoj "Insights" sekciji

---

### FEATURE 10 — Code Organization
**Sekcijski komentari u kodu (dodati bez refactora):**
```js
// ── STORAGE ─────────────────────────────────────────────────────────
// ── UI HELPERS ──────────────────────────────────────────────────────
// ── FASTING ENGINE ──────────────────────────────────────────────────
// ── REPORTS ─────────────────────────────────────────────────────────
// ── BADGES ──────────────────────────────────────────────────────────
// ── JOURNAL ─────────────────────────────────────────────────────────
// ── NOTIFICATIONS ───────────────────────────────────────────────────
// ── GOOGLE FIT ──────────────────────────────────────────────────────
```

---

## localStorage Changes

| Key | Promjena |
|-----|---------|
| `ft_struggles` | NOVO — `[{ ts, category }]` — tracking struggling events |
| `ft_journal` | NOVO — `[{ fastId, day, datetime, mood, note }]` |
| Sve ostalo | Bez promjene (backward compat) |

---

## Design Tokens (zadržati)
```css
--bg: #08080f       /* pozadina */
--cyan: #00d4ff     /* primarni akcent */
--purple: #a78bfa   /* sekundarni akcent */
--grn: #00ff88      /* success */
--red: #ff4757      /* danger/alert */
--gold: #ffd700     /* badges */
```

---

## Redoslijed implementacije (preporučen)

1. Feature 7 (Homepage redesign) — struktura za sve ostalo
2. Feature 1 (Phase progress) — odmah vidljiv impact
3. Feature 8 (Phase cards rework) — čistoća
4. Feature 2 (Struggling mode) — ⭐ najvažnija za adherence
5. Feature 3 (Journal) — nova data
6. Feature 5 (Advanced badges) — gamification boost
7. Feature 9 (Insights sparklines) — visualizacija
8. Feature 4 (Personal records) — report sekcija
9. Feature 6 (History dashboard improvements) — polishing
10. Feature 10 (Code organization) — zadnje, ne mijenja funkciju

---

## Potencijalni rizici

- **Homepage restructure** može razbiti `renderHome()` — testirati u koracima
- **Journal day calculation** mora biti konzistentan s `fastState().startTime`
- **Badge unlock** — cumulative fat loss traži iteraciju kroz `ft_history` (može biti sporo s puno podataka — no OK za single-user app)
- **CSS animacije** — testirati na slabijim mobilnim uređajima

---

## Working rules (podsjetnik iz CLAUDE.md)
- Edit velikih HTML fajlova: Python replace script u bash (ne Edit tool)
- Nakon edita: `tail -5 fasttrack2.html` + `node --check /tmp/ft_check.js`
- Git: uvijek PowerShell (`mcp__Windows-MCP__PowerShell`)
- SW cache: bumpa `const C = 'ft2-v2.0'` pri CSS/JS promjenama
