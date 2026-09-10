import { router } from 'expo-router';
import { useState } from 'react';

import { ExerciseForm } from '@/components/exercise/exercise-form';
import { Screen } from '@/components/ui/screen';
import { T } from '@/constants/strings';
import { useCreateExercise } from '@/hooks/use-exercises';
import { DuplicateExerciseNameError } from '@/repositories/errors';
import type { ExerciseInput } from '@/repositories/exercises';

export default function NewExerciseScreen() {
  const createExercise = useCreateExercise();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(input: ExerciseInput) {
    setError(null);
    createExercise.mutate(input, {
      onSuccess: () => router.back(),
      onError: (mutationError) => {
        setError(
          mutationError instanceof DuplicateExerciseNameError
            ? T.exercises.nameTaken
            : T.common.error
        );
      },
    });
  }

  return (
    <Screen>
      <ExerciseForm
        submitLabel={T.common.save}
        submitting={createExercise.isPending}
        errorMessage={error}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
