import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { ApiError } from '../../api/client';
import { tasksApi } from '../../api/tasks';
import type { Task, TaskInput, TaskPatch } from '../../api/types';
import { useToast } from '../../components/Toast';
import {
  findTaskInLists,
  prependTaskToLists,
  removeTaskFromLists,
  replaceTaskInLists,
  restoreLists,
  snapshotLists,
  type ListSnapshot,
} from './cache';
import { PAGE_SIZE, taskKeys, type TaskListFilters } from './queryKeys';

export const UNDO_WINDOW_MS = 4000;

function messageOf(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong';
}

export function useTaskList(filters: TaskListFilters) {
  return useInfiniteQuery({
    queryKey: taskKeys.list(filters),
    queryFn: ({ pageParam }) => tasksApi.list({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
}

export function useTask(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.get(id),
    // Open the detail screen instantly with the row we already have.
    placeholderData: () => findTaskInLists(qc, id),
    enabled: !id.startsWith('temp-'),
  });
}

async function cancelTaskQueries(qc: QueryClient) {
  await qc.cancelQueries({ queryKey: taskKeys.all });
}

type UpdateContext = { lists: ListSnapshot; detail: Task | undefined };

export function useUpdateTask() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation<Task, unknown, { id: string; patch: TaskPatch }, UpdateContext>({
    mutationFn: ({ id, patch }) => tasksApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await cancelTaskQueries(qc);
      const lists = snapshotLists(qc);
      const detail = qc.getQueryData<Task>(taskKeys.detail(id));
      const current = detail ?? findTaskInLists(qc, id);
      if (current) {
        const optimistic = { ...current, ...patch, updatedAt: new Date().toISOString() };
        qc.setQueryData(taskKeys.detail(id), optimistic);
        replaceTaskInLists(qc, id, optimistic);
      }
      return { lists, detail };
    },
    onError: (error, { id }, context) => {
      if (context) {
        restoreLists(qc, context.lists);
        qc.setQueryData(taskKeys.detail(id), context.detail);
      }
      toast.show({
        message: `Couldn't save: ${messageOf(error)}. Changes undone.`,
        variant: 'error',
      });
    },
    onSuccess: (task) => {
      qc.setQueryData(taskKeys.detail(task.id), task);
      replaceTaskInLists(qc, task.id, task);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

type CreateContext = { lists: ListSnapshot; tempId: string };

export function useCreateTask() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation<Task, unknown, TaskInput, CreateContext>({
    mutationFn: (input) => tasksApi.create(input),
    onMutate: async (input) => {
      await cancelTaskQueries(qc);
      const lists = snapshotLists(qc);
      const now = new Date().toISOString();
      const tempId = `temp-${Date.now()}`;
      prependTaskToLists(qc, { ...input, id: tempId, createdAt: now, updatedAt: now });
      return { lists, tempId };
    },
    onError: (error, _input, context) => {
      if (context) restoreLists(qc, context.lists);
      toast.show({ message: `Couldn't create task: ${messageOf(error)}`, variant: 'error' });
    },
    onSuccess: (task, _input, context) => {
      qc.setQueryData(taskKeys.detail(task.id), task);
      if (context) replaceTaskInLists(qc, context.tempId, task);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

/**
 * Removes a task from every list straight away and shows an Undo toast. The DELETE
 * request only goes out when the undo window closes; if it then fails, the task comes back.
 */
export function useDeleteTaskWithUndo() {
  const qc = useQueryClient();
  const toast = useToast();
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const mutation = useMutation<void, unknown, { task: Task; lists: ListSnapshot }>({
    mutationFn: ({ task }) => tasksApi.remove(task.id),
    onError: (error, { lists }) => {
      restoreLists(qc, lists);
      toast.show({
        message: `Couldn't delete: ${messageOf(error)}. Task restored.`,
        variant: 'error',
      });
    },
    onSuccess: (_data, { task }) => qc.removeQueries({ queryKey: taskKeys.detail(task.id) }),
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });

  const { mutate } = mutation;

  const remove = useCallback(
    (task: Task) => {
      const lists = snapshotLists(qc);
      removeTaskFromLists(qc, task.id);

      const timer = setTimeout(() => {
        timers.current.delete(timer);
        mutate({ task, lists });
      }, UNDO_WINDOW_MS);
      timers.current.add(timer);

      toast.show({
        message: `"${task.title}" deleted`,
        duration: UNDO_WINDOW_MS,
        action: {
          label: 'Undo',
          onPress: () => {
            clearTimeout(timer);
            timers.current.delete(timer);
            restoreLists(qc, lists);
          },
        },
      });
    },
    [mutate, qc, toast],
  );

  return { remove, isDeleting: mutation.isPending };
}
