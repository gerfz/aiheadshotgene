import { useEffect, useState, useRef } from 'react';
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
import { clearCache, getCachedUserProfile, getCachedCredits, cacheUserProfile, getCachedSubscriptionStatus } from '../src/services/cache';
import tiktokService from '../src/services/tiktok';
import appsFlyerService from '../src/services/appsflyer';
import { setAuthReady } from '../src/services/authReady';

const FIRST_TIME_KEY = 'has_seen_welcome';
const TIKTOK_INSTALL_TRACKED_KEY = 'tiktok_install_tracked';
const DEVICE_USER_ID_KEY = 'device_user_id';
const TRIAL_TRACKED_KEY = 'trial_activation_tracked'; // Store the user ID for this device

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
  const [appReady, setAppReady] = useState(false);
  const [showVerificationToast, setShowVerificationToast] = useState(false);
  const loadingStartTimeRef = useRef<number>(0);
  const lastLoadingStepRef = useRef<string>('init');

  useEffect(() => {
    let isInitializing = true; // Flag to prevent duplicate user creation
    let initTimeout: NodeJS.Timeout;
    
    const initApp = async () => {
      const loadingStartTime = Date.now();
      loadingStartTimeRef.current = loadingStartTime;
      
      try {
        console.log('🚀 Starting app initialization...');
        
        // Track app launched and loading started
        analytics.appLaunched();
        analytics.loadingStarted(loadingStartTime);
        
        // ========================================
        // 🚀 STEP 0: Load cached data FIRST (instant)
        // ========================================
        lastLoadingStepRef.current = 'loading_cache';
        console.log('⚡ [0/4] Loading cached data for instant startup...');
        try {
          const [cachedProfile, cachedCredits] = await Promise.all([
            getCachedUserProfile(),
            getCachedCredits()
          ]);
          
          if (cachedProfile) {
            console.log('✅ Restored cached user profile instantly');
            setUser({ id: cachedProfile.userId, email: cachedProfile.email });
            
            if (cachedCredits) {
              console.log('✅ Restored cached credits instantly');
              useAppStore.setState({ credits: cachedCredits });
            }
            console.log('⚡ Cached data loaded - continuing with auth...');
          }
        } catch (cacheError) {
          console.warn('⚠️ Could not load cached data:', cacheError);
        }
        
        // ========================================
        // 🎯 STEP 1: Get device ID + stored user (fast, needed for auth)
        // ========================================
        lastLoadingStepRef.current = 'get_device_id';
        console.log('📱 [1/4] Getting device ID...');
        let deviceId: string;
        try {
          deviceId = await withTimeout(getHardwareDeviceId(), 3000, 'Device ID timeout');
          console.log('✅ Device ID retrieved:', deviceId);
        } catch (e) {
          console.warn('⚠️ Device ID fetch failed, using fallback');
          deviceId = `fallback-${Date.now()}`;
        }
        
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
        
        // ========================================
        // 🎯 STEP 2: AUTHENTICATE USER (critical path - do this FIRST)
        //    + Start backend warmup in background (non-blocking)
        // ========================================
        lastLoadingStepRef.current = 'auth';
        console.log('🔐 [2/4] Authenticating user...');
        
        // Start backend health ping in background - does NOT block anything
        // This warms up the Render server so API calls are fast when auth completes
        waitForBackendReady(15000).catch(err => {
          console.warn('⚠️ Backend warmup failed:', err);
        });
        
        // Authenticate: restore session or create anonymous user
        let authenticatedUserId: string | null = null;
        
        let session = null;
        try {
          console.log('🔍 Checking Supabase session...');
          const sessionResult = await withTimeout(
            supabase.auth.getSession(),
            8000,
            'Session fetch timeout'
          );
          
          if (sessionResult.error) {
            console.warn('⚠️ Error getting session, clearing:', sessionResult.error.message);
            supabase.auth.signOut().catch(() => {});
            session = null;
          } else {
            session = sessionResult.data.session;
          }
        } catch (sessionError: any) {
          console.warn('⚠️ Session timeout or error:', sessionError.message);
          supabase.auth.signOut().catch(() => {});
          session = null;
        }
        
        if (session?.user) {
          console.log('✅ Existing anonymous user:', session.user.id);
          
          // Verify session is still valid
          let validUser = null;
          try {
            const userResult = await withTimeout(
              supabase.auth.getUser(),
              5000,
              'User verification timeout'
            );
            if (!userResult.error && userResult.data.user) {
              validUser = userResult.data.user;
            }
          } catch (verifyError) {
            console.warn('⚠️ User verification timeout, will create new user');
          }
          
          if (!validUser) {
            // Session is invalid - recreate user
            console.warn('⚠️ Invalid session detected, recreating user...');
            supabase.auth.signOut().catch(() => {});
            session = null; // Fall through to create new user below
          } else {
            // Valid session - auth is confirmed!
            authenticatedUserId = session.user.id;
            
            if (!storedUserId || storedUserId !== session.user.id) {
              await SecureStore.setItemAsync(DEVICE_USER_ID_KEY, session.user.id).catch(() => {});
              console.log('💾 Updated stored user ID for device:', session.user.id);
            }
            
            const userEmail = session.user.email || `device-${deviceId}@anonymous.local`;
            setUser({ id: session.user.id, email: userEmail });
            
            // 🔓 AUTH IS READY - unblock all API calls
            setAuthReady();
            console.log('🔓 Auth ready - API calls unblocked');
            
            // Cache & identify (non-blocking)
            cacheUserProfile(session.user.id, userEmail).catch(() => {});
            identifyUser(session.user.id, {
              device_id: deviceId,
              user_id: session.user.id,
              is_anonymous: !session.user.email,
              email: userEmail,
            });
            tiktokService.identifyUser(session.user.id, userEmail).catch(() => {});
            appsFlyerService.setCustomerUserId(session.user.id);
          }
        }
        
        // If no valid session, create anonymous user
        if (!authenticatedUserId) {
          const isReturningDevice = !!storedUserId;
          console.log(isReturningDevice ? '🔄 Recreating user for returning device' : '🆕 Creating new user for first-time device');
          
          try {
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
            
            if (error || !data.user) {
              throw new Error(error?.message || 'Failed to create anonymous user');
            }
            
            authenticatedUserId = data.user.id;
            console.log('✅ Anonymous user created:', data.user.id);
            
            await SecureStore.setItemAsync(DEVICE_USER_ID_KEY, data.user.id);
            console.log('💾 Stored user ID for device:', data.user.id);
            
            const userEmail = `device-${deviceId}@anonymous.local`;
            setUser({ id: data.user.id, email: userEmail });
            
            // 🔓 AUTH IS READY - unblock all API calls
            setAuthReady();
            console.log('🔓 Auth ready - API calls unblocked');
            
            // Cache & identify (non-blocking)
            cacheUserProfile(data.user.id, userEmail).catch(() => {});
            identifyUser(data.user.id, {
              device_id: deviceId,
              user_id: data.user.id,
              is_anonymous: true,
              email: userEmail,
            });
            tiktokService.identifyUser(data.user.id, userEmail).catch(() => {});
            appsFlyerService.setCustomerUserId(data.user.id);
            if (!isReturningDevice) {
              tiktokService.trackRegistration().catch(() => {});
              appsFlyerService.trackRegistration('anonymous').catch(() => {});
            }
          } catch (createError) {
            console.error('❌ Failed to create anonymous user:', createError);
            // Don't call setAuthReady() - auth genuinely failed
          }
        }
        
        // ========================================
        // 🎯 STEP 3: Initialize RevenueCat (does NOT need backend)
        // ========================================
        lastLoadingStepRef.current = 'init_purchases';
        console.log('💳 [3/4] Initializing RevenueCat...');
        if (authenticatedUserId) {
          try {
            await Promise.race([
              Promise.all([
                initializePurchases(authenticatedUserId),
                loginUser(authenticatedUserId)
              ]),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('RevenueCat timeout')), 10000)
              )
            ]);
            console.log('✅ RevenueCat initialized');
          } catch (timeoutError) {
            console.warn('⚠️ RevenueCat init timeout, continuing:', timeoutError);
          }
        }
        
        // ========================================
        // 🎯 STEP 4: Initialize tracking SDKs (non-critical, can be slower)
        // ========================================
        lastLoadingStepRef.current = 'init_tracking';
        console.log('📱 [4/4] Initializing tracking SDKs...');
        
        // AppsFlyer
        try {
          await withTimeout(appsFlyerService.initialize(), 5000, 'AppsFlyer timeout');
          console.log('✅ AppsFlyer initialized');
        } catch (e) {
          console.error('❌ AppsFlyer init failed:', e);
        }
        
        // TikTok
        try {
          await withTimeout(tiktokService.initialize(), 5000, 'TikTok SDK timeout');
          console.log('✅ TikTok SDK initialized');
        } catch (e) {
          console.error('❌ TikTok SDK init failed:', e);
        }
        
        // Track install/launch
        try {
          const hasTrackedInstall = await withTimeout(
            SecureStore.getItemAsync(TIKTOK_INSTALL_TRACKED_KEY),
            2000,
            'SecureStore timeout'
          );
          
          if (!hasTrackedInstall) {
            console.log('🎯 FIRST INSTALL - Tracking InstallApp event');
            await withTimeout(tiktokService.trackAppInstall(), 5000, 'Install tracking timeout');
            await SecureStore.setItemAsync(TIKTOK_INSTALL_TRACKED_KEY, 'true');
            console.log('✅ Install event tracked');
          } else {
            tiktokService.trackAppLaunch().catch(() => {});
          }
        } catch (e) {
          console.error('❌ Install/Launch tracking failed:', e);
        }
        
        // PostHog
        analytics.appOpened();
        
        // ========================================
        // 🔄 BACKGROUND: Sync subscription status (non-blocking, uses waitForAuth via getAuthHeaders)
        // ========================================
        if (authenticatedUserId) {
          syncSubscriptionStatus()
            .then(isSubscribed => updateSubscriptionStatus(isSubscribed))
            .then(() => console.log('✅ Subscription status synced'))
            .catch(syncError => console.warn('⚠️ Background sync failed:', syncError));
        }
        
      } catch (error) {
        console.error('❌ App initialization error:', error);
      } finally {
        isInitializing = false;
        clearTimeout(initTimeout);
        console.log('✅ App initialization complete');
        
        // NOTE: No safety net setAuthReady() here. If auth failed, API calls should NOT proceed.
        // The waitForAuth() timeout (15s) in api.ts handles the edge case.
        
        // Fetch credits to check for trial (non-blocking, waits for auth via getAuthHeaders)
        getCredits()
          .then(async (creditsData) => {
            useAppStore.setState({ credits: creditsData });
            
            // Track trial activation for active trials (only once)
            if (creditsData.isTrialActive) {
              const hasTrackedTrial = await SecureStore.getItemAsync(TRIAL_TRACKED_KEY).catch(() => null);
              if (!hasTrackedTrial) {
                analytics.trialActivated(creditsData.totalCredits, creditsData.trialDaysRemaining);
                await SecureStore.setItemAsync(TRIAL_TRACKED_KEY, 'true').catch(() => {});
                console.log('🎁 Trial activation tracked:', creditsData.totalCredits, 'credits,', creditsData.trialDaysRemaining, 'days');
              }
            }
          })
          .catch(err => console.warn('⚠️ Failed to fetch credits after init:', err));
        
        // Track loading finished
        const loadingDuration = Date.now() - loadingStartTime;
        analytics.loadingFinished(loadingDuration, true);
        
        setAppReady(true);
      }
    };

    // Maximum timeout for entire initialization (15s - faster now with real health ping)
    initTimeout = setTimeout(() => {
      console.warn('⚠️ Maximum initialization time exceeded (15s), forcing continue');
      isInitializing = false;
      setAppReady(true);
    }, 15000);

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
            
            // 🔓 Signal that auth is ready on session change
            setAuthReady();
            
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
            
            // Track trial activation for new trials (only once per user)
            if (creditsData.isTrialActive) {
              const hasTrackedTrial = await SecureStore.getItemAsync(TRIAL_TRACKED_KEY).catch(() => null);
              if (!hasTrackedTrial) {
                analytics.trialActivated(creditsData.totalCredits, creditsData.trialDaysRemaining);
                await SecureStore.setItemAsync(TRIAL_TRACKED_KEY, 'true').catch(() => {});
                console.log('🎁 Trial activation tracked:', creditsData.totalCredits, 'credits,', creditsData.trialDaysRemaining, 'days');
              }
            }
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
              
              // 🔓 Signal that auth is ready after session recreation
              setAuthReady();
              
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

  const handleLoadingComplete = () => {
    console.log('🎬 Loading animation complete');
    setInitializing(false);
    setIsLoading(false);
  };

  if (initializing) {
    return (
      <LoadingScreen 
        isReady={appReady} 
        onLoadingComplete={handleLoadingComplete}
      />
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

// Styles removed - using LoadingScreen component
