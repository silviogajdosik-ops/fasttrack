<!-- READ: false — ARCHIVED. Ne čitati automatski. Ključne lekcije su prebačene u CLAUDE.md. -->
<!-- Konzultirati samo: (1) pri pokretanju potpuno novog projekta, (2) pri debuggiranju nepoznatog tipa greške. -->

# Lessons Learned — Claude + ES Module Web App

Praktična saznanja iz dugotrajnog projekta (D&D 3.5e Character Sheet, ~660 testova,
vanilla ES modules, no bundler). Sve je testirano u praksi, ne u teoriji.

---

## 1. KRITIČNO: Nikada ne koristi Edit/Write tool na velikim fajlovima

**Problem:** Claude-ov Edit/Write tool tiho truncira fajlove >100 linija.
Fajl izgleda ispravno, ali kraj nedostaje. App se ne učitava, greške su zbunjujuće.

**Rješenje:** Uvijek piši fajlove putem Pythona:

```python
python3 - << 'EOF'
path = "/apsolutna/putanja/do/fajla.js"
with open(path, 'r') as f:
    content = f.read()

old = "tekst koji mjenjamo"
new = "novi tekst"
assert old in content, f"Pattern not found!"
content = content.replace(old, new, 1)

with open(path, 'w') as f:
    f.write(content)
print("Done")
EOF
```

**Pravilo:** `assert old in content` sprečava tihe greške — ako se pattern ne nađe,
skript se ruši s jasnom greškom umjesto da napravi nešto krivo.

---

## 2. Validacija: `node --check` laže, koristiti dinamički import

**Problem:** `node --check file.js` prolazi čak i na trunciranim fajlovima koji imaju
importove — jer ne razrješava transitivne importove.

**Jedini ispravni način:**
```bash
node --input-type=module << 'EOF'
import('./tvoj-fajl.js').then(() => console.log('OK')).catch(e => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
EOF
```

Ili putem `validate.sh` skripte koja to radi za sve JS fajlove u projektu.

---

## 3. Backup strategija

**Redoslijed:**
1. Prije batch rada → backup:
   ```bash
   git add -A && git commit -m "vXXX_naziv pre-work"
   # ili ako git ne radi:
   python3 save_version.py "naziv_backupa"
   ```
2. Nakon završetka → commit:
   ```bash
   git add -A && git commit -m "vXXX done"
   ```

**Napomena o gitu u Cowork sesijama:** Git zna imati probleme s config fajlovima u
sandboxed sesijama (permission error na `.git/config`). Uvijek imaj `save_version.py`
kao fallback koji kopira cijeli projekt.

**`save_version.py` minimalni primjer:**
```python
import shutil, os, datetime

def save_version(label):
    src = "/putanja/do/projekta"
    dst = f"{src}/../versions/{label}_{datetime.date.today()}"
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns('versions', 'node_modules'))
    print(f"Saved: {dst}")
```

---

## 4. Token/context hygiene — izbjegavaj skupo čitanje

| Što **ne čitati** | Zašto |
|-------------------|-------|
| `versions/` folder | 10+ kopija projekta, MB podataka, write-only arhiva |
| `CHANGELOG.md` | Dugačka historija, čitaj samo kad trebaš razlog odluke |
| Cijele test suites kad tražiš jedan failing test | Koristi `grep "not ok"` |
| Cijeli fajl kad tražiš jedan pattern | Koristi `grep -n "pattern" file` |

**Princip:** Čitaj samo što trebaš sada. Svaki token koji potroširmo na čitanje
je token koji ne možemo koristiti za pisanje.

---

## 5. Session continuity protokol

Svaka nova sesija počinje s amnezijom. Riješi to strukturom:

**`CLAUDE.md`** (uvijek auto-učitan) — kratka referenca: arhitektura, konvencije, current state, next up.

**`bugovi.md`** (čita se na početku sesije) — otvoreni bugovi + WIP markeri.

**WIP marker format:**
```
## 🔧 IN PROGRESS: Opis zadatka
- Files: file1.js, file2.js
- Pristup: što smo planirali
- Status: gdje smo stali
```
Briši tek kad: validate clean + tests green.

**Pravilo pisanja odmah:** Svaki nalaz (bug, odluka, architectural note) pišeš u fajl
**odmah pri otkrivanju** — ne akumuliraj u kontekstu. Token limit prekida razgovor
bez upozorenja. Sljedeća sesija ne zna ništa osim što je zapisano.

---

## 6. Test-driven debugging

Kad dodaješ novi required field u contract test i test padne:
```bash
# Umjesto čitanja svakog fajla ručno:
node --input-type=module << 'EOF'
import { REGISTRY } from './rules/registry.js';
for (const [k, v] of Object.entries(REGISTRY)) {
  if (!v.display) console.log('MISSING:', k);
}
EOF
```
→ Odmah znaš koji su fajlovi problem, bez čitanja svega.

**Princip:** Napiši mali diagnostic script koji točno odgovara na pitanje "koji X ne zadovoljava Y".

---

## 7. Testovi moraju odgovarati stvarnoj strukturi stanja

**Česta greška u testovima:**
```js
// ❌ Krivo — pretpostavljamo da je cha na root-u
function mkState() { return { cha: 10, int: 10 }; }
// Test padne s "Cannot read property 'cha' of undefined"
```

**Ispravno — pogledaj kako engine zapravo čita stanje:**
```js
// Provjeri engine:
// effectiveAbility(state, key) → state.abilities[key]

// ✅ Ispravno
function mkState() {
  return {
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    activeEffects: [],
    classes: [],
    race: 'human',
  };
}
```

**Pravilo:** Prije pisanja testova, provjeri jednu liniju source koda koja čita
podatak koji testiraš.

---

## 8. Centralizacija helpera — jednom, svuda

**Anti-pattern koji nastaje organskim rastom:**
```js
// Isti helper kopiran u 11 fajlova, ali s različitim implementacijama:
// renderer.js:   .replace(/"/g, '&quot;')                    ← 1 char
// attacks.js:    .replace(/"/g, '&quot;').replace(/</g, '&lt;')  ← 2 chars
// equipment.js:  sve 4 zamjene                               ← ispravno
```

**Fix:** Jedan kanonski helper u shared utilities fajlu, importaj svuda.
Kad detektiraš kopiran helper, svi ga zamijeni odjednom — ne čekaj "sljedeću prigodu".

---

## 9. CSS promjene → bump SW cache BUILD string

Ako projekt koristi Service Worker s explicit asset listom:
```js
const BUILD = 'v20260530a'; // ← bump svaki put kad mjenjašCSS/JS
const CACHE = `app-${BUILD}`;
```
Bez bumpa: browser servira stari cached CSS bez obzira na promjene.

Isto vrijedi za dodavanje novih JS/CSS fajlova — moraju biti eksplicitno u ASSETS listi SW-a.

---

## 10. Debugging: provjeri truncation PRVO

Kad app prestane raditi nakon promjene, **prvo** provjeri truncaciju:
```bash
wc -l promijenjeni-fajl.js
# Usporedi s git: git diff --stat
# Ili: tail -20 promijenjeni-fajl.js  ← vidiš li kraj fajla?
```

U 80% slučajeva kad "nešto ne radi" nakon edita, uzrok je trunciran fajl.
Debuggiranje logike je uzalud dok fajl nije kompletan.

---

## 11. CDP / browser automation gotchas

Ako koristiš Claude in Chrome za live testiranje:

```js
// ❌ confirm() i alert() zamrzavaju CDP session
button.click(); // → otvori confirm() → session se zamrzne

// ✅ Bypass PRIJE klika
window.confirm = () => true;
window.alert = () => {};
button.click(); // sada radi
```

**ES module cache:** Preživljava browser reload. Nakon promjene JS-a:
1. Bump SW BUILD string
2. U DevTools → Application → Clear storage → Clear site data
3. Reload

---

## 12. Arhitekturalni principi koji su se pokazali ispravnima

**Registry pattern** (umjesto if/else po klasama):
```js
// Umjesto: if (className === 'wizard') { ... } else if ...
// Koristiti:
const CLASS_REGISTRY = {
  wizard: { hitDie: 4, babType: 'poor', display: 'Wizard', ... },
  fighter: { hitDie: 10, babType: 'good', display: 'Fighter', ... },
};
// Dodavanje nove klase = jedan novi unos, bez dodirivanja engine koda.
```

**Single source of truth za derived vrijednosti:**
Sve izvedene vrijednosti (modifiers, AC, save bonusi) računaju se u jednoj `deriveAll()`
funkciji. Nikad ne čuvaj izvedene vrijednosti u stanju — računaj ih uvijek iznova.

**Effect engine kao jedini izvor modifikatora:**
Buffs, magic items, race traits, feats — svi emituju normalizirane Effect objekte.
Kalkulacije pitaju effect engine, ne čitaju direktno iz pojedinih state polja.
Ovo eliminira klasu bugova gdje "zaboraviš" da neki item daje bonus.

---

## 13. Organizacija projekta za dugoročni razvoj

```
CLAUDE.md          ← kratka referenca (< 300 linija), UVIJEK auto-čita
bugovi.md          ← open bugs + WIP markeri, čita se na session start
CHANGELOG.md       ← historija, NE čitati automatski (preskup)
validate.sh        ← pokretaj nakon svake promjene
test.sh            ← pokretaj nakon svake promjene, mora biti zeleno
save_version.py    ← backup arhiva (write-only, nikad čitati natrag)
```

**CLAUDE.md struktura:**
- Architecture (fajlovi, data flow, konvencije)
- Working rules (pravila kojih se Claude mora držati)
- Current state (verzija, broj testova, što je COMPLETE)
- Next up (sljedeći zadaci po prioritetu)

---

## 14. Redoslijed implementacije za sigurnost

1. **Backup** (git commit ili save_version)
2. **Napiši u `bugovi.md`:** `🔧 IN PROGRESS: opis + fajlovi`
3. **Implementiraj** (uvijek Python `open()`, nikad Edit tool na >100L fajlovima)
4. **`validate.sh`** — mora biti clean
5. **`test.sh`** — mora biti zeleno
6. **Briši WIP marker** iz `bugovi.md`
7. **Update `CLAUDE.md`** current state
8. **Append `CHANGELOG.md`**
9. **Commit**: `git add -A && git commit -m "vXXX done"`

Nikad ne preskači korake. Posebno ne korake 4 i 5.

---

*Zadnja izmjena: 2026-05-30 | Projekt: D&D 3.5e Character Sheet v086*
