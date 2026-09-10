import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Edzés-sablonok: egy edzésből elmentett gyakorlat- és szett-váz, amelyből
 * később új edzés indítható. A szerkezet szándékosan a `workouts` táblák
 * tükre, hogy az „edzésből mentés" és a „sablonból indítás" egyszerű másolás
 * legyen.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE templates (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      notes         TEXT,
      created_at    TEXT    NOT NULL,
      updated_at    TEXT    NOT NULL,
      last_used_at  TEXT
    );

    CREATE TABLE template_exercises (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id  INTEGER NOT NULL REFERENCES templates(id)  ON DELETE CASCADE,
      exercise_id  INTEGER NOT NULL REFERENCES exercises(id)  ON DELETE CASCADE,
      position     INTEGER NOT NULL,
      notes        TEXT
    );
    CREATE INDEX ix_te_template  ON template_exercises (template_id);
    CREATE INDEX ix_te_exercise  ON template_exercises (exercise_id);

    CREATE TABLE template_sets (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      template_exercise_id  INTEGER NOT NULL REFERENCES template_exercises(id) ON DELETE CASCADE,
      set_index             INTEGER NOT NULL,
      type                  TEXT    NOT NULL DEFAULT 'normal',
      target_reps           INTEGER,
      target_weight_kg      REAL,
      group_id              TEXT,
      group_index           INTEGER
    );
    CREATE INDEX ix_ts_template_exercise ON template_sets (template_exercise_id);

    ALTER TABLE workouts ADD COLUMN template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL;
  `);
}
