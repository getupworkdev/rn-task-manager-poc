import { mockServer } from '../mocks/mockServer';
import { resetMockServer } from '../test-utils';
import { ApiError } from './client';
import { tasksApi } from './tasks';

beforeEach(() => resetMockServer());

describe('tasksApi', () => {
  it('returns the first page with a pointer to the next one', async () => {
    const page = await tasksApi.list({ limit: 15 });
    expect(page.items).toHaveLength(15);
    expect(page.total).toBe(40);
    expect(page.nextPage).toBe(2);
  });

  it('returns the last page without a next page', async () => {
    const page = await tasksApi.list({ limit: 15, page: 3 });
    expect(page.items).toHaveLength(10);
    expect(page.nextPage).toBeNull();
  });

  it('filters by status', async () => {
    const page = await tasksApi.list({ status: 'done', limit: 50 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((t) => t.status === 'done')).toBe(true);
    expect(page.total).toBe(page.items.length);
  });

  it('sorts by due date with undated tasks last', async () => {
    const { items } = await tasksApi.list({ sort: 'dueDate', limit: 50 });
    const dates = items.map((t) => t.dueDate);
    const dated = dates.filter((d): d is string => d !== null);
    expect(dated).toEqual([...dated].sort());
    expect(dates.slice(dated.length).every((d) => d === null)).toBe(true);
  });

  it('sorts by priority, high first', async () => {
    const { items } = await tasksApi.list({ sort: 'priority', limit: 50 });
    const rank = { high: 0, medium: 1, low: 2 };
    const ranks = items.map((t) => rank[t.priority]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('creates, reads, updates and deletes a task', async () => {
    const created = await tasksApi.create({
      title: 'Ship the POC',
      description: '',
      status: 'todo',
      priority: 'high',
      dueDate: '2026-10-20',
    });
    expect(created.id).toBeTruthy();
    expect(await tasksApi.get(created.id)).toMatchObject({ title: 'Ship the POC' });

    const updated = await tasksApi.update(created.id, { status: 'done' });
    expect(updated.status).toBe('done');

    await tasksApi.remove(created.id);
    await expect(tasksApi.get(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it('rejects an invalid task with a 422 ApiError', async () => {
    const error = await tasksApi
      .create({ title: ' ', description: '', status: 'todo', priority: 'low', dueDate: null })
      .catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toBe('Title is required');
  });

  it('fails the next request when failure simulation is on, then recovers', async () => {
    mockServer.setFailNext(true);
    await expect(tasksApi.list()).rejects.toMatchObject({
      status: 503,
      message: 'Simulated server failure',
    });
    expect(mockServer.getFailNext()).toBe(false);
    await expect(tasksApi.list()).resolves.toMatchObject({ page: 1 });
  });
});
