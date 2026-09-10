/** Repository-szintű hibák, amelyeket a UI felismerhet és lefordíthat. */
export class DuplicateExerciseNameError extends Error {
  constructor() {
    super('Már létezik ilyen nevű gyakorlat.');
    this.name = 'DuplicateExerciseNameError';
  }
}

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}
