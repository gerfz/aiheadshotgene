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
const DEVICE_USER_ID_KEY = 'device_user_id'; // Store the user ID for this device

// Helper to wrap promises with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
}

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
        // 🔥 CRITICAL: Set progress immediately so user sees something
        setLoadingProgress(2);
        console.log('🚀 Starting app initialization...');
        
        // ========================================
        // 🎯 STEP 1: Initialize TikTok SDK FIRST (for proper attribution)
        // ========================================
        console.log('📱 [1/6] Initializing TikTok SDK...');
        try {
          await withTimeout(tiktokService.initialize(), 5000, 'TikTok SDK timeout');
          console.log('✅ TikTok SDK initialized');
        } catch (e) {
          console.error('❌ TikTok SDK init failed:', e);
        }
        
        setLoadingProgress(5);
        
        // ========================================
        // 🎯 STEP 2: Track Install/Launch Event IMMEDIATELY (critical for attribution)
        // ========================================
        console.log('📱 [2/6] Tracking TikTok install/launch...');
        try {
          const hasTrackedInstall = await withTimeout(
            SecureStore.getItemAsync(TIKTOK_INSTALL_TRACKED_KEY),
            2000,
            'SecureStore timeout'
          );
          
          if (!hasTrackedInstall) {
            // First time install - CRITICAL for attribution
            console.log('🎯 FIRST INSTALL - Tracking InstallApp event for TikTok attribution');
            
            // Wait for install event to complete (don't fire and forget!)
            await withTimeout(
              tiktokService.trackAppInstall(),
              5000,
              'Install tracking timeout'
            );
            
            // Mark as tracked
            await SecureStore.setItemAsync(TIKTOK_INSTALL_TRACKED_KEY, 'true');
            console.log('✅ Install event tracked successfully');
          } else {
            // Returning user - track launch
            console.log('🔄 Returning user - tracking LaunchApp event');
            tiktokService.trackAppLaunch().catch((e) => {
              console.warn('⚠️ Launch tracking failed:', e);
            });
          }
        } catch (e) {
          console.error('❌ Install/Launch tracking failed:', e);
        }
        
        setLoadingProgress(10);
        
        // ========================================
        // 🎯 STEP 3: Initialize PostHog (after TikTok attribution is captured)
        // ========================================
        console.log('📱 [3/6] Initializing analytics...');
        // Track app opened (non-blocking)
        analytics.appOpened();
        
        setLoadingProgress(12);
        
        // ========================================
        // 🎯 STEP 4: Start backend warmup in parallel
        // ========================================
        console.log('📱 [4/6] Starting backend warmup...');
        const backendWarmupPromise = waitForBackendReady(20000, (progress) => {
          if (progress < 50) {
            setLoadingProgress(12 + progress * 0.3);
          }
        }).catch(err => {
          console.warn('⚠️ Backend warmup failed:', err);
          return false;
        });
        
        setLoadingProgress(15);
        
        // ========================================
        // 🎯 STEP 5: Get device ID
        // ========================================
        console.log('📱 [5/6] Getting device ID...');
        let deviceId: string;
        try {
          deviceId = await withTimeout(getHardwareDeviceId(), 3000, 'Device ID timeout');
          console.log('✅ Device ID retrieved:', deviceId);
        } catch (e) {
          console.warn('⚠️ Device ID fetch failed, using fallback');
          deviceId = `fallback-${Date.now()}`;
        }
        
        setLoadingProgress(18);
        
        // 🔥 FIX: Check if this device has a stored user ID
        let storedUserId: string | null = null;
        try {
          storedUserId = await withTimeout(
            SecureStore.getItemAsync(DEVICE_USER_ID_KEY),
            2000,
            'Stored user ID timeout'
          );
          if (storedUserId) {
            console.log('📱 Found stored user ID for this device:', storedUserId);
          }
        } catch (e) {
          console.warn('⚠️ Could not read stored user ID');
        }
        
        // 🔥 FIX: Check for existing auth session WITH TIMEOUT
        let session = null;
        try {
          console.log('🔍 Checking Supabase session...');
          const sessionResult = await withTimeout(
            supabase.auth.getSession(),
            8000, // 8 second timeout for session
            'Session fetch timeout'
          );
          
          // If there's an error getting session (e.g., invalid refresh token), clear it
          if (sessionResult.error) {
            console.warn('⚠️ Error getting session, clearing:', sessionResult.error.message);
            supabase.auth.signOut().catch(() => {}); // Non-blocking signout
            session = null;
          } else {
            session = sessionResult.data.session;
          }
        } catch (sessionError: any) {
          console.warn('⚠️ Session timeout or error:', sessionError.message);
          // Try to sign out (non-blocking) to clear any stale state
          supabase.auth.signOut().catch(() => {});
          session = null;
        }
        
        setLoadingProgress(25);
        
        if (session?.user) {
          // User already has an anonymous session
          console.log('✅ Existing anonymous user:', session.user.id);
          
          setLoadingProgress(30);
          
          // 🔥 FIX: Verify session with timeout
          let validUser = null;
          try {
            const userResult = await withTimeout(
              supabase.auth.getUser(),
              5000, // 5 second timeout
              'User verification timeout'
            );
            
            if (!userResult.error && userResult.data.user) {
              validUser = userResult.data.user;
            }
          } catch (verifyError) {
            console.warn('⚠️ User verification timeout, will create new user');
          }
          
          if (!validUser) {
            // Session is invalid, sign out and recreate user
            console.warn('⚠️ Invalid session detected, will recreate user for this device');
            supabase.auth.signOut().catch(() => {}); // Non-blocking
            
            setLoadingProgress(35);
            
            // 🔥 DEVICE-BASED USER: Recreate anonymous user with same device binding
            try {
              const { data: newData, error: newError } = await withTimeout(
                supabase.auth.signInAnonymously({
                  options: {
                    data: {
                      device_id: deviceId,
                      is_anonymous: true,
                      previous_user_id: storedUserId || undefined, // Include previous user ID if exists
                    }
                  }
                }),
                8000,
                'Anonymous sign-in timeout'
              );
              
              if (newError || !newData.user) {
                throw new Error('Failed to create anonymous user');
              }
              
              // 🔥 IMPORTANT: Store this user ID for this device
              await SecureStore.setItemAsync(DEVICE_USER_ID_KEY, newData.user.id);
              console.log('💾 Stored user ID for device:', newData.user.id);
              
              setUser({
                id: newData.user.id,
                email: `device-${deviceId}@anonymous.local`,
              });
              
              // Identify user in TikTok (non-blocking)
              tiktokService.identifyUser(newData.user.id, `device-${deviceId}@anonymous.local`).catch(() => {});
              // Don't track registration for returning devices
              if (!storedUserId) {
                tiktokService.trackRegistration().catch(() => {});
              }
              
              setLoadingProgress(50);
              
              // 🔥 FIX: Wait for backend warmup to complete (it started earlier)
              console.log('🔍 Waiting for backend warmup...');
              await backendWarmupPromise;
              
              setLoadingProgress(70);
              
              // Initialize with new user
              try {
                await Promise.race([
                  Promise.all([
                    initializePurchases(newData.user.id),
                    loginUser(newData.user.id)
                  ]),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Initialization timeout')), 10000)
                  )
                ]);
              } catch (timeoutError) {
                console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
              }
              
              setLoadingProgress(90);
              
              // Sync subscription status in background (non-blocking)
              syncSubscriptionStatus()
                .then(isSubscribed => updateSubscriptionStatus(isSubscribed))
                .then(() => console.log('✅ Subscription status synced'))
                .catch(syncError => console.warn('⚠️ Background sync failed:', syncError));
              
              setLoadingProgress(100);
              return; // Exit early
            } catch (createError) {
              console.error('❌ Failed to create user:', createError);
              // Continue anyway - app might work with cached data
              setLoadingProgress(100);
              return;
            }
          }
          
          // 🔥 DEVICE-BASED USER: Store this user ID for the device if not already stored
          if (!storedUserId || storedUserId !== session.user.id) {
            await SecureStore.setItemAsync(DEVICE_USER_ID_KEY, session.user.id).catch(() => {});
            console.log('💾 Updated stored user ID for device:', session.user.id);
          }
          
          // Valid session found
          setUser({
            id: session.user.id,
            email: session.user.email || `device-${deviceId}@anonymous.local`,
          });
          
          setLoadingProgress(40);
          
          // Identify user in TikTok (non-blocking)
          tiktokService.identifyUser(
            session.user.id,
            session.user.email || `device-${deviceId}@anonymous.local`
          ).catch(() => {});
          
          // 🔥 FIX: Wait for backend warmup to complete (it started earlier in parallel)
          console.log('🔍 Waiting for backend warmup...');
          await backendWarmupPromise;
          
          setLoadingProgress(60);
          
          // Initialize purchases and login with timeout
          try {
            await Promise.race([
              Promise.all([
                initializePurchases(session.user.id),
                loginUser(session.user.id)
              ]),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Initialization timeout')), 10000)
              )
            ]);
          } catch (timeoutError) {
            console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
          }
          
          setLoadingProgress(85);
          
          // Sync subscription status in background (non-blocking)
          syncSubscriptionStatus()
            .then(isSubscribed => updateSubscriptionStatus(isSubscribed))
            .then(() => console.log('✅ Subscription status synced'))
            .catch(syncError => console.warn('⚠️ Background sync failed:', syncError));
          
          setLoadingProgress(100);
        } else {
          // No session - create anonymous user for this device
          const isReturningDevice = !!storedUserId;
          console.log(isReturningDevice ? '🔄 Recreating user for returning device' : '🆕 Creating new user for first-time device');
          
          setLoadingProgress(30);
          
          try {
            const { data, error } = await withTimeout(
              supabase.auth.signInAnonymously({
                options: {
                  data: {
                    device_id: deviceId,
                    is_anonymous: true,
                    previous_user_id: storedUserId || undefined, // Include previous user ID if exists
                  }
                }
              }),
              8000, // 8 second timeout
              'Anonymous sign-in timeout'
            );
            
            if (error) {
              console.error('❌ Failed to create anonymous user:', error);
              throw error;
            }
            
            if (data.user) {
              console.log('✅ Anonymous user created:', data.user.id);
              
              // 🔥 IMPORTANT: Store this user ID for this device
              await SecureStore.setItemAsync(DEVICE_USER_ID_KEY, data.user.id);
              console.log('💾 Stored user ID for device:', data.user.id);
              
              setUser({
                id: data.user.id,
                email: `device-${deviceId}@anonymous.local`,
              });
              
              setLoadingProgress(45);
              
              // Identify user in TikTok (non-blocking)
              tiktokService.identifyUser(data.user.id, `device-${deviceId}@anonymous.local`).catch(() => {});
              // Only track registration for truly new devices
              if (!isReturningDevice) {
                tiktokService.trackRegistration().catch(() => {});
              }
              
              // 🔥 FIX: Wait for backend warmup to complete (it started earlier in parallel)
              console.log('🔍 Waiting for backend warmup...');
              await backendWarmupPromise;
              
              setLoadingProgress(65);
              
              // Initialize purchases and login with timeout
              try {
                await Promise.race([
                  Promise.all([
                    initializePurchases(data.user.id),
                    loginUser(data.user.id)
                  ]),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Initialization timeout')), 10000)
                  )
                ]);
              } catch (timeoutError) {
                console.warn('⚠️ Initialization timeout, continuing anyway:', timeoutError);
              }
              
              setLoadingProgress(88);
              
              // Sync subscription status in background (non-blocking)
              syncSubscriptionStatus()
                .then(isSubscribed => updateSubscriptionStatus(isSubscribed))
                .then(() => console.log('✅ Subscription status synced'))
                .catch(syncError => console.warn('⚠️ Background sync failed:', syncError));
              
              setLoadingProgress(100);
            }
          } catch (createError) {
            console.error('❌ Failed to create anonymous user:', createError);
            // Continue anyway - user might see limited functionality
            setLoadingProgress(100);
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
    // 20 seconds should be enough now with parallel warmup
    initTimeout = setTimeout(() => {
      console.warn('⚠️ Maximum initialization time exceeded (20s), forcing continue');
      isInitializing = false;
      setInitializing(false);
      setIsLoading(false);
      setLoadingProgress(100);
    }, 20000); // 20 second max

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
          try {
            const deviceId = await withTimeout(getHardwareDeviceId(), 2000, 'Device ID timeout');
            setUser({
              id: session.user.id,
              email: session.user.email || `device-${deviceId}@anonymous.local`,
            });
            
            // Login and refresh credits with timeout
            await withTimeout(
              loginUser(session.user.id),
              5000,
              'Login timeout'
            );
            
            const creditsData = await withTimeout(
              getCredits(),
              5000,
              'Credits fetch timeout'
            );
            useAppStore.setState({ credits: creditsData });
            console.log('✅ Credits refreshed:', creditsData);
          } catch (error) {
            console.error('❌ Error during auth state change:', error);
          }
        } else if (!isInitializing) {
          // Session expired - recreate anonymous user (only if not initializing)
          console.log('⚠️ Session expired, recreating anonymous user for device');
          try {
            const deviceId = await withTimeout(getHardwareDeviceId(), 2000, 'Device ID timeout');
            
            // 🔥 DEVICE-BASED USER: Check stored user ID
            const storedUserId = await withTimeout(
              SecureStore.getItemAsync(DEVICE_USER_ID_KEY),
              2000,
              'Stored user ID timeout'
            ).catch(() => null);
            
            const { data, error } = await withTimeout(
              supabase.auth.signInAnonymously({
                options: {
                  data: {
                    device_id: deviceId,
                    is_anonymous: true,
                    previous_user_id: storedUserId || undefined,
                  }
                }
              }),
              8000,
              'Anonymous sign-in timeout'
            );
            
            if (data?.user) {
              // 🔥 Store the new user ID for this device
              await SecureStore.setItemAsync(DEVICE_USER_ID_KEY, data.user.id).catch(() => {});
              
              setUser({
                id: data.user.id,
                email: `device-${deviceId}@anonymous.local`,
              });
              await withTimeout(loginUser(data.user.id), 5000, 'Login timeout');
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
