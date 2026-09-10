/**
 * Személyes rekordok (PR) felismerése — tiszta logika, DB nélkül.
 *
 * Háromféle rekordot ismerünk:
 *  - `weight`: minden idők legnehezebb szettje az adott gyakorlatban
 *  - `repMax`: az adott ismétlésszámhoz tartozó legnehezebb súly (pl. legjobb 5RM)
 *  - `e1rm`:   a legmagasabb becsült egyismétléses maximum (Epley)
 *
 * A rekordokat sosem tároljuk: a `PrContext`-et lekérdezésből építjük az adott
 * edzés dátuma ELŐTTI szettekből, így szerkesztés/törlés után sem avul el.
 */

import { epley1RM, isBetter, type SetLike } from './metrics';
import { countsForStrength } from './models';

export const PR_KINDS = ['weight', 'e1rm', 'repMax'] as const;
export type PrKind = (typeof PR_KINDS)[number];

export type PrContext = {
  /** Van-e egyáltalán korábbi szett. Ha nincs, az első alkalmat nem jelöljük rekordnak. */
  hasHistory: boolean;
  bestWeightKg: number | null;
  bestE1rm: number | null;
  /** ismétlésszám -> az addigi legnehezebb súly */
  bestWeightByReps: Record<number, number>;
};

export const EMPTY_PR_CONTEXT: PrContext = {
  hasHistory: false,
  bestWeightKg: null,
  bestE1rm: null,
  bestWeightByReps: {},
};

/**
 * Beszámít-e a szett a rekordokba. Kizárva: az üres szettek, a bemelegítő és a
 * drop-set lépcsők (utóbbi csak a volumenbe számít, hogy egy könnyű záró lépcső
 * ne csináljon fals ismétlésrekordot).
 */
function counts(set: SetLike): boolean {
  return countsForStrength(set.type ?? 'normal') && set.reps > 0 && set.weightKg > 0;
}

/**
 * Milyen rekordokat dönt meg a szett a megadott kontextusban.
 * Fontosság szerint rendezve — a UI a legerősebbet (az elsőt) mutatja.
 */
export function detectPrs(set: SetLike, context: PrContext): PrKind[] {
  if (!counts(set) || !context.hasHistory) return [];

  const prs: PrKind[] = [];
  if (isBetter(set.weightKg, context.bestWeightKg)) prs.push('weight');
  if (isBetter(epley1RM(set.weightKg, set.reps), context.bestE1rm)) prs.push('e1rm');
  if (isBetter(set.weightKg, context.bestWeightByReps[set.reps] ?? null)) prs.push('repMax');

  return prs;
}

/** A szettet beolvasztja a kontextusba (új, módosított másolatot ad vissza). */
export function extendPrContext(context: PrContext, set: SetLike): PrContext {
  if (!counts(set)) return context;

  const e1rm = epley1RM(set.weightKg, set.reps);
  const previousForReps = context.bestWeightByReps[set.reps] ?? null;

  return {
    hasHistory: true,
    bestWeightKg: isBetter(set.weightKg, context.bestWeightKg)
      ? set.weightKg
      : context.bestWeightKg,
    bestE1rm: isBetter(e1rm, context.bestE1rm) ? e1rm : context.bestE1rm,
    bestWeightByReps: isBetter(set.weightKg, previousForReps)
      ? { ...context.bestWeightByReps, [set.reps]: set.weightKg }
      : context.bestWeightByReps,
  };
}

export type WithPrs<T> = T & { prs: PrKind[] };

/**
 * Végigfut egy edzés szettjein sorrendben, és mindegyikhez megmondja, milyen
 * rekordot döntött. A kontextus szettről szettre nő, így egy edzésen belül
 * ugyanaz a teljesítmény csak egyszer számít rekordnak.
 */
export function annotateSetsWithPrs<T extends SetLike>(
  sets: readonly T[],
  context: PrContext
): WithPrs<T>[] {
  let running = context;
  const result: WithPrs<T>[] = [];

  for (const set of sets) {
    const prs = detectPrs(set, running);
    result.push({ ...set, prs });
    running = extendPrContext(running, set);
  }

  return result;
}

/** Egy edzés összes új rekordja (a befejezéskori összegzőhöz). */
export function countNewPrs(annotated: readonly WithPrs<unknown>[]): number {
  return annotated.filter((item) => item.prs.length > 0).length;
}
