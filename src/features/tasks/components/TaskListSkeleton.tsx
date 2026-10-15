import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '../../../components/ui';
import { useTheme } from '../../../theme/ThemeProvider';

export function TaskListSkeleton({ rows = 7 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel="Loading tasks"
      accessibilityRole="progressbar"
      testID="task-list-skeleton"
    >
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
              padding: theme.space.lg,
            },
          ]}
        >
          <SkeletonBlock width={24} height={24} />
          <View style={styles.lines}>
            <SkeletonBlock width={i % 2 ? '70%' : '55%'} height={14} />
            <SkeletonBlock width="35%" height={10} />
          </View>
          <SkeletonBlock width={52} height={18} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lines: { flex: 1, gap: 8 },
});
