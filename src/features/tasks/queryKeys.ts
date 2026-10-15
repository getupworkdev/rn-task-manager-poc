import type { TaskSort, TaskStatus } from '../../api/types';

export type TaskListFilters = { status?: TaskStatus; sort: TaskSort };

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskListFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export const PAGE_SIZE = 15;
