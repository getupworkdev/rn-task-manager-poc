import { useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Chip } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { mockServer } from '../../mocks/mockServer';
import { useThemeContext, type ThemePreference } from '../../theme/ThemeProvider';
import { taskKeys } from '../tasks/queryKeys';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function useSimulateFailure() {
  const value = useSyncExternalStore(
    mockServer.subscribeFailNext,
    mockServer.getFailNext,
    mockServer.getFailNext,
  );
  return [value, (next: boolean) => mockServer.setFailNext(next)] as const;
}

export function SettingsScreen() {
  const { theme, preference, setPreference } = useThemeContext();
  const [failNext, setFailNext] = useSimulateFailure();
  const qc = useQueryClient();
  const toast = useToast();

  const heading = (text: string) => (
    <Text
      accessibilityRole="header"
      style={{
        color: theme.colors.textMuted,
        fontSize: theme.font.sm,
        fontWeight: '700',
        marginBottom: theme.space.sm,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </Text>
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.lg }}
    >
      <Card>
        {heading('Mock API')}
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.md, fontWeight: '600' }}>
              Simulate API failure
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.sm, marginTop: 4 }}>
              The next request returns a 503, then this switches itself off. Use it to see an
              optimistic change roll back.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Simulate API failure on the next request"
            value={failNext}
            onValueChange={setFailNext}
            testID="simulate-failure"
            trackColor={{ true: theme.colors.danger, false: theme.colors.border }}
          />
        </View>
        <Button
          label="Reset demo data"
          variant="secondary"
          style={{ marginTop: theme.space.lg }}
          onPress={() => {
            mockServer.reset();
            qc.invalidateQueries({ queryKey: taskKeys.all });
            toast.show({ message: 'Demo data reset' });
          }}
        />
      </Card>

      <Card>
        {heading('Appearance')}
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {THEME_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              accessibilityLabel={`${option.label} theme`}
              selected={preference === option.value}
              onPress={() => setPreference(option.value)}
              testID={`theme-${option.value}`}
            />
          ))}
        </View>
      </Card>

      <Card>
        {heading('About')}
        <Text style={{ color: theme.colors.text, fontSize: theme.font.sm, lineHeight: 20 }}>
          Demo project with a mock API. Tasks live in memory inside the app and reset when it
          restarts. Requests go through a real Axios client with 300–800 ms of simulated latency, so
          switching to a real backend means swapping one adapter.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
