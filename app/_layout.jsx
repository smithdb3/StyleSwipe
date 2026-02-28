import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <SafeAreaProvider>
        <AuthProvider>
        <ErrorBoundary>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' },
            animation: 'slide_from_right',
          }}
        />
        </ErrorBoundary>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
