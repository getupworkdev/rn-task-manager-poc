import { apiClient } from './client';
import type { Task, TaskInput, TaskListParams, TaskPage, TaskPatch } from './types';

export const tasksApi = {
  async list(params: TaskListParams = {}): Promise<TaskPage> {
    const { data } = await apiClient.get<TaskPage>('/tasks', { params });
    return data;
  },
  async get(id: string): Promise<Task> {
    const { data } = await apiClient.get<Task>(`/tasks/${encodeURIComponent(id)}`);
    return data;
  },
  async create(input: TaskInput): Promise<Task> {
    const { data } = await apiClient.post<Task>('/tasks', input);
    return data;
  },
  async update(id: string, patch: TaskPatch): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`/tasks/${encodeURIComponent(id)}`, patch);
    return data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${encodeURIComponent(id)}`);
  },
};
