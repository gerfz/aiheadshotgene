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
    let initTimeout: NodeJS.Timeout;
    
    const initApp = async () => {
      try {
        // Get device ID
        const deviceId = await getHardwareDeviceId();
        console.log('📱 Device ID:', deviceId);
        
        // Check for existing auth session
        let session = null;
        try {
          const { data: { session: existingSession }, error } = await supabase.auth.getSession();
          
          // If there's an error getting session (e.g., invalid refresh token), clear it
          if (error) {
            console.warn('⚠️ Error getting session, clearing:', error.message);
            await supabase.auth.signOut();
            session = null;
          } else {
            session = existingSession;
          }
        } catch (sessionError) {
          console.warn('⚠️ Session error, clearing:', sessionError);
          await supabase.auth.signOut();
          session = null;
        }
        
        if (session?.user) {
          // User already has an anonymous session
          console.log('✅ Existing anonymous user:', session.user.id);
          
          // Verify the session is still valid by trying to get user
          try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
              // Session is invalid, sign out and create new anonymous user
              console.warn('⚠️ Invalid session detected, creating new anonymous user');
              await supabase.auth.signOut();
              
              // Create new anonymous user
              const { data: newData, error: newError } = await supabase.auth.signInAnonymously({
                options: {
                  data: {
                    device_id: deviceId,
                    is_anonymous: true,
                  }
                }
              });
              
              if (newError || !newData.user) {
                throw new Error('Failed to create new anonymous user');
              }
              
              setUser({
                id: newData.user.id,
                email: `device-${deviceId}@anonymous.local`,
              });
              
              // Initialize with new user
              try {
                await Promise.race([
                  Promise.all([
                    initializePurchases(newData.user.id),
                    loginUser(newData.user.id)
                  ]),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Initialization timeout')), 8000)
                  )
                ]);
              } catch (timeoutError) {
                console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
              }
              
              return; // Exit early
            }
          } catch (verifyError) {
            console.error('❌ Error verifying session:', verifyError);
          }
          
          setUser({
            id: session.user.id,
            email: session.user.email || `device-${deviceId}@anonymous.local`,
          });
          
          // Initialize purchases and login with timeout
          try {
            await Promise.race([
              Promise.all([
                initializePurchases(session.user.id),
                loginUser(session.user.id)
              ]),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Initialization timeout')), 8000)
              )
            ]);
          } catch (timeoutError) {
            console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
            // Continue even if backend is slow/sleeping
          }
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
            
            // Initialize purchases and login with timeout
            try {
              await Promise.race([
                Promise.all([
                  initializePurchases(data.user.id),
                  loginUser(data.user.id)
                ]),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Initialization timeout')), 8000)
                )
              ]);
            } catch (timeoutError) {
              console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
              // Continue even if backend is slow/sleeping
            }
          }
        }
      } catch (error) {
        console.error('❌ App initialization error:', error);
      } finally {
        isInitializing = false;
        clearTimeout(initTimeout);
        setInitializing(false);
        setIsLoading(false);
      }
    };

    // Set a maximum timeout for the entire initialization
    initTimeout = setTimeout(() => {
      console.warn('⚠️ Maximum initialization time exceeded, forcing continue');
      isInitializing = false;
      setInitializing(false);
      setIsLoading(false);
    }, 10000); // 10 second max

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
      if (initTimeout) clearTimeout(initTimeout);
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
