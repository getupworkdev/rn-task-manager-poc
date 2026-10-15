import type { ReactNode } from 'react';

import { AppProviders, createQueryClient } from './AppProviders';
import { mockServer } from './mocks/mockServer';
import { createSeedTasks } from './mocks/seed';

/** Fixed clock for seed data so tests do not depend on today's date. */
export const TEST_NOW = new Date('2026-10-15T09:00:00Z');

export function resetMockServer(tasks = createSeedTasks(TEST_NOW)) {
  mockServer.reset(tasks);
  mockServer.configure({ latency: [0, 0] });
}

export function createWrapper() {
  const queryClient = createQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders queryClient={queryClient} themePreference="light">
        {children}
      </AppProviders>
    );
  }
  return { queryClient, Wrapper };
}
