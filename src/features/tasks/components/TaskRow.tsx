import { memo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { PRIORITY_LABELS, STATUS_LABELS, type Task } from '../../../api/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { describeDue } from '../../../utils/dates';

type Props = {
  task: Task;
  onOpen: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onDelete: (task: Task) => void;
};

function TaskRowComponent({ task, onOpen, onToggleDone, onDelete }: Props) {
  const theme = useTheme();
  const swipeRef = useRef<Swipeable | null>(null);
  const due = describeDue(task.dueDate);
  const done = task.status === 'done';
  const pending = task.id.startsWith('temp-');

  const priorityColor =
    task.priority === 'high'
      ? theme.colors.danger
      : task.priority === 'medium'
        ? theme.colors.warning
        : theme.colors.textMuted;

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={60}
      overshootRight={false}
      renderRightActions={() => (
        <View style={[styles.deleteAction, { backgroundColor: theme.colors.danger }]}>
          <Text style={{ color: theme.colors.onDanger, fontWeight: '700' }}>Delete</Text>
        </View>
      )}
      onSwipeableOpen={() => {
        swipeRef.current?.close();
        onDelete(task);
      }}
    >
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingHorizontal: theme.space.lg,
            paddingVertical: theme.space.md,
            opacity: pending ? 0.6 : 1,
          },
        ]}
      >
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done, disabled: pending }}
          accessibilityLabel={
            done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`
          }
          disabled={pending}
          hitSlop={10}
          onPress={() => onToggleDone(task)}
          testID={`toggle-${task.id}`}
          style={[
            styles.check,
            {
              borderColor: done ? theme.colors.success : theme.colors.border,
              backgroundColor: done ? theme.colors.success : 'transparent',
            },
          ]}
        >
          {done ? <Text style={[styles.tick, { color: theme.colors.surface }]}>✓</Text> : null}
        </Pressable>

        <Pressable
          style={styles.body}
          accessibilityRole="button"
          accessibilityLabel={`${task.title}, ${STATUS_LABELS[task.status]}, ${PRIORITY_LABELS[task.priority]} priority, ${due.label}`}
          accessibilityHint="Opens task details. Swipe left or use the actions menu to delete."
          accessibilityActions={[{ name: 'delete', label: 'Delete task' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'delete') onDelete(task);
          }}
          disabled={pending}
          onPress={() => onOpen(task)}
          testID={`task-row-${task.id}`}
        >
          <Text
            numberOfLines={2}
            style={{
              color: theme.colors.text,
              fontSize: theme.font.md,
              fontWeight: '600',
              textDecorationLine: done ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </Text>
          <View style={[styles.meta, { marginTop: theme.space.xs, gap: theme.space.sm }]}>
            <Text
              style={{
                color: due.overdue && !done ? theme.colors.danger : theme.colors.textMuted,
                fontSize: theme.font.xs,
              }}
            >
              {due.label}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.xs }}>·</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.xs }}>
              {pending ? 'Saving…' : STATUS_LABELS[task.status]}
            </Text>
          </View>
        </Pressable>

        <View
          style={[styles.priority, { borderColor: priorityColor, borderRadius: theme.radius.pill }]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Text style={{ color: priorityColor, fontSize: theme.font.xs, fontWeight: '600' }}>
            {PRIORITY_LABELS[task.priority]}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

export const TaskRow = memo(TaskRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontSize: 14, fontWeight: '800', lineHeight: 16 },
  body: { flex: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  priority: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    flex: 1,
  },
});
