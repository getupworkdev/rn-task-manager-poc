import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIORITY_LABELS, STATUS_LABELS } from '../../../api/types';
import { Button, Card, MessageState, SkeletonBlock } from '../../../components/ui';
import type { ScreenProps } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { confirm } from '../../../utils/confirm';
import { describeDue } from '../../../utils/dates';
import { TaskForm } from '../components/TaskForm';
import { useDeleteTaskWithUndo, useTask, useUpdateTask } from '../hooks';
import { formToInput, taskToForm } from '../schema';

export function TaskDetailScreen({ navigation, route }: ScreenProps<'TaskDetail'>) {
  const { id } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const task = useTask(id);
  const update = useUpdateTask();
  const { remove } = useDeleteTaskWithUndo();
  const [editing, setEditing] = useState(false);
  const dirty = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editing ? 'Edit task' : 'Task',
      headerRight: () =>
        task.data && !editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit task"
            hitSlop={10}
            onPress={() => setEditing(true)}
            testID="edit-task"
            style={{ paddingRight: Platform.OS === 'web' ? 12 : 0 }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: theme.font.md }}>Edit</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, editing, task.data, theme]);

  // Unsaved edits survive the back button and swipe-back only if the user agrees.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!editing || !dirty.current) return;
        event.preventDefault();
        confirm('Discard changes?', 'Your edits to this task have not been saved.', 'Discard').then(
          (ok) => {
            if (ok) navigation.dispatch(event.data.action);
          },
        );
      }),
    [navigation, editing],
  );

  if (task.isPending) {
    return (
      <View
        style={[
          styles.flex,
          { backgroundColor: theme.colors.background, padding: theme.space.lg, gap: 12 },
        ]}
      >
        <SkeletonBlock width="70%" height={22} />
        <SkeletonBlock width="100%" height={80} />
        <SkeletonBlock width="40%" height={16} />
      </View>
    );
  }

  if (task.isError || !task.data) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <MessageState
          title="Couldn't load this task"
          body={task.error instanceof Error ? task.error.message : 'It may have been deleted.'}
          action={{ label: 'Try again', onPress: () => task.refetch() }}
        />
      </View>
    );
  }

  const data = task.data;

  if (editing) {
    return (
      <TaskForm
        key={data.updatedAt}
        defaultValues={taskToForm(data)}
        submitLabel="Save"
        onDirtyChange={(value) => {
          dirty.current = value;
        }}
        onCancel={() => {
          dirty.current = false;
          setEditing(false);
        }}
        onSubmit={(values) => {
          dirty.current = false;
          setEditing(false);
          update.mutate({ id: data.id, patch: formToInput(values) });
        }}
      />
    );
  }

  const due = describeDue(data.dueDate);
  const row = (labelText: string, value: string, color?: string) => (
    <View style={[styles.row, { paddingVertical: theme.space.sm }]} accessible>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.sm }}>{labelText}</Text>
      <Text
        style={{ color: color ?? theme.colors.text, fontSize: theme.font.md, fontWeight: '600' }}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: theme.space.lg,
        gap: theme.space.lg,
        paddingBottom: insets.bottom + theme.space.xl,
      }}
    >
      <Card>
        <Text
          accessibilityRole="header"
          testID="task-title"
          style={{ color: theme.colors.text, fontSize: theme.font.xl, fontWeight: '700' }}
        >
          {data.title}
        </Text>
        <Text
          style={{
            color: data.description ? theme.colors.text : theme.colors.textMuted,
            fontSize: theme.font.md,
            marginTop: theme.space.sm,
            lineHeight: 22,
          }}
        >
          {data.description || 'No description'}
        </Text>
      </Card>

      <Card>
        {row('Status', STATUS_LABELS[data.status])}
        {row('Priority', PRIORITY_LABELS[data.priority])}
        {row(
          'Due',
          due.label,
          due.overdue && data.status !== 'done' ? theme.colors.danger : undefined,
        )}
        {row('Last updated', new Date(data.updatedAt).toLocaleString())}
      </Card>

      <View style={{ gap: theme.space.md }}>
        <Button
          label={data.status === 'done' ? 'Mark as to do' : 'Mark as done'}
          onPress={() =>
            update.mutate({
              id: data.id,
              patch: { status: data.status === 'done' ? 'todo' : 'done' },
            })
          }
          testID="toggle-done"
        />
        <Button label="Edit" variant="secondary" onPress={() => setEditing(true)} />
        <Button
          label="Delete"
          variant="danger"
          accessibilityHint="Deletes the task. You can undo for a few seconds."
          onPress={() => {
            remove(data);
            navigation.goBack();
          }}
          testID="delete-task"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
});
