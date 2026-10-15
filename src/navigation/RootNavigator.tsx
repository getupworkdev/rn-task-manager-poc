import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type LinkingOptions,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { SettingsScreen } from '../features/settings/SettingsScreen';
import { CreateTaskScreen } from '../features/tasks/screens/CreateTaskScreen';
import { TaskDetailScreen } from '../features/tasks/screens/TaskDetailScreen';
import { TaskListScreen } from '../features/tasks/screens/TaskListScreen';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['rntaskmanager://'],
  config: {
    screens: {
      Tasks: '',
      TaskDetail: 'tasks/:id',
      CreateTask: 'new',
      Settings: 'settings',
    },
  },
};

export function RootNavigator() {
  const theme = useTheme();

  const navTheme = useMemo<NavTheme>(() => {
    const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    };
  }, [theme]);

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator>
        <Stack.Screen name="Tasks" component={TaskListScreen} options={{ title: 'Tasks' }} />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task' }} />
        <Stack.Screen
          name="CreateTask"
          component={CreateTaskScreen}
          options={{ title: 'New task', presentation: 'modal' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
