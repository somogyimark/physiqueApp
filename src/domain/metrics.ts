/**
 * Tiszta számítások szettek fölött — nincs DB- vagy React-függés, így unit-tesztelhető.
 */

import { countsForStrength, countsForVolume, type SetType } from './models';

/** Lebegőpontos súlyok (pl. 62.5) összehasonlításához. */
export const EPSILON = 1e-6;

export type SetLike = {
  reps: number;
  weightKg: number;
  /** Hiányzó típus = `normal` (a régi hívók és tesztek kedvéért). */
  type?: SetType;
};

function typeOf(set: SetLike): SetType {
  return set.type ?? 'normal';
}

function isValid(set: SetLike): boolean {
  return set.reps > 0 && set.weightKg > 0;
}

/** A volumenbe beszámító szettek (minden érvényes, nem bemelegítő szett). */
export function volumeSets<T extends SetLike>(sets: readonly T[]): T[] {
  return sets.filter((set) => isValid(set) && countsForVolume(typeOf(set)));
}

/** A max. súly / becsült 1RM / PR-ek szempontjából beszámító szettek. */
export function strengthSets<T extends SetLike>(sets: readonly T[]): T[] {
  return sets.filter((set) => isValid(set) && countsForStrength(typeOf(set)));
}

/** Epley-formula: becsült egyismétléses maximum. */
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Egy szett volumene kg-ban (ismétlés × súly). */
export function setVolume(set: SetLike): number {
  return set.reps * set.weightKg;
}

export function totalVolume(sets: readonly SetLike[]): number {
  return volumeSets(sets).reduce((sum, set) => sum + setVolume(set), 0);
}

export function maxWeight(sets: readonly SetLike[]): number {
  return strengthSets(sets).reduce((max, set) => Math.max(max, set.weightKg), 0);
}

export function bestEstimated1RM(sets: readonly SetLike[]): number {
  return strengthSets(sets).reduce(
    (max, set) => Math.max(max, epley1RM(set.weightKg, set.reps)),
    0
  );
}

/** A legnehezebb szett; azonos súly esetén a több ismétléses nyer. */
export function heaviestSet<T extends SetLike>(sets: readonly T[]): T | null {
  return strengthSets(sets).reduce<T | null>((best, set) => {
    if (best === null) return set;
    if (set.weightKg > best.weightKg + EPSILON) return set;
    if (Math.abs(set.weightKg - best.weightKg) <= EPSILON && set.reps > best.reps) return set;
    return best;
  }, null);
}

/** Szigorú „jobb, mint" összehasonlítás lebegőpontos tűréssel. */
export function isBetter(candidate: number, current: number | null): boolean {
  if (current === null) return true;
  return candidate > current + EPSILON;
}
