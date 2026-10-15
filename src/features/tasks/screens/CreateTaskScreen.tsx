import { useEffect, useRef } from 'react';

import type { ScreenProps } from '../../../navigation/types';
import { confirm } from '../../../utils/confirm';
import { TaskForm } from '../components/TaskForm';
import { useCreateTask } from '../hooks';
import { emptyTaskForm, formToInput } from '../schema';

export function CreateTaskScreen({ navigation }: ScreenProps<'CreateTask'>) {
  const create = useCreateTask();
  const dirty = useRef(false);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!dirty.current) return;
        event.preventDefault();
        confirm('Discard new task?', 'What you typed will be lost.', 'Discard').then((ok) => {
          if (ok) navigation.dispatch(event.data.action);
        });
      }),
    [navigation],
  );

  return (
    <TaskForm
      defaultValues={emptyTaskForm}
      submitLabel="Create task"
      onDirtyChange={(value) => {
        dirty.current = value;
      }}
      onCancel={() => navigation.goBack()}
      onSubmit={(values) => {
        // Close straight away: the task already shows in the list while the request runs.
        dirty.current = false;
        create.mutate(formToInput(values));
        navigation.goBack();
      }}
    />
  );
}
