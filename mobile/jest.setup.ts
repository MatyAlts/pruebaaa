import mockSafeArea from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeArea);
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('@expo/ui/community/datetime-picker', () => ({
  __esModule: true,
  default: jest.requireActual('react-native').View,
}));
