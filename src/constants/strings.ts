import type {
  Equipment,
  MuscleGroup,
  ProgressMetric,
  ProgressRange,
  SetType,
} from '@/domain/models';
import type { PrKind } from '@/domain/pr';

/** Minden felhasználónak megjelenő szöveg egy helyen (később i18n-esíthető). */

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  mell: 'Mell',
  hat: 'Hát',
  lab: 'Láb',
  vall: 'Váll',
  kar: 'Kar',
  has: 'Has',
  egyeb: 'Egyéb',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  rud: 'Rúd',
  kezisulyzo: 'Kézisúlyzó',
  gep: 'Gép',
  kabel: 'Kábel',
  sajat_testsuly: 'Saját testsúly',
  egyeb: 'Egyéb',
};

export const METRIC_LABELS: Record<ProgressMetric, string> = {
  maxWeight: 'Max. súly',
  volume: 'Volumen',
  est1rm: 'Becsült 1RM',
};

export const PR_LABELS: Record<PrKind, string> = {
  weight: 'Rekordsúly',
  e1rm: 'Rekord 1RM',
  repMax: 'Ismétlés-rekord',
};

/** Teljes név a szett-típus választóban. */
export const SET_TYPE_LABELS: Record<SetType, string> = {
  normal: 'Normál szett',
  warmup: 'Bemelegítő',
  one_rep_max: '1RM kísérlet',
  to_failure: 'Bukásig (AMRAP)',
  drop: 'Drop set',
};

/** Rövid jelölés a szettsor mellett. `normal` = nincs jelölés. */
export const SET_TYPE_SHORT: Record<SetType, string> = {
  normal: '',
  warmup: 'BEMEL.',
  one_rep_max: '1RM',
  to_failure: 'AMRAP',
  drop: 'DROP',
};

export function rangeLabel(range: ProgressRange): string {
  if (range === null) return 'Összes';
  if (range === 90) return '3 hó';
  if (range === 180) return '6 hó';
  return '1 év';
}

export const T = {
  tabs: {
    workouts: 'Edzések',
    exercises: 'Gyakorlatok',
    progress: 'Progressz',
    templates: 'Sablonok',
  },
  common: {
    save: 'Mentés',
    cancel: 'Mégse',
    delete: 'Törlés',
    edit: 'Szerkesztés',
    add: 'Hozzáadás',
    done: 'Kész',
    search: 'Keresés',
    all: 'Összes',
    loading: 'Betöltés…',
    error: 'Hiba történt',
    retry: 'Újra',
  },
  workouts: {
    title: 'Edzések',
    newWorkout: 'Új edzés',
    continueWorkout: 'Folyamatban lévő edzés',
    continue: 'Folytatás',
    emptyTitle: 'Még nincs rögzített edzés',
    emptyBody: 'Kezdj egy új edzést, és rögzítsd az első szettedet.',
    finish: 'Edzés befejezése',
    addExercise: 'Gyakorlat hozzáadása',
    addSet: 'Szett hozzáadása',
    deleteWorkout: 'Edzés törlése',
    deleteConfirm: 'Biztosan törlöd ezt az edzést? A szettek is elvesznek.',
    exerciseCount: (count: number) => `${count} gyakorlat`,
    setCount: (count: number) => `${count} szett`,
    inProgress: 'Folyamatban',
    titlePlaceholder: 'Edzés neve (pl. Push nap)',
    notesPlaceholder: 'Megjegyzés',
    lastTime: 'Előző alkalommal',
    noSets: 'Még nincs szett',
    setsHeader: { index: '#', reps: 'Ism.', weight: 'Súly (kg)' },
    warmup: 'Bemelegítő',
    finishedTitle: 'Edzés befejezve',
    newPrs: (count: number) =>
      count === 1 ? '1 új személyes rekord!' : `${count} új személyes rekord!`,
    noPrs: 'Ezúttal nem született rekord — a következő edzésen!',
    emptyWorkoutWarning: 'Az edzésben nincs egyetlen szett sem. Így is befejezed?',
    addDropSet: 'Drop set',
    setType: 'Szett típusa',
    saveAsTemplate: 'Mentés sablonként',
    updateTemplate: 'Sablon frissítése',
    templateNamePrompt: 'A sablon neve',
    templateSaved: 'Sablon elmentve',
    templateUpdated: 'A sablon frissítve',
    startedFromTemplate: (name: string) => `Sablonból indítva: ${name}`,
  },
  exercises: {
    title: 'Gyakorlatok',
    newExercise: 'Új gyakorlat',
    editExercise: 'Gyakorlat szerkesztése',
    namePlaceholder: 'Gyakorlat neve',
    muscleGroup: 'Izomcsoport',
    equipment: 'Eszköz',
    notesPlaceholder: 'Megjegyzés (opcionális)',
    emptyTitle: 'Nincs találat',
    emptyBody: 'Próbálj más keresőszót, vagy vegyél fel új gyakorlatot.',
    archive: 'Archiválás',
    unarchive: 'Visszaállítás',
    archived: 'Archivált',
    showArchived: 'Archiváltak mutatása',
    nameRequired: 'A gyakorlat nevét kötelező megadni.',
    nameTaken: 'Már létezik ilyen nevű gyakorlat.',
    archiveInfo: 'Az archivált gyakorlat nem választható új edzéshez, de a régi edzések megmaradnak.',
    usedInWorkouts: (count: number) => `${count} edzésben szerepel`,
    neverUsed: 'Még nem szerepelt edzésben',
  },
  progress: {
    title: 'Progressz',
    selectExercise: 'Válassz gyakorlatot',
    changeExercise: 'Gyakorlat váltása',
    emptyTitle: 'Nincs elég adat',
    emptyBody: 'Rögzíts legalább két edzést ezzel a gyakorlattal, és megjelenik a görbe.',
    noExerciseTitle: 'Válassz egy gyakorlatot',
    noExerciseBody: 'Így megnézheted, hogyan alakult a teljesítményed az idők során.',
    bests: 'Csúcsok',
    bestWeight: 'Legnehezebb szett',
    bestE1rm: 'Legjobb becsült 1RM',
    bestVolume: 'Legnagyobb volumen',
    lastSession: 'Utolsó edzés',
    sessions: (count: number) => `${count} edzés`,
  },
  settings: {
    title: 'Beállítások',
    data: 'Adatok',
    schemaVersion: 'Séma verzió',
    exerciseCount: 'Gyakorlatok',
    workoutCount: 'Edzések',
    setCount: 'Szettek',
  },
  templates: {
    title: 'Sablonok',
    emptyTitle: 'Még nincs sablon',
    emptyBody:
      'Egy edzés képernyőjén koppints a „Mentés sablonként" gombra, és a váz ide kerül.',
    start: 'Edzés indítása',
    rename: 'Átnevezés',
    delete: 'Sablon törlése',
    deleteConfirm: 'Biztosan törlöd ezt a sablont? A belőle indított edzések megmaradnak.',
    renamePrompt: 'A sablon új neve',
    lastUsed: (date: string) => `Utoljára: ${date}`,
    neverUsed: 'Még nem használt',
    chooseTitle: 'Új edzés',
    chooseEmpty: 'Üres edzés',
    chooseFromTemplate: 'Sablonból:',
  },
  dropSet: {
    title: 'Drop set',
    startKg: 'Kezdő súly (kg)',
    endKg: 'Záró súly (kg)',
    stepKg: 'Lépés (kg)',
    reps: 'Ismétlés / lépcső',
    preview: 'Lépcsők',
    add: 'Drop set hozzáadása',
    invalid: 'Add meg a kezdő és záró súlyt, a lépést és az ismétlést. A kezdő súly legyen nagyobb.',
    tooMany: 'Túl sok lépcső jönne ki — növeld a lépést vagy szűkítsd a tartományt.',
  },
} as const;
