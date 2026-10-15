import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SORT_LABELS, type TaskSort } from '../../../api/types';
import { useTheme } from '../../../theme/ThemeProvider';

const OPTIONS: TaskSort[] = ['dueDate', 'priority', 'createdAt'];

export function SortMenu({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: TaskSort;
  onSelect: (sort: TaskSort) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close sort menu"
        accessibilityRole="button"
      >
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.space.sm,
            },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.font.sm,
              fontWeight: '600',
              padding: theme.space.md,
            }}
          >
            Sort by
          </Text>
          {OPTIONS.map((option) => {
            const selected = option === value;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`Sort by ${SORT_LABELS[option]}`}
                testID={`sort-${option}`}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
                    borderRadius: theme.radius.md,
                    padding: theme.space.md,
                  },
                ]}
              >
                <Text style={{ color: theme.colors.text, fontSize: theme.font.md }}>
                  {SORT_LABELS[option]}
                </Text>
                {selected ? (
                  <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>✓</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 32,
  },
  sheet: { alignSelf: 'center', width: '100%', maxWidth: 360 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
