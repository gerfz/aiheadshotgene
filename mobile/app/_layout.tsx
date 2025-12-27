import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../src/store/useAppStore';
import { supabase } from '../src/services/supabase';
import { initializePurchases, loginUser } from '../src/services/purchases';
import { getHardwareDeviceId } from '../src/services/deviceId';
import { getCredits } from '../src/services/api';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Toast } from '../src/components';

const FIRST_TIME_KEY = 'has_seen_welcome';

export default function RootLayout() {
  const { setUser, setIsLoading } = useAppStore();
  const [initializing, setInitializing] = useState(true);
  const [showVerificationToast, setShowVerificationToast] = useState(false);

  useEffect(() => {
    let isInitializing = true; // Flag to prevent duplicate user creation
    
    const initApp = async () => {
      try {
        // Get device ID
        const deviceId = await getHardwareDeviceId();
        console.log('📱 Device ID:', deviceId);
        
        // Check for existing auth session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User already has an anonymous session
          console.log('✅ Existing anonymous user:', session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email || `device-${deviceId}@anonymous.local`,
          });
          await initializePurchases(session.user.id);
          await loginUser(session.user.id);
        } else {
          // No session - create anonymous user
          console.log('🔄 Creating anonymous user for device:', deviceId);
          
          const { data, error } = await supabase.auth.signInAnonymously({
            options: {
              data: {
                device_id: deviceId,
                is_anonymous: true,
              }
            }
          });
          
          if (error) {
            console.error('❌ Failed to create anonymous user:', error);
            throw error;
          }
          
          if (data.user) {
            console.log('✅ Anonymous user created:', data.user.id);
            setUser({
              id: data.user.id,
              email: `device-${deviceId}@anonymous.local`,
            });
            await initializePurchases(data.user.id);
            await loginUser(data.user.id);
          }
        }
      } catch (error) {
        console.error('❌ App initialization error:', error);
      } finally {
        isInitializing = false;
        setInitializing(false);
        setIsLoading(false);
      }
    };

    initApp();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        // Skip INITIAL_SESSION event during app initialization
        if (event === 'INITIAL_SESSION' && isInitializing) {
          console.log('⏭️ Skipping INITIAL_SESSION during initialization');
          return;
        }
        
        if (session?.user) {
          // User session exists (anonymous or authenticated)
          const deviceId = await getHardwareDeviceId();
          setUser({
            id: session.user.id,
            email: session.user.email || `device-${deviceId}@anonymous.local`,
          });
          
          try {
            await loginUser(session.user.id);
            
            // Refresh credits
            const creditsData = await getCredits();
            useAppStore.setState({ credits: creditsData });
            console.log('✅ Credits refreshed:', creditsData);
          } catch (error) {
            console.error('❌ Error during auth state change:', error);
          }
        } else if (!isInitializing) {
          // Session expired - recreate anonymous user (only if not initializing)
          console.log('⚠️ Session expired, recreating anonymous user');
          try {
            const deviceId = await getHardwareDeviceId();
            const { data, error } = await supabase.auth.signInAnonymously({
              options: {
                data: {
                  device_id: deviceId,
                  is_anonymous: true,
                }
              }
            });
            
            if (data?.user) {
              setUser({
                id: data.user.id,
                email: `device-${deviceId}@anonymous.local`,
              });
              await loginUser(data.user.id);
            }
          } catch (error) {
            console.error('❌ Failed to recreate anonymous user:', error);
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
