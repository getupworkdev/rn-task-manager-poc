import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';

import type { Task, TaskPage } from '../../api/types';
import { taskKeys, type TaskListFilters } from './queryKeys';

type ListData = InfiniteData<TaskPage, number>;
export type ListSnapshot = [QueryKey, ListData | undefined][];

/** Copy of every cached task list, so an optimistic change can be undone exactly. */
export function snapshotLists(qc: QueryClient): ListSnapshot {
  return qc.getQueriesData<ListData>({ queryKey: taskKeys.lists() });
}

export function restoreLists(qc: QueryClient, snapshot: ListSnapshot) {
  snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
}

function filtersOf(key: QueryKey): TaskListFilters | undefined {
  return key[2] as TaskListFilters | undefined;
}

function matches(task: Task, filters: TaskListFilters | undefined) {
  return !filters?.status || filters.status === task.status;
}

/**
 * Applies a change to one task in every cached list. Lists filtered by status drop the
 * task when its new status no longer matches, so list and detail never disagree.
 */
export function replaceTaskInLists(qc: QueryClient, id: string, next: Task) {
  qc.getQueriesData<ListData>({ queryKey: taskKeys.lists() }).forEach(([key, data]) => {
    if (!data) return;
    const keep = matches(next, filtersOf(key));
    qc.setQueryData<ListData>(key, {
      ...data,
      pages: data.pages.map((page) => {
        const had = page.items.some((t) => t.id === id);
        if (!had) return page;
        return {
          ...page,
          total: keep ? page.total : page.total - 1,
          items: keep
            ? page.items.map((t) => (t.id === id ? next : t))
            : page.items.filter((t) => t.id !== id),
        };
      }),
    });
  });
}

export function removeTaskFromLists(qc: QueryClient, id: string) {
  qc.getQueriesData<ListData>({ queryKey: taskKeys.lists() }).forEach(([key, data]) => {
    if (!data) return;
    qc.setQueryData<ListData>(key, {
      ...data,
      pages: data.pages.map((page) =>
        page.items.some((t) => t.id === id)
          ? { ...page, total: page.total - 1, items: page.items.filter((t) => t.id !== id) }
          : page,
      ),
    });
  });
}

/** Puts a new task at the top of every cached list whose filter it matches. */
export function prependTaskToLists(qc: QueryClient, task: Task) {
  qc.getQueriesData<ListData>({ queryKey: taskKeys.lists() }).forEach(([key, data]) => {
    if (!data || !matches(task, filtersOf(key)) || data.pages.length === 0) return;
    const [first, ...rest] = data.pages;
    qc.setQueryData<ListData>(key, {
      ...data,
      pages: [{ ...first, total: first.total + 1, items: [task, ...first.items] }, ...rest],
    });
  });
}

export function findTaskInLists(qc: QueryClient, id: string): Task | undefined {
  for (const [, data] of qc.getQueriesData<ListData>({ queryKey: taskKeys.lists() })) {
    const found = data?.pages.flatMap((p) => p.items).find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}
