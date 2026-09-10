import type { SQLiteDatabase } from 'expo-sqlite';

import { up as init } from './001_init';
import { up as seedExercises } from './002_seed_exercises';
import { up as setTypes } from './003_set_types';
import { up as templates } from './004_templates';

type Migration = {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
};

/**
 * A migrációk sorrendben, `version` szerint. Új migráció hozzáadásakor csak
 * egy új fájlt kell írni és ide felvenni — a futtató a `PRAGMA user_version`
 * alapján dönti el, mit kell még lefuttatni.
 */
const MIGRATIONS: Migration[] = [
  { version: 1, name: '001_init', up: init },
  { version: 2, name: '002_seed_exercises', up: seedExercises },
  { version: 3, name: '003_set_types', up: setTypes },
  { version: 4, name: '004_templates', up: templates },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/**
 * Lefuttatja a hiányzó migrációkat. A `SQLiteProvider` `onInit` hookjából hívjuk,
 * így a képernyők már migrált adatbázist látnak.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= LATEST_VERSION) {
    return;
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;

    // Minden migráció saját tranzakcióban fut: ha elhasal, nem marad félkész séma.
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      // A user_version nem paraméterezhető, de a forrás itt saját konstans.
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });

    console.log(`[db] migráció lefutott: ${migration.name}`);
  }

  console.log(`[db] séma verzió: ${LATEST_VERSION}`);
}
