import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeStore } from '../src/store/theme';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  const { colors } = useThemeStore();

  return (
    <SafeAreaProvider>
      <ErrorBoundary label="VoiceNav">
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
