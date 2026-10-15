import { z } from 'zod';

import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskInput } from '../../api/types';

function isRealDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(80, 'Title must be 80 characters or fewer'),
  description: z.string().max(500, 'Description must be 500 characters or fewer'),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use the format YYYY-MM-DD')
    .refine(
      (v) => v === '' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || isRealDate(v),
      'That date does not exist',
    ),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const emptyTaskForm: TaskFormValues = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

export function taskToForm(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? '',
  };
}

export function formToInput(values: TaskFormValues): TaskInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate.trim() === '' ? null : values.dueDate.trim(),
  };
}
