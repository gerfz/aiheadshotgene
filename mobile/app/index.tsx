import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../src/store/useAppStore';

const FIRST_TIME_KEY = 'has_seen_welcome';
const SHOW_SUBSCRIPTION_KEY = 'show_subscription_after_onboarding';

export default function Index() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [shouldShowSubscription, setShouldShowSubscription] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstTime = async () => {
      const seen = await SecureStore.getItemAsync(FIRST_TIME_KEY);
      const showSub = await SecureStore.getItemAsync(SHOW_SUBSCRIPTION_KEY);
      setHasSeenWelcome(seen === 'true');
      setShouldShowSubscription(showSub === 'true');
    };
    checkFirstTime();
  }, []);

  // Wait for the check to complete
  if (hasSeenWelcome === null || shouldShowSubscription === null) {
    return null; // or a loading screen
  }

  // First time user - show welcome
  if (!hasSeenWelcome) {
    return <Redirect href="/welcome" />;
  }

  // User completed onboarding - go directly to upload for first photo
  // (paywall will be shown after they generate their first photo)
  if (shouldShowSubscription) {
    return <Redirect href="/upload" />;
  }

  // Returning user - go to home
  return <Redirect href="/home" />;
}
