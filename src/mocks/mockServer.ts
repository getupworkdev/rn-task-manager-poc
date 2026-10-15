import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskListParams,
  type TaskPage,
  type TaskPatch,
} from '../api/types';
import { createSeedTasks } from './seed';

type MockConfig = {
  /** Inclusive range in milliseconds; each request waits a random time within it. */
  latency: [number, number];
};

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

let tasks: Task[] = createSeedTasks();
let nextId = tasks.length + 1;
let config: MockConfig = { latency: [300, 800] };
let failNext = false;
const failListeners = new Set<(value: boolean) => void>();

export const mockServer = {
  configure(partial: Partial<MockConfig>) {
    config = { ...config, ...partial };
  },
  reset(seed: Task[] = createSeedTasks()) {
    tasks = seed.map((t) => ({ ...t }));
    nextId = tasks.length + 1;
    this.setFailNext(false);
  },
  all(): Task[] {
    return tasks.map((t) => ({ ...t }));
  },
  /** When on, the next request fails with a 503 and the switch turns itself off. */
  setFailNext(value: boolean) {
    failNext = value;
    failListeners.forEach((listener) => listener(value));
  },
  getFailNext() {
    return failNext;
  },
  subscribeFailNext(listener: (value: boolean) => void) {
    failListeners.add(listener);
    return () => {
      failListeners.delete(listener);
    };
  },
};

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatency() {
  const [min, max] = config.latency;
  return min + Math.round(Math.random() * (max - min));
}

function parseBody(data: unknown): Record<string, unknown> {
  if (typeof data === 'string' && data.length > 0) return JSON.parse(data);
  if (data && typeof data === 'object') return data as Record<string, unknown>;
  return {};
}

function validate(input: Record<string, unknown>, partial: boolean): TaskPatch {
  const out: TaskPatch = {};
  if ('title' in input || !partial) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      throw new HttpError(422, 'Title is required');
    }
    out.title = input.title.trim();
  }
  if ('description' in input) {
    if (typeof input.description !== 'string') throw new HttpError(422, 'Invalid description');
    out.description = input.description;
  }
  if ('status' in input) {
    if (!TASK_STATUSES.includes(input.status as never)) throw new HttpError(422, 'Invalid status');
    out.status = input.status as Task['status'];
  }
  if ('priority' in input) {
    if (!TASK_PRIORITIES.includes(input.priority as never)) {
      throw new HttpError(422, 'Invalid priority');
    }
    out.priority = input.priority as Task['priority'];
  }
  if ('dueDate' in input) {
    const due = input.dueDate;
    if (due !== null && (typeof due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(due))) {
      throw new HttpError(422, 'Invalid due date');
    }
    out.dueDate = due as string | null;
  }
  return out;
}

function compare(sort: NonNullable<TaskListParams['sort']>) {
  return (a: Task, b: Task) => {
    if (sort === 'priority') {
      const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (diff !== 0) return diff;
    }
    if (sort === 'dueDate' || sort === 'priority') {
      // Tasks without a due date go last.
      if (a.dueDate !== b.dueDate) {
        if (a.dueDate === null) return 1;
        if (b.dueDate === null) return -1;
        return a.dueDate < b.dueDate ? -1 : 1;
      }
    }
    return b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
  };
}

function listTasks(query: URLSearchParams): TaskPage {
  const status = query.get('status') as Task['status'] | null;
  const sort = (query.get('sort') as TaskListParams['sort']) ?? 'dueDate';
  const page = Math.max(1, Number(query.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(query.get('limit') ?? 15)));

  const filtered = (status ? tasks.filter((t) => t.status === status) : tasks).slice();
  filtered.sort(compare(sort));
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit).map((t) => ({ ...t }));
  return {
    items,
    page,
    limit,
    total: filtered.length,
    nextPage: start + limit < filtered.length ? page + 1 : null,
  };
}

function findIndex(id: string) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) throw new HttpError(404, 'Task not found');
  return index;
}

function route(method: string, path: string, query: URLSearchParams, body: unknown) {
  const detail = path.match(/^\/tasks\/([^/]+)$/);

  if (method === 'get' && path === '/tasks') return { status: 200, data: listTasks(query) };

  if (method === 'post' && path === '/tasks') {
    const input = validate(parseBody(body), false) as TaskInput;
    const now = new Date().toISOString();
    const task: Task = {
      id: `t${String(nextId++).padStart(3, '0')}`,
      title: input.title,
      description: input.description ?? '',
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    tasks = [task, ...tasks];
    return { status: 201, data: { ...task } };
  }

  if (detail && method === 'get') {
    return { status: 200, data: { ...tasks[findIndex(detail[1])] } };
  }

  if (detail && method === 'patch') {
    const index = findIndex(detail[1]);
    const patch = validate(parseBody(body), true);
    const updated: Task = { ...tasks[index], ...patch, updatedAt: new Date().toISOString() };
    tasks = tasks.map((t, i) => (i === index ? updated : t));
    return { status: 200, data: { ...updated } };
  }

  if (detail && method === 'delete') {
    const index = findIndex(detail[1]);
    tasks = tasks.filter((_, i) => i !== index);
    return { status: 204, data: null };
  }

  throw new HttpError(404, `No mock route for ${method.toUpperCase()} ${path}`);
}

/**
 * Axios adapter that answers REST calls from an in-memory store. The app talks to it
 * through the same Axios client it would use for a real backend, so switching to a real
 * API means removing this adapter and setting a base URL.
 */
export const mockAdapter: AxiosAdapter = async (axiosConfig: InternalAxiosRequestConfig) => {
  // Decide up front, so a request already in flight cannot use up a failure meant for the next one.
  const shouldFail = failNext;
  if (shouldFail) mockServer.setFailNext(false);

  await wait(randomLatency());

  const method = (axiosConfig.method ?? 'get').toLowerCase();
  const url = new URL(axiosConfig.url ?? '/', 'http://mock.local');
  const query = new URLSearchParams(url.search);
  Object.entries(axiosConfig.params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) query.set(key, String(value));
  });

  const respond = (status: number, data: unknown): AxiosResponse => ({
    status,
    statusText: String(status),
    data,
    headers: {},
    config: axiosConfig,
  });

  if (shouldFail) {
    const response = respond(503, { message: 'Simulated server failure' });
    throw new AxiosError(
      'Simulated server failure',
      AxiosError.ERR_BAD_RESPONSE,
      axiosConfig,
      null,
      response,
    );
  }

  try {
    const result = route(method, url.pathname, query, axiosConfig.data);
    return respond(result.status, result.data);
  } catch (error) {
    if (error instanceof HttpError) {
      const response = respond(error.status, { message: error.message });
      throw new AxiosError(
        error.message,
        error.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
        axiosConfig,
        null,
        response,
      );
    }
    throw error;
  }
};
