import { annotateSetsWithPrs, countNewPrs, detectPrs, EMPTY_PR_CONTEXT, extendPrContext } from '../pr';

/** Elozmeny-kontextus felepitese szettekbol. */
function contextOf(sets: { reps: number; weightKg: number }[]) {
  return sets.reduce((context, set) => extendPrContext(context, set), EMPTY_PR_CONTEXT);
}

describe('detectPrs', () => {
  it('elso alkalommal nem jelol rekordot', () => {
    expect(detectPrs({ reps: 8, weightKg: 100 }, EMPTY_PR_CONTEXT)).toEqual([]);
  });

  it('nehezebb suly rekordsulyt ad', () => {
    const context = contextOf([{ reps: 8, weightKg: 100 }]);
    expect(detectPrs({ reps: 8, weightKg: 102.5 }, context)).toContain('weight');
  });

  it('ugyanaz a teljesitmeny nem rekord', () => {
    const context = contextOf([{ reps: 8, weightKg: 100 }]);
    expect(detectPrs({ reps: 8, weightKg: 100 }, context)).toEqual([]);
  });

  it('azonos sulyon tobb ismetles ismetles-rekord es 1RM-rekord', () => {
    const context = contextOf([{ reps: 8, weightKg: 100 }]);
    const prs = detectPrs({ reps: 10, weightKg: 100 }, context);

    expect(prs).toContain('e1rm');
    expect(prs).toContain('repMax');
    expect(prs).not.toContain('weight');
  });

  it('uj ismetlesszam onmagaban is rekord az adott ismetlesre', () => {
    const context = contextOf([{ reps: 8, weightKg: 100 }]);
    expect(detectPrs({ reps: 3, weightKg: 90 }, context)).toEqual(['repMax']);
  });

  it('bemelegito szett sosem rekord', () => {
    const context = contextOf([{ reps: 8, weightKg: 100 }]);
    expect(detectPrs({ reps: 8, weightKg: 200, type: 'warmup' }, context)).toEqual([]);
  });

  it('drop-set lepcso nem csinal rekordot', () => {
    const context = contextOf([{ reps: 8, weightKg: 100 }]);
    expect(detectPrs({ reps: 20, weightKg: 15, type: 'drop' }, context)).toEqual([]);
  });

  it('1RM kiserlet teljes erteku: nehezebb egyismetleses rekord', () => {
    const context = contextOf([{ reps: 3, weightKg: 100 }]);
    expect(detectPrs({ reps: 1, weightKg: 110, type: 'one_rep_max' }, context)).toContain('weight');
  });

  it('bukasig szett teljes erteku a becsult 1RM-hez', () => {
    const context = contextOf([{ reps: 5, weightKg: 100 }]);
    expect(detectPrs({ reps: 12, weightKg: 95, type: 'to_failure' }, context)).toContain('e1rm');
  });

  it('ures szett sosem rekord', () => {
    const context = contextOf([{ reps: 8, weightKg: 100 }]);
    expect(detectPrs({ reps: 0, weightKg: 200 }, context)).toEqual([]);
  });
});

describe('annotateSetsWithPrs', () => {
  const context = contextOf([{ reps: 8, weightKg: 100 }]);

  it('egy edzesen belul ugyanaz a teljesitmeny csak egyszer rekord', () => {
    const annotated = annotateSetsWithPrs(
      [
        { reps: 8, weightKg: 105 },
        { reps: 8, weightKg: 105 },
      ],
      context
    );

    expect(annotated[0].prs).toContain('weight');
    expect(annotated[1].prs).toEqual([]);
  });

  it('a kesobbi, meg nehezebb szett ujra rekord', () => {
    const annotated = annotateSetsWithPrs(
      [
        { reps: 8, weightKg: 105 },
        { reps: 8, weightKg: 110 },
      ],
      context
    );

    expect(annotated[0].prs).toContain('weight');
    expect(annotated[1].prs).toContain('weight');
    expect(countNewPrs(annotated)).toBe(2);
  });

  it('a bemelegito es a drop szett nem rontja el a szamlalast', () => {
    const annotated = annotateSetsWithPrs(
      [
        { reps: 10, weightKg: 60, type: 'warmup' as const },
        { reps: 8, weightKg: 105 },
        { reps: 20, weightKg: 15, type: 'drop' as const },
      ],
      context
    );

    expect(countNewPrs(annotated)).toBe(1);
  });

  it('elozmeny nelkul semmi nem rekord', () => {
    const annotated = annotateSetsWithPrs(
      [
        { reps: 8, weightKg: 100 },
        { reps: 8, weightKg: 120 },
      ],
      EMPTY_PR_CONTEXT
    );

    expect(countNewPrs(annotated)).toBe(1);
    expect(annotated[0].prs).toEqual([]);
    expect(annotated[1].prs).toContain('weight');
  });
});
