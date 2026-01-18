import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../src/store/useAppStore';
import { supabase } from '../src/services/supabase';
import { initializePurchases, loginUser, syncSubscriptionStatus, addCustomerInfoListener } from '../src/services/purchases';
import { getHardwareDeviceId } from '../src/services/deviceId';
import { getCredits, updateSubscriptionStatus, waitForBackendReady } from '../src/services/api';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Toast, LoadingScreen } from '../src/components';
import { posthog, identifyUser, analytics } from '../src/services/posthog';
import { clearCache } from '../src/services/cache';
import tiktokService from '../src/services/tiktok';

const FIRST_TIME_KEY = 'has_seen_welcome';
const TIKTOK_INSTALL_TRACKED_KEY = 'tiktok_install_tracked';

export default function RootLayout() {
  const { setUser, setIsLoading } = useAppStore();
  const [initializing, setInitializing] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showVerificationToast, setShowVerificationToast] = useState(false);

  useEffect(() => {
    let isInitializing = true; // Flag to prevent duplicate user creation
    let initTimeout: NodeJS.Timeout;
    
    const initApp = async () => {
      try {
        // Track app opened
        analytics.appOpened();
        
        // Initialize TikTok SDK
        await tiktokService.initialize();
        
        // Track InstallApp event (only on first launch)
        const hasTrackedInstall = await SecureStore.getItemAsync(TIKTOK_INSTALL_TRACKED_KEY);
        if (!hasTrackedInstall) {
          console.log('🎯 First app install - tracking InstallApp event');
          await tiktokService.trackAppInstall();
          await SecureStore.setItemAsync(TIKTOK_INSTALL_TRACKED_KEY, 'true');
        } else {
          console.log('🔄 Returning user - tracking LaunchApp event');
          await tiktokService.trackAppLaunch();
        }
        
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
              
              // Identify user in TikTok
              await tiktokService.identifyUser(newData.user.id, `device-${deviceId}@anonymous.local`);
              await tiktokService.trackRegistration();
              
              // 🔥 FIX 1: Wait for backend to be ready
              console.log('🔍 Warming up backend...');
              setLoadingProgress(10);
              await waitForBackendReady(25000, (progress) => {
                setLoadingProgress(10 + progress * 0.7); // 10% to 80%
              });
              
              // Initialize with new user
              setLoadingProgress(82);
              try {
              await Promise.race([
                Promise.all([
                  initializePurchases(newData.user.id),
                  loginUser(newData.user.id)
                ]),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Initialization timeout')), 12000)
                )
              ]);
              
              setLoadingProgress(95);
              
              // Sync subscription status in background (non-blocking)
              syncSubscriptionStatus()
                .then(isSubscribed => updateSubscriptionStatus(isSubscribed))
                .then(() => {
                  console.log('✅ Subscription status synced in background');
                  setLoadingProgress(100);
                })
                .catch(syncError => {
                  console.warn('⚠️ Background sync failed:', syncError);
                  setLoadingProgress(100);
                });
            } catch (timeoutError) {
              console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
              setLoadingProgress(100);
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
          
          // Identify user in TikTok
          await tiktokService.identifyUser(
            session.user.id,
            session.user.email || `device-${deviceId}@anonymous.local`
          );
          
          // 🔥 FIX 1: Wait for backend to be ready before making API calls
          console.log('🔍 Warming up backend...');
          setLoadingProgress(10); // Starting
          await waitForBackendReady(25000, (progress) => {
            setLoadingProgress(10 + progress * 0.7); // 10% to 80%
          });
          
            // Initialize purchases and login with timeout
            try {
              setLoadingProgress(82); // Starting initialization
              await Promise.race([
                Promise.all([
                  initializePurchases(session.user.id),
                  loginUser(session.user.id)
                ]),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Initialization timeout')), 12000)
                )
              ]);
              
              setLoadingProgress(92); // Initialization complete
              
              setLoadingProgress(95); // Almost done
              
              // Sync subscription status in background (non-blocking)
              syncSubscriptionStatus()
                .then(isSubscribed => updateSubscriptionStatus(isSubscribed))
                .then(() => {
                  console.log('✅ Subscription status synced in background');
                  setLoadingProgress(100); // All done
                })
                .catch(syncError => {
                  console.warn('⚠️ Background sync failed:', syncError);
                  setLoadingProgress(100); // Continue anyway
                });
            } catch (timeoutError) {
              console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
              setLoadingProgress(100); // Continue anyway
              // 🔥 FIX 3: Never downgrade auth state on timeout - keep user logged in
            }
        } else {
          // No session - create anonymous user (backend will handle credit merging)
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
            
            // Identify user in TikTok
            await tiktokService.identifyUser(data.user.id, `device-${deviceId}@anonymous.local`);
            await tiktokService.trackRegistration();
            
            // 🔥 FIX 1: Wait for backend to be ready
            console.log('🔍 Warming up backend...');
            setLoadingProgress(10);
            await waitForBackendReady(25000, (progress) => {
              setLoadingProgress(10 + progress * 0.7); // 10% to 80%
            });
            
            // Initialize purchases and login with timeout
            setLoadingProgress(82);
            try {
              await Promise.race([
                Promise.all([
                  initializePurchases(data.user.id),
                  loginUser(data.user.id)
                ]),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Initialization timeout')), 12000)
                )
              ]);
              
              setLoadingProgress(95);
              
              // Sync subscription status in background (non-blocking)
              syncSubscriptionStatus()
                .then(isSubscribed => updateSubscriptionStatus(isSubscribed))
                .then(() => {
                  console.log('✅ Subscription status synced in background');
                  setLoadingProgress(100);
                })
                .catch(syncError => {
                  console.warn('⚠️ Background sync failed:', syncError);
                  setLoadingProgress(100);
                });
            } catch (timeoutError) {
              console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
              setLoadingProgress(100);
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
    // Increased to 30 seconds to handle cold starts properly
    initTimeout = setTimeout(() => {
      console.warn('⚠️ Maximum initialization time exceeded (30s), forcing continue');
      isInitializing = false;
      setInitializing(false);
      setIsLoading(false);
      setLoadingProgress(100);
    }, 30000); // 30 second max for cold starts

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
    
    // Listen for RevenueCat subscription changes
    const customerInfoListener = addCustomerInfoListener(async (customerInfo) => {
      console.log('🔔 RevenueCat customer info updated');
      
      // Check subscription status
      const hasProAccess = customerInfo.entitlements.active['pro'] !== undefined;
      const hasAnySubscription = customerInfo.activeSubscriptions.length > 0;
      const isSubscribed = hasProAccess || hasAnySubscription;
      
      console.log('💳 Subscription status changed:', isSubscribed);
      
      // Clear cache when subscription changes to force fresh data
      await clearCache();
      console.log('🗑️ Cache cleared due to subscription change');
      
      // Update backend
      try {
        await updateSubscriptionStatus(isSubscribed);
        console.log('✅ Backend updated with new subscription status');
      } catch (error) {
        console.error('❌ Failed to update backend subscription status:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (customerInfoListener) {
        customerInfoListener.remove();
      }
      if (initTimeout) clearTimeout(initTimeout);
    };
  }, []);

  if (initializing) {
    return <LoadingScreen progress={loadingProgress} />;
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

// Styles removed - using LoadingScreen component
