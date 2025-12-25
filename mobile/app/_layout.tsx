import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppStore } from '../src/store/useAppStore';
import { supabase } from '../src/services/supabase';
import { initializePurchases, loginUser } from '../src/services/purchases';
import { getOrCreateGuestId } from '../src/services/guestStorage';
import { getCredits } from '../src/services/api';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Toast } from '../src/components';

export default function RootLayout() {
  const { setUser, setGuestId, setIsLoading } = useAppStore();
  const [initializing, setInitializing] = useState(true);
  const [showVerificationToast, setShowVerificationToast] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize purchases
        await initializePurchases();
        
        // Check for existing auth session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is authenticated
          setUser({
            id: session.user.id,
            email: session.user.email!,
          });
          setGuestId(null); // Clear guest state when authenticated
          await loginUser(session.user.id);
        } else {
          // No auth session - initialize as guest
          const guestId = await getOrCreateGuestId();
          setGuestId(guestId);
          setUser(null);
        }
      } catch (error) {
        console.error('App initialization error:', error);
        // Even on error, try to set up guest mode
        try {
          const guestId = await getOrCreateGuestId();
          setGuestId(guestId);
        } catch (guestError) {
          console.error('Failed to initialize guest mode:', guestError);
        }
      } finally {
        setInitializing(false);
        setIsLoading(false);
      }
    };

    initApp();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          // User logged in or session refreshed
          setUser({
            id: session.user.id,
            email: session.user.email!,
          });
          setGuestId(null); // Clear guest state
          
          try {
            await loginUser(session.user.id);
            
            // Get previous verification status
            const previousCredits = useAppStore.getState().credits;
            const wasVerified = previousCredits?.emailVerified || false;
            
            // Refresh credits to get latest verification status
            // This is especially important after email verification
            const creditsData = await getCredits();
            useAppStore.setState({ credits: creditsData });
            console.log('Credits refreshed after auth change:', creditsData);
            
            // Show toast if email was just verified
            if (!wasVerified && creditsData.emailVerified) {
              setShowVerificationToast(true);
            }
          } catch (error) {
            console.error('Error during auth state change:', error);
          }
        } else {
          // User logged out - restore guest mode
          setUser(null);
          try {
            const guestId = await getOrCreateGuestId();
            setGuestId(guestId);
          } catch (error) {
            console.error('Failed to restore guest mode:', error);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <ActivityIndicator color="#6366F1" />
        </View>
      </>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Toast
        message="🎉 3 Free Credits Added!"
        visible={showVerificationToast}
        onHide={() => setShowVerificationToast(false)}
        duration={2000}
        icon="gift"
      />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 600 },
          contentStyle: { backgroundColor: '#0F172A' },
        }}
      />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
