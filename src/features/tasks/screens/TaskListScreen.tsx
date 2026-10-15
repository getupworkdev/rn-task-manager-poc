import { FlashList } from '@shopify/flash-list';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SORT_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskSort,
  type TaskStatus,
} from '../../../api/types';
import { Chip, MessageState } from '../../../components/ui';
import type { ScreenProps } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { SortMenu } from '../components/SortMenu';
import { TaskListSkeleton } from '../components/TaskListSkeleton';
import { TaskRow } from '../components/TaskRow';
import { useDeleteTaskWithUndo, useTaskList, useUpdateTask } from '../hooks';

export function TaskListScreen({ navigation }: ScreenProps<'Tasks'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<TaskStatus | undefined>(undefined);
  const [sort, setSort] = useState<TaskSort>('dueDate');
  const [sortOpen, setSortOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filters = useMemo(() => ({ status, sort }), [status, sort]);
  const list = useTaskList(filters);
  const update = useUpdateTask();
  const { remove } = useDeleteTaskWithUndo();

  const tasks = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const total = list.data?.pages[0]?.total ?? 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sort, currently ${SORT_LABELS[sort]}`}
            hitSlop={10}
            onPress={() => setSortOpen(true)}
            testID="open-sort"
          >
            <Text style={{ color: theme.colors.primary, fontSize: theme.font.md }}>Sort</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={10}
            onPress={() => navigation.navigate('Settings')}
            testID="open-settings"
          >
            <Text style={{ color: theme.colors.primary, fontSize: theme.font.md }}>Settings</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, sort, theme]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await list.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [list]);

  const onOpen = useCallback(
    (task: Task) => navigation.navigate('TaskDetail', { id: task.id }),
    [navigation],
  );
  const onToggleDone = useCallback(
    (task: Task) =>
      update.mutate({ id: task.id, patch: { status: task.status === 'done' ? 'todo' : 'done' } }),
    [update],
  );

  let content;
  if (list.isPending) {
    content = <TaskListSkeleton />;
  } else if (list.isError && tasks.length === 0) {
    content = (
      <MessageState
        testID="task-list-error"
        title="Couldn't load tasks"
        body={list.error instanceof Error ? list.error.message : 'Something went wrong.'}
        action={{ label: 'Try again', onPress: () => list.refetch() }}
      />
    );
  } else {
    content = (
      <FlashList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskRow task={item} onOpen={onOpen} onToggleDone={onToggleDone} onDelete={remove} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        ListEmptyComponent={
          <MessageState
            testID="task-list-empty"
            title={status ? `No ${STATUS_LABELS[status].toLowerCase()} tasks` : 'No tasks yet'}
            body={
              status ? 'Try another filter, or add a task.' : 'Add your first task to get started.'
            }
            action={{ label: 'Add task', onPress: () => navigation.navigate('CreateTask') }}
          />
        }
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <ActivityIndicator
              style={{ margin: theme.space.lg }}
              color={theme.colors.primary}
              accessibilityLabel="Loading more tasks"
            />
          ) : list.isFetchNextPageError ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => list.fetchNextPage()}
              style={{ padding: theme.space.lg, alignItems: 'center' }}
            >
              <Text style={{ color: theme.colors.danger }}>
                Couldn&apos;t load more. Tap to retry.
              </Text>
            </Pressable>
          ) : tasks.length > 0 && !list.hasNextPage ? (
            <Text
              style={{
                color: theme.colors.textMuted,
                textAlign: 'center',
                padding: theme.space.lg,
                fontSize: theme.font.xs,
              }}
            >
              {total} {total === 1 ? 'task' : 'tasks'} · swipe left on a task to delete it
            </Text>
          ) : null
        }
        testID="task-list"
      />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        accessibilityLabel="Filter by status"
        style={[styles.filters, { borderBottomColor: theme.colors.border }]}
        contentContainerStyle={{ gap: theme.space.sm, padding: theme.space.md }}
      >
        <Chip
          label="All"
          accessibilityLabel="Show all tasks"
          selected={!status}
          onPress={() => setStatus(undefined)}
          testID="filter-all"
        />
        {TASK_STATUSES.map((s) => (
          <Chip
            key={s}
            label={STATUS_LABELS[s]}
            accessibilityLabel={`Show ${STATUS_LABELS[s]} tasks`}
            selected={status === s}
            onPress={() => setStatus(s)}
            testID={`filter-${s}`}
          />
        ))}
      </ScrollView>

      <View style={styles.flex}>{content}</View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add task"
        onPress={() => navigation.navigate('CreateTask')}
        testID="add-task"
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: insets.bottom + theme.space.lg,
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: theme.font.md, fontWeight: '700' }}>
          + New task
        </Text>
      </Pressable>

      <SortMenu
        visible={sortOpen}
        value={sort}
        onSelect={setSort}
        onClose={() => setSortOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: { flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  headerActions: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    paddingRight: Platform.OS === 'web' ? 12 : 0,
  },
  fab: {
    position: 'absolute',
    right: 20,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
