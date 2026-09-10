import type { SQLiteDatabase } from 'expo-sqlite';

type Seed = [name: string, muscleGroup: string, equipment: string];

/** Alap gyakorlatkészlet, hogy az app ne üres könyvtárral induljon. */
const SEED: Seed[] = [
  ['Fekvenyomás', 'mell', 'rud'],
  ['Ferdepados nyomás', 'mell', 'rud'],
  ['Tolódzkodás', 'mell', 'sajat_testsuly'],
  ['Kézisúlyzós tárogatás', 'mell', 'kezisulyzo'],
  ['Guggolás', 'lab', 'rud'],
  ['Első guggolás', 'lab', 'rud'],
  ['Lábtoló gép', 'lab', 'gep'],
  ['Román felhúzás', 'lab', 'rud'],
  ['Kitörés', 'lab', 'kezisulyzo'],
  ['Vádliemelés', 'lab', 'gep'],
  ['Felhúzás', 'hat', 'rud'],
  ['Húzódzkodás', 'hat', 'sajat_testsuly'],
  ['Rúdevezés', 'hat', 'rud'],
  ['Kézisúlyzós evezés', 'hat', 'kezisulyzo'],
  ['Lehúzás', 'hat', 'kabel'],
  ['Katonai nyomás', 'vall', 'rud'],
  ['Kézisúlyzós vállnyomás', 'vall', 'kezisulyzo'],
  ['Oldalemelés', 'vall', 'kezisulyzo'],
  ['Bicepsz hajlítás', 'kar', 'rud'],
  ['Kalapács bicepsz', 'kar', 'kezisulyzo'],
  ['Tricepsz lenyomás', 'kar', 'kabel'],
  ['Szűkfogású fekvenyomás', 'kar', 'rud'],
  ['Plank', 'has', 'sajat_testsuly'],
  ['Lábemelés', 'has', 'sajat_testsuly'],
];

export async function up(db: SQLiteDatabase): Promise<void> {
  const createdAt = new Date().toISOString();
  const statement = await db.prepareAsync(
    `INSERT INTO exercises (name, muscle_group, equipment, created_at) VALUES (?, ?, ?, ?)`
  );
  try {
    for (const [name, muscleGroup, equipment] of SEED) {
      await statement.executeAsync(name, muscleGroup, equipment, createdAt);
    }
  } finally {
    await statement.finalizeAsync();
  }
}
