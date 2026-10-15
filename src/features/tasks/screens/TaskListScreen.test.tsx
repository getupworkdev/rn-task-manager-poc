import { fireEvent, render, screen } from '@testing-library/react-native';

import { mockServer } from '../../../mocks/mockServer';
import type { ScreenProps } from '../../../navigation/types';
import { createWrapper, resetMockServer } from '../../../test-utils';
import { TaskListScreen } from './TaskListScreen';

function makeNavigation() {
  return {
    navigate: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => () => undefined),
  } as unknown as ScreenProps<'Tasks'>['navigation'];
}

async function renderScreen() {
  const { Wrapper } = createWrapper();
  const navigation = makeNavigation();
  const route = { key: 'Tasks', name: 'Tasks' } as ScreenProps<'Tasks'>['route'];
  await render(
    <Wrapper>
      <TaskListScreen navigation={navigation} route={route} />
    </Wrapper>,
  );
  return navigation;
}

beforeEach(() => resetMockServer());

describe('TaskListScreen', () => {
  it('shows skeletons while loading, then the tasks', async () => {
    await renderScreen();
    expect(screen.getByTestId('task-list-skeleton')).toBeTruthy();
    expect(await screen.findByText('Prepare sprint demo')).toBeTruthy();
    expect(screen.queryByTestId('task-list-skeleton')).toBeNull();
  });

  it('shows the empty state when there are no tasks', async () => {
    resetMockServer([]);
    await renderScreen();
    expect(await screen.findByText('No tasks yet')).toBeTruthy();
  });

  it('shows an error with a retry button that recovers', async () => {
    mockServer.setFailNext(true);
    await renderScreen();
    expect(await screen.findByText("Couldn't load tasks")).toBeTruthy();
    expect(screen.getByText('Simulated server failure')).toBeTruthy();

    fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('Prepare sprint demo')).toBeTruthy();
  });

  it('filters by status', async () => {
    await renderScreen();
    await screen.findByText('Prepare sprint demo');

    fireEvent.press(screen.getByTestId('filter-done'));
    expect(await screen.findByText('Archive old project files')).toBeTruthy();
    expect(screen.queryByText('Prepare sprint demo')).toBeNull();
  });

  it('opens a task when its row is pressed', async () => {
    const navigation = await renderScreen();
    fireEvent.press(await screen.findByTestId('task-row-t001'));
    expect(navigation.navigate).toHaveBeenCalledWith('TaskDetail', { id: 't001' });
  });
});
