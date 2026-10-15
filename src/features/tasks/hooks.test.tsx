import type { InfiniteData } from '@tanstack/react-query';
import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react-native';

import type { Task, TaskPage } from '../../api/types';
import { mockServer } from '../../mocks/mockServer';
import { createWrapper, resetMockServer } from '../../test-utils';
import {
  UNDO_WINDOW_MS,
  useCreateTask,
  useDeleteTaskWithUndo,
  useTaskList,
  useUpdateTask,
} from './hooks';
import { taskKeys } from './queryKeys';

const ALL = { sort: 'dueDate' as const };
const TODO = { status: 'todo' as const, sort: 'dueDate' as const };

function cachedIds(queryClient: ReturnType<typeof createWrapper>['queryClient'], filters = ALL) {
  const data = queryClient.getQueryData<InfiniteData<TaskPage, number>>(taskKeys.list(filters));
  return data?.pages.flatMap((p) => p.items.map((t) => t.id)) ?? [];
}

function cachedTask(
  queryClient: ReturnType<typeof createWrapper>['queryClient'],
  id: string,
  filters = ALL,
): Task | undefined {
  const data = queryClient.getQueryData<InfiniteData<TaskPage, number>>(taskKeys.list(filters));
  return data?.pages.flatMap((p) => p.items).find((t) => t.id === id);
}

async function renderWithList() {
  const { queryClient, Wrapper } = createWrapper();
  const hooks = await renderHook(
    () => ({
      all: useTaskList(ALL),
      todo: useTaskList(TODO),
      update: useUpdateTask(),
      create: useCreateTask(),
      del: useDeleteTaskWithUndo(),
    }),
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(hooks.result.current.all.isSuccess).toBe(true));
  await waitFor(() => expect(hooks.result.current.todo.isSuccess).toBe(true));
  return { ...hooks, queryClient };
}

beforeEach(() => resetMockServer());
afterEach(() => jest.useRealTimers());

describe('useTaskList', () => {
  it('loads pages and appends the next one', async () => {
    const { result } = await renderWithList();
    expect(result.current.all.data?.pages[0].items).toHaveLength(15);

    await act(async () => {
      await result.current.all.fetchNextPage();
    });
    await waitFor(() => expect(result.current.all.data?.pages).toHaveLength(2));
    expect(result.current.all.hasNextPage).toBe(true);
  });
});

describe('useUpdateTask', () => {
  it('updates every cache at once and keeps the change after the server confirms', async () => {
    const { result, queryClient } = await renderWithList();
    const task = result.current.todo.data!.pages[0].items[0];
    mockServer.configure({ latency: [50, 50] });

    await act(async () => {
      result.current.update.mutate({ id: task.id, patch: { status: 'done' } });
    });

    // Optimistic: changed in "All", gone from the "To do" filter, before the server answers.
    await waitFor(() => expect(cachedTask(queryClient, task.id)?.status).toBe('done'));
    expect(cachedIds(queryClient, TODO)).not.toContain(task.id);
    expect(queryClient.getQueryData<Task>(taskKeys.detail(task.id))?.status).toBe('done');

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    expect(mockServer.all().find((t) => t.id === task.id)?.status).toBe('done');
  });

  it('rolls every cache back and shows a toast when the request fails', async () => {
    const { result, queryClient } = await renderWithList();
    const task = result.current.todo.data!.pages[0].items[0];
    mockServer.configure({ latency: [50, 50] });
    mockServer.setFailNext(true);

    await act(async () => {
      result.current.update.mutate({ id: task.id, patch: { status: 'done' } });
    });
    await waitFor(() => expect(cachedTask(queryClient, task.id)?.status).toBe('done'));

    await waitFor(() => expect(result.current.update.isError).toBe(true));
    expect(cachedTask(queryClient, task.id)?.status).toBe('todo');
    expect(cachedIds(queryClient, TODO)).toContain(task.id);
    expect(await screen.findByText(/Couldn't save: Simulated server failure/)).toBeTruthy();
    expect(mockServer.all().find((t) => t.id === task.id)?.status).toBe('todo');
  });
});

describe('useCreateTask', () => {
  const input = {
    title: 'Brand new task',
    description: '',
    status: 'todo' as const,
    priority: 'high' as const,
    dueDate: null,
  };

  it('shows the task straight away, then swaps in the saved one', async () => {
    const { result, queryClient } = await renderWithList();
    mockServer.configure({ latency: [50, 50] });

    await act(async () => {
      result.current.create.mutate(input);
    });
    await waitFor(() => expect(cachedIds(queryClient)[0]).toMatch(/^temp-/));

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true));
    const saved = result.current.create.data!;
    expect(cachedIds(queryClient)).not.toContainEqual(expect.stringMatching(/^temp-/));
    expect(mockServer.all().some((t) => t.id === saved.id)).toBe(true);
  });

  it('removes the optimistic task when the request fails', async () => {
    const { result, queryClient } = await renderWithList();
    const before = cachedIds(queryClient);
    mockServer.configure({ latency: [50, 50] });
    mockServer.setFailNext(true);

    await act(async () => {
      result.current.create.mutate(input);
    });
    await waitFor(() => expect(cachedIds(queryClient)[0]).toMatch(/^temp-/));

    await waitFor(() => expect(result.current.create.isError).toBe(true));
    expect(cachedIds(queryClient)).toEqual(before);
    expect(await screen.findByText(/Couldn't create task/)).toBeTruthy();
  });
});

describe('useDeleteTaskWithUndo', () => {
  it('hides the task at once and restores it on Undo without calling the API', async () => {
    const { result, queryClient } = await renderWithList();
    const task = result.current.all.data!.pages[0].items[0];

    await act(async () => {
      result.current.del.remove(task);
    });
    expect(cachedIds(queryClient)).not.toContain(task.id);

    const undo = await screen.findByText('UNDO');
    await act(async () => {
      fireEvent.press(undo);
    });
    expect(cachedIds(queryClient)).toContain(task.id);
    expect(mockServer.all().some((t) => t.id === task.id)).toBe(true);
  });

  it('sends the DELETE when the undo window closes', async () => {
    jest.useFakeTimers();
    const { result, queryClient } = await renderWithList();
    const task = result.current.all.data!.pages[0].items[0];

    await act(async () => {
      result.current.del.remove(task);
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(UNDO_WINDOW_MS + 100);
    });

    expect(mockServer.all().some((t) => t.id === task.id)).toBe(false);
    expect(cachedIds(queryClient)).not.toContain(task.id);
  });

  it('brings the task back if the DELETE fails', async () => {
    jest.useFakeTimers();
    const { result, queryClient } = await renderWithList();
    const task = result.current.all.data!.pages[0].items[0];
    mockServer.setFailNext(true);

    await act(async () => {
      result.current.del.remove(task);
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(UNDO_WINDOW_MS + 100);
    });

    expect(cachedIds(queryClient)).toContain(task.id);
    expect(mockServer.all().some((t) => t.id === task.id)).toBe(true);
  });
});
