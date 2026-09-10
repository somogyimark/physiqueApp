import type { SQLiteDatabase } from 'expo-sqlite';

/** Kezdeti séma: gyakorlatok, edzések, edzés-blokkok, szettek, beállítások. */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE exercises (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      muscle_group  TEXT    NOT NULL,
      equipment     TEXT,
      notes         TEXT,
      is_archived   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL
    );
    CREATE UNIQUE INDEX ux_exercises_name ON exercises (lower(name));

    CREATE TABLE workouts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      performed_at  TEXT    NOT NULL,
      day           TEXT    NOT NULL,
      title         TEXT,
      notes         TEXT,
      status        TEXT    NOT NULL DEFAULT 'in_progress',
      created_at    TEXT    NOT NULL,
      updated_at    TEXT    NOT NULL
    );
    CREATE INDEX ix_workouts_day ON workouts (day DESC);
    CREATE INDEX ix_workouts_status ON workouts (status);

    CREATE TABLE workout_exercises (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id    INTEGER NOT NULL REFERENCES workouts(id)  ON DELETE CASCADE,
      exercise_id   INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
      position      INTEGER NOT NULL,
      notes         TEXT
    );
    CREATE INDEX ix_we_workout  ON workout_exercises (workout_id);
    CREATE INDEX ix_we_exercise ON workout_exercises (exercise_id);

    CREATE TABLE sets (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_exercise_id  INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      set_index            INTEGER NOT NULL,
      reps                 INTEGER NOT NULL,
      weight_kg            REAL    NOT NULL,
      rpe                  REAL,
      is_warmup            INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX ix_sets_we ON sets (workout_exercise_id);

    CREATE TABLE app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
