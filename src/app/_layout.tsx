import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { DATABASE_NAME, runMigrations } from '@/db/client';
import { T } from '@/constants/strings';
import { Colors } from '@/constants/theme';

/**
 * A gyökérréteg három dolgot csinál:
 *  1. megnyitja és migrálja az adatbázist (a képernyők már kész sémát látnak),
 *  2. felállítja a react-query cache-t (mentés után innen jön a frissítés),
 *  3. beállítja a navigációt: tabok + fölöttük egy Stack a részletképernyőknek.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Helyi SQLite: nincs hálózat, az újralekérdezés olcsó, az elavult adat viszont zavaró.
      staleTime: 0,
      retry: false,
    },
  },
});

function DatabaseLoading() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Suspense fallback={<DatabaseLoading />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={runMigrations} useSuspense>
          <QueryClientProvider client={queryClient}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="workout/[id]/index" options={{ title: '' }} />
              <Stack.Screen
                name="workout/[id]/picker"
                options={{ presentation: 'modal', title: T.workouts.addExercise }}
              />
              <Stack.Screen
                name="exercise/new"
                options={{ presentation: 'modal', title: T.exercises.newExercise }}
              />
              <Stack.Screen name="exercise/[id]" options={{ title: T.exercises.editExercise }} />
              <Stack.Screen name="template/[id]" options={{ title: T.templates.title }} />
              <Stack.Screen name="settings" options={{ title: T.settings.title }} />
            </Stack>
          </QueryClientProvider>
        </SQLiteProvider>
      </Suspense>
    </ThemeProvider>
  );
}
