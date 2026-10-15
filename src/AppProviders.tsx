import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from './components/Toast';
import { ThemeProvider, type ThemePreference } from './theme/ThemeProvider';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // No automatic retries, so a simulated failure shows up straight away.
      queries: { retry: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
}

export function AppProviders({
  children,
  queryClient,
  themePreference,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
  themePreference?: ThemePreference;
}) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <ThemeProvider initialPreference={themePreference}>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
