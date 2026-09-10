# PhysiqueApp — erősítő edzésnapló

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Architektúra

Helyi (offline) edzésnapló, Expo SDK 57 + TypeScript, iOS-re, Expo Go-ban futtatva.
Nincs backend és nincs bejelentkezés — minden adat SQLite-ban, a készüléken.

Rétegek, kívülről befelé:

| Réteg | Hely | Szabály |
|---|---|---|
| Útvonalak | `src/app/**` | Csak képernyő-összeállítás. Üzleti logika nem kerül ide. |
| Komponensek | `src/components/**` | `ui/` általános, a többi mappa funkció szerinti. |
| Hookok | `src/hooks/**` | react-query lekérdezések és mutációk; a képernyők ezeket hívják. |
| Repository | `src/repositories/**` | **Az egyetlen hely, ahol SQL van.** Nyers sort → domain modellre képez. |
| Domain | `src/domain/**` | Tiszta TS: modellek, metrikák, PR-logika. Nincs DB- és React-függés → unit-tesztelt. |
| DB | `src/db/**` | Séma, `PRAGMA user_version` alapú migrációk, nyers sor-típusok. |

Fontos döntések:

- **A PR-eket nem tároljuk.** Lekérdezésből származtatjuk (`repositories/stats.ts` +
  `domain/pr.ts`), így edzés szerkesztése vagy törlése után sem avulhat el. A kontextus
  mindig az adott edzés *előtti* állapot, ezért visszamenőleg rögzített edzés nem kap
  rekordot a nála későbbi teljesítmények miatt.
- **Élő mentés.** Az edzés indításakor létrejön egy `in_progress` sor, és minden szett
  azonnal az adatbázisba íródik. Nincs elveszíthető piszkozat.
- **Szett-típusok** (`sets.type`): `normal | warmup | one_rep_max | to_failure | drop`.
  A volumenbe minden `!= 'warmup'` beszámít; a max. súly / becsült 1RM / PR-ek csak a
  `normal | one_rep_max | to_failure` típusokat (`countsForStrength`). A drop set külön
  `sets` sorokból áll, közös `group_id`-vel, egymást követő `set_index`-szel — így a
  meglévő sorrendezés/újraszámozás változatlan; egy lépcső törlése az egész csoportot viszi.
- **Sablonok** (`templates` / `template_exercises` / `template_sets`): a `workouts` táblák
  tükre. „Mentés sablonként" és „Sablon frissítése" egy edzésből másol; „Sablonból indítás"
  a cél-ismétléssel/súllyal új `in_progress` edzést hoz létre (`workouts.template_id` beáll).
  Nincs külön sablon-szerkesztő — a sablon egy edzésből jön létre és frissül.
- **Gyakorlatoknál soft delete** (`is_archived`), hogy a régi edzések ne csonkuljanak.
  A `workout_exercises.exercise_id` `ON DELETE RESTRICT`, minden más kaszkádol.
- **Súly mindig kg-ban, `REAL`-ként.** Időbélyeg UTC ISO (rendezhető), a naptári nap
  külön `day` oszlopban, helyi idő szerint (`YYYY-MM-DD`).
- **Minden felhasználói szöveg** a `src/constants/strings.ts` fájlban van.
- **Expo Go-kompatibilitás kötelező**: nem használunk olyan natív modult, ami nincs benne
  az Expo Go-ban (pl. `react-native-skia`). A grafikon ezért `react-native-gifted-charts`
  (react-native-svg alapú).

## Parancsok

```bash
npm start          # Expo dev szerver (QR-kód -> Expo Go)
npm test           # jest: a domain réteg tiszta függvényei
npm run typecheck  # tsc --noEmit
```

Séma módosítása: új fájl `src/db/migrations/`-ba, felvenni a `MIGRATIONS` tömbbe
`src/db/migrations/index.ts`-ben. A meglévő migrációkat sosem írjuk át. Aktuális
séma verzió: **4** (`001_init`, `002_seed_exercises`, `003_set_types`, `004_templates`).

Új útvonal hozzáadása után a `.expo/types/router.d.ts` csak `npx expo start` futtatásakor
generálódik újra (az `expo export` nem frissíti) — addig a `tsc` panaszkodhat az új route-ra.
