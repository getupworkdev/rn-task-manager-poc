import { emptyTaskForm, formToInput, taskFormSchema } from './schema';

function errorsFor(values: Partial<typeof emptyTaskForm>) {
  const result = taskFormSchema.safeParse({ ...emptyTaskForm, ...values });
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
}

describe('taskFormSchema', () => {
  it('accepts a valid task', () => {
    expect(errorsFor({ title: 'Write tests', dueDate: '2026-10-20' })).toEqual({});
  });

  it('requires a title of at least 3 characters, ignoring spaces', () => {
    expect(errorsFor({ title: '  ab  ' }).title).toBe('Title must be at least 3 characters');
  });

  it('limits the title to 80 characters', () => {
    expect(errorsFor({ title: 'x'.repeat(81) }).title).toBe('Title must be 80 characters or fewer');
  });

  it('allows an empty due date', () => {
    expect(errorsFor({ title: 'Valid', dueDate: '' })).toEqual({});
  });

  it('rejects a wrongly formatted due date', () => {
    expect(errorsFor({ title: 'Valid', dueDate: '20/10/2026' }).dueDate).toBe(
      'Use the format YYYY-MM-DD',
    );
  });

  it('rejects a date that does not exist', () => {
    expect(errorsFor({ title: 'Valid', dueDate: '2026-02-30' }).dueDate).toBe(
      'That date does not exist',
    );
  });

  it('maps form values to an API payload', () => {
    expect(
      formToInput({ ...emptyTaskForm, title: '  Trim me ', description: ' Notes ', dueDate: '' }),
    ).toEqual({
      title: 'Trim me',
      description: 'Notes',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
    });
  });
});
