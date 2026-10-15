import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '../../../api/types';
import { Button, Chip } from '../../../components/ui';
import { useTheme } from '../../../theme/ThemeProvider';
import { addDaysIso, todayIso } from '../../../utils/dates';
import { taskFormSchema, type TaskFormValues } from '../schema';

type Props = {
  defaultValues: TaskFormValues;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => void;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  header?: ReactNode;
  footer?: ReactNode;
};

export function TaskForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  onDirtyChange,
  header,
  footer,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const inputStyle = [
    styles.input,
    {
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      fontSize: theme.font.md,
      paddingHorizontal: theme.space.md,
    },
  ];

  const label = (text: string, nativeID: string) => (
    <Text
      nativeID={nativeID}
      style={[styles.label, { color: theme.colors.textMuted, fontSize: theme.font.sm }]}
    >
      {text}
    </Text>
  );

  const error = (message: string | undefined, id: string) =>
    message ? (
      <Text
        accessibilityLiveRegion="polite"
        testID={`error-${id}`}
        style={{ color: theme.colors.danger, fontSize: theme.font.xs, marginTop: 4 }}
      >
        {message}
      </Text>
    ) : null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          padding: theme.space.lg,
          paddingBottom: insets.bottom + theme.space.xl * 3,
          gap: theme.space.lg,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {header}

        <View>
          {label('Title', 'label-title')}
          <Controller
            control={control}
            name="title"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                accessibilityLabel="Title"
                accessibilityLabelledBy="label-title"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="What needs doing?"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="next"
                maxLength={120}
                testID="input-title"
                style={[inputStyle, errors.title && { borderColor: theme.colors.danger }]}
              />
            )}
          />
          {error(errors.title?.message, 'title')}
        </View>

        <View>
          {label('Description', 'label-description')}
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                accessibilityLabel="Description"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Optional notes"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                textAlignVertical="top"
                testID="input-description"
                style={[inputStyle, styles.multiline]}
              />
            )}
          />
          {error(errors.description?.message, 'description')}
        </View>

        <View>
          {label('Status', 'label-status')}
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <View accessibilityRole="radiogroup" style={styles.chips}>
                {TASK_STATUSES.map((status) => (
                  <Chip
                    key={status}
                    label={STATUS_LABELS[status]}
                    accessibilityLabel={`Status ${STATUS_LABELS[status]}`}
                    selected={value === status}
                    onPress={() => onChange(status)}
                    testID={`status-${status}`}
                  />
                ))}
              </View>
            )}
          />
        </View>

        <View>
          {label('Priority', 'label-priority')}
          <Controller
            control={control}
            name="priority"
            render={({ field: { value, onChange } }) => (
              <View accessibilityRole="radiogroup" style={styles.chips}>
                {TASK_PRIORITIES.map((priority) => (
                  <Chip
                    key={priority}
                    label={PRIORITY_LABELS[priority]}
                    accessibilityLabel={`Priority ${PRIORITY_LABELS[priority]}`}
                    selected={value === priority}
                    onPress={() => onChange(priority)}
                    testID={`priority-${priority}`}
                  />
                ))}
              </View>
            )}
          />
        </View>

        <View>
          {label('Due date', 'label-due')}
          <Controller
            control={control}
            name="dueDate"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                accessibilityLabel="Due date, format year month day"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                testID="input-due"
                style={[inputStyle, errors.dueDate && { borderColor: theme.colors.danger }]}
              />
            )}
          />
          {error(errors.dueDate?.message, 'dueDate')}
          <View style={[styles.chips, { marginTop: theme.space.sm }]}>
            {[
              { label: 'Today', value: todayIso() },
              { label: 'Tomorrow', value: addDaysIso(1) },
              { label: 'Next week', value: addDaysIso(7) },
              { label: 'No date', value: '' },
            ].map((option) => (
              <Chip
                key={option.label}
                label={option.label}
                accessibilityLabel={`Set due date to ${option.label}`}
                selected={false}
                onPress={() =>
                  setValue('dueDate', option.value, { shouldDirty: true, shouldValidate: true })
                }
              />
            ))}
          </View>
        </View>

        <View style={[styles.actions, { gap: theme.space.md }]}>
          {onCancel ? (
            <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.flex} />
          ) : null}
          <Button
            label={submitLabel}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            testID="submit-task"
            style={styles.flex}
          />
        </View>

        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, minHeight: 46, paddingVertical: 10 },
  multiline: { minHeight: 96 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row' },
});
