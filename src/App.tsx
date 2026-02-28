import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useStore } from './store/index';
import { AppNavigator } from './navigation/AppNavigator';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const profile = useStore(s => s.profile);
  const loadProfile = useStore(s => s.loadProfile);
  const loadSavedItems = useStore(s => s.loadSavedItems);

  useEffect(() => {
    async function prepare() {
      try {
        // Load user profile from storage
        await loadProfile();
        await loadSavedItems();
      } catch (e) {
        console.error('Failed to load app data:', e);
      } finally {
        // Hide splash screen after loading
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Show nothing until profile is loaded
  if (!profile) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}
