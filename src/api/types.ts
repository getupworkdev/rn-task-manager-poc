export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Calendar date as YYYY-MM-DD, or null when the task has no due date. */
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate'>;
export type TaskPatch = Partial<TaskInput>;

export type TaskSort = 'dueDate' | 'priority' | 'createdAt';

export type TaskListParams = {
  status?: TaskStatus;
  sort?: TaskSort;
  page?: number;
  limit?: number;
};

export type TaskPage = {
  items: Task[];
  page: number;
  limit: number;
  total: number;
  nextPage: number | null;
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const SORT_LABELS: Record<TaskSort, string> = {
  dueDate: 'Due date',
  priority: 'Priority',
  createdAt: 'Newest',
};
