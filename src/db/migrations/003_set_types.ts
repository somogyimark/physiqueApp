import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Szett-típusok bevezetése a korábbi `is_warmup` logikai mező helyett:
 * `normal | warmup | one_rep_max | to_failure | drop`.
 * A `drop` lépcsőket a `group_id` fűzi össze, a `group_index` adja a sorrendet.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE sets ADD COLUMN type TEXT NOT NULL DEFAULT 'normal';
    ALTER TABLE sets ADD COLUMN group_id TEXT;
    ALTER TABLE sets ADD COLUMN group_index INTEGER;

    UPDATE sets SET type = 'warmup' WHERE is_warmup = 1;

    ALTER TABLE sets DROP COLUMN is_warmup;

    CREATE INDEX ix_sets_group ON sets (group_id);
  `);
}
