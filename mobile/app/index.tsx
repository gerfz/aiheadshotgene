import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../src/store/useAppStore';

const FIRST_TIME_KEY = 'has_seen_welcome';

export default function Index() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstTime = async () => {
      const seen = await SecureStore.getItemAsync(FIRST_TIME_KEY);
      setHasSeenWelcome(seen === 'true');
    };
    checkFirstTime();
  }, []);

  // Wait for the check to complete
  if (hasSeenWelcome === null) {
    return null; // or a loading screen
  }

  // First time user - show welcome
  if (!hasSeenWelcome) {
    return <Redirect href="/welcome" />;
  }

  // Returning user - go to home
  return <Redirect href="/home" />;
}
