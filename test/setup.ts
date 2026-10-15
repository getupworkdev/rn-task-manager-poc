import 'react-native-gesture-handler/jestSetup';

// FlashList needs real layout measurements; in tests a FlatList renders the same items.
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = jest.requireActual('react-native');
  return { ...jest.requireActual('@shopify/flash-list'), FlashList: FlatList };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
