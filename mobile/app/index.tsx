import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';

export default function Index() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);

  // Both authenticated users and guests go to home
  // Guests can use the app with limited free credits
  if (isAuthenticated || isGuest) {
    return <Redirect href="/home" />;
  }

  // Fallback to home (guest mode will be initialized in _layout)
  return <Redirect href="/home" />;
}
