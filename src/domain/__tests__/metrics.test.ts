import {
  bestEstimated1RM,
  epley1RM,
  heaviestSet,
  isBetter,
  maxWeight,
  strengthSets,
  totalVolume,
  volumeSets,
} from '../metrics';

describe('epley1RM', () => {
  it('egy ismetlesnel a sulyt adja vissza', () => {
    expect(epley1RM(100, 1)).toBe(100);
  });

  it('nulla vagy negativ ismetlest is a sulykent kezel', () => {
    expect(epley1RM(100, 0)).toBe(100);
  });

  it('tobb ismetlesre felfele becsul', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.333, 3);
    expect(epley1RM(60, 5)).toBeCloseTo(70, 5);
  });
});

describe('volumeSets', () => {
  it('kihagyja a bemelegito es az ures szetteket, a drop lepcsot megtartja', () => {
    const sets = [
      { reps: 10, weightKg: 40, type: 'warmup' as const },
      { reps: 8, weightKg: 60 },
      { reps: 0, weightKg: 60 },
      { reps: 8, weightKg: 0 },
      { reps: 12, weightKg: 20, type: 'drop' as const },
    ];
    expect(volumeSets(sets)).toEqual([
      { reps: 8, weightKg: 60 },
      { reps: 12, weightKg: 20, type: 'drop' },
    ]);
  });
});

describe('strengthSets', () => {
  it('csak normal / 1RM / bukasig szettek szamitanak, drop es warmup nem', () => {
    const sets = [
      { reps: 10, weightKg: 40, type: 'warmup' as const },
      { reps: 8, weightKg: 60, type: 'normal' as const },
      { reps: 1, weightKg: 120, type: 'one_rep_max' as const },
      { reps: 15, weightKg: 55, type: 'to_failure' as const },
      { reps: 12, weightKg: 20, type: 'drop' as const },
    ];
    expect(strengthSets(sets).map((set) => set.weightKg)).toEqual([60, 120, 55]);
  });
});

describe('totalVolume', () => {
  it('ismetles x suly osszege, a drop lepcsok is beleszamitanak', () => {
    const sets = [
      { reps: 10, weightKg: 40, type: 'warmup' as const },
      { reps: 8, weightKg: 60 },
      { reps: 6, weightKg: 62.5 },
      { reps: 12, weightKg: 20, type: 'drop' as const },
    ];
    expect(totalVolume(sets)).toBeCloseTo(8 * 60 + 6 * 62.5 + 12 * 20, 5);
  });

  it('ures listara nulla', () => {
    expect(totalVolume([])).toBe(0);
  });
});

describe('maxWeight es bestEstimated1RM', () => {
  const sets = [
    { reps: 12, weightKg: 80, type: 'warmup' as const },
    { reps: 5, weightKg: 100 },
    { reps: 12, weightKg: 90 },
    { reps: 20, weightKg: 30, type: 'drop' as const },
  ];

  it('a legnagyobb beszamito sulyt adja, a drop lepcsot figyelmen kivul hagyva', () => {
    expect(maxWeight(sets)).toBe(100);
  });

  it('a legjobb becsult 1RM nem feltetlenul a legnehezebb szett', () => {
    // 90 x 12 becsult 1RM-je (126) magasabb, mint a 100 x 5-e (116.7).
    expect(bestEstimated1RM(sets)).toBeCloseTo(126, 5);
  });
});

describe('heaviestSet', () => {
  it('azonos sulynal a tobb ismetleses nyer', () => {
    const sets = [
      { reps: 5, weightKg: 100 },
      { reps: 8, weightKg: 100 },
    ];
    expect(heaviestSet(sets)).toEqual({ reps: 8, weightKg: 100 });
  });

  it('csak bemelegito szettekre null', () => {
    expect(heaviestSet([{ reps: 10, weightKg: 40, type: 'warmup' as const }])).toBeNull();
  });
});

describe('isBetter', () => {
  it('null eseten mindig jobb', () => {
    expect(isBetter(1, null)).toBe(true);
  });

  it('az egyenloseg nem jobb', () => {
    expect(isBetter(62.5, 62.5)).toBe(false);
  });

  it('lebegopontos maradek nem szamit jobbnak', () => {
    expect(isBetter(0.1 + 0.2, 0.3)).toBe(false);
  });
});
