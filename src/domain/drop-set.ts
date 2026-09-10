/**
 * Drop set lépcsők generálása — tiszta logika, unit-tesztelt.
 *
 * Példa: kezdő 35 kg, záró 15 kg, lépés 5 kg, lépcsőnként 8 ismétlés
 *   -> 35, 30, 25, 20, 15 kg, mind 8 ismétléssel.
 */

export type DropStageInput = {
  /** A legnehezebb (első) lépcső súlya kg-ban. */
  startKg: number;
  /** A legkönnyebb (utolsó) lépcső súlya kg-ban. */
  endKg: number;
  /** Súlycsökkenés lépcsőnként kg-ban (pozitív szám). */
  stepKg: number;
  /** Ismétlésszám minden lépcsőn. */
  reps: number;
};

export type DropStage = {
  weightKg: number;
  reps: number;
};

/** Biztonsági korlát, hogy egy elgépelt lépés ne generáljon több száz lépcsőt. */
export const MAX_DROP_STAGES = 12;

export type DropStagesResult =
  | { ok: true; stages: DropStage[] }
  | { ok: false; error: 'invalid' | 'too_many' };

export function generateDropStages(input: DropStageInput): DropStagesResult {
  const { startKg, endKg, stepKg, reps } = input;

  const valid =
    Number.isFinite(startKg) &&
    Number.isFinite(endKg) &&
    Number.isFinite(stepKg) &&
    Number.isFinite(reps) &&
    startKg > 0 &&
    endKg > 0 &&
    stepKg > 0 &&
    reps > 0 &&
    startKg > endKg;

  if (!valid) return { ok: false, error: 'invalid' };

  const stageCount = Math.floor((startKg - endKg) / stepKg + 1e-9) + 1;
  if (stageCount > MAX_DROP_STAGES) return { ok: false, error: 'too_many' };

  const stages: DropStage[] = [];
  for (let i = 0; i < stageCount; i += 1) {
    stages.push({ weightKg: round2(startKg - i * stepKg), reps });
  }

  // Ha a lépés nem osztja pontosan a tartományt, a záró súly legyen pontosan endKg.
  const last = stages[stages.length - 1];
  if (Math.abs(last.weightKg - endKg) > 1e-6 && last.weightKg > endKg) {
    stages.push({ weightKg: round2(endKg), reps });
  }

  return { ok: true, stages };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
