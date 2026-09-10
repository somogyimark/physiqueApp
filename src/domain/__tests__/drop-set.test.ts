import { generateDropStages, MAX_DROP_STAGES } from '../drop-set';

describe('generateDropStages', () => {
  it('a felhasznalo peldaja: 35 -> 15 kg, 5 kg-onkent, 8 ismetles', () => {
    const result = generateDropStages({ startKg: 35, endKg: 15, stepKg: 5, reps: 8 });

    expect(result).toEqual({
      ok: true,
      stages: [
        { weightKg: 35, reps: 8 },
        { weightKg: 30, reps: 8 },
        { weightKg: 25, reps: 8 },
        { weightKg: 20, reps: 8 },
        { weightKg: 15, reps: 8 },
      ],
    });
  });

  it('nem pontosan oszthato tartomany eseten a zaro suly pontosan endKg lesz', () => {
    const result = generateDropStages({ startKg: 32.5, endKg: 15, stepKg: 5, reps: 10 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stages.map((stage) => stage.weightKg)).toEqual([32.5, 27.5, 22.5, 17.5, 15]);
    }
  });

  it('elutasit, ha a kezdo suly nem nagyobb a zaronal', () => {
    expect(generateDropStages({ startKg: 20, endKg: 20, stepKg: 5, reps: 8 })).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('elutasit ervenytelen (nulla/negativ) ertekekre', () => {
    expect(generateDropStages({ startKg: 35, endKg: 15, stepKg: 0, reps: 8 }).ok).toBe(false);
    expect(generateDropStages({ startKg: 35, endKg: 15, stepKg: 5, reps: 0 }).ok).toBe(false);
  });

  it('elutasit, ha a lepcsok szama tul sok', () => {
    const result = generateDropStages({ startKg: 200, endKg: 1, stepKg: 1, reps: 5 });
    expect(result).toEqual({ ok: false, error: 'too_many' });
  });

  it('a maximum lepcsoszamot pont elfogadja', () => {
    const result = generateDropStages({
      startKg: MAX_DROP_STAGES,
      endKg: 1,
      stepKg: 1,
      reps: 5,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.stages).toHaveLength(MAX_DROP_STAGES);
  });
});
