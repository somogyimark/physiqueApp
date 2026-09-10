/**
 * Magyar számformázás. Szándékosan kézzel, `Intl` nélkül, hogy a Hermes motor
 * lokalizációs beállításaitól függetlenül mindig ugyanazt adja.
 */

/** Tizedesvessző, felesleges nullák nélkül: 62.5 -> „62,5", 60 -> „60". */
export function formatNumber(value: number, maxDecimals = 1): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return String(rounded).replace('.', ',');
}

/** „62,5 kg" */
export function formatWeight(kg: number): string {
  return `${formatNumber(kg)} kg`;
}

/** Ezres tagolás nem törő szóközzel: 3250 -> „3 250 kg". */
export function formatVolume(kg: number): string {
  const rounded = Math.round(kg);
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return `${grouped} kg`;
}

/** „8 × 62,5 kg" */
export function formatSet(reps: number, weightKg: number): string {
  return `${reps} × ${formatWeight(weightKg)}`;
}

/**
 * Súlybevitel elemzése: elfogadja a tizedesvesszőt és a tizedespontot is.
 * Érvénytelen bemenetre `null`.
 */
export function parseWeightInput(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

/** Ismétlésszám elemzése: csak nemnegatív egész. */
export function parseRepsInput(text: string): number | null {
  const normalized = text.trim();
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}
