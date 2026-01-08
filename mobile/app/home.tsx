import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store/useAppStore';
import { getCredits, getGenerations, updateSubscriptionStatus, waitForBackendReady } from '../src/services/api';
import { signOut } from '../src/services/supabase';
import { CreditsDisplay, BottomNav } from '../src/components';
import { syncSubscriptionStatus } from '../src/services/purchases';
import { 
  getCachedCredits, 
  getCachedGenerations, 
  cacheCredits, 
  cacheGenerations,
  clearCache
} from '../src/services/cache';

// Helper to convert style keys to professional display names
const getStyleDisplayName = (styleKey: string, isEdited?: boolean): string => {
  const styleNames: Record<string, string> = {
    'business': 'Business Photo',
    'business_photo': 'Business Photo',
    'emotional_film': 'Emotional Film',
    'victoria_secret': "Victoria's Secret",
    'nineties_camera': '90s Camera',
    'professional_headshot': 'Professional',
    'with_puppy': 'With Puppy',
    'custom': 'Custom Style',
    // Legacy style names
    'corporate': 'Corporate',
    'creative': 'Creative',
    'friendly': 'Friendly',
  };
  
  let displayName = styleNames[styleKey] || styleKey.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  // Add (Edited) suffix if it's an edited portrait
  if (isEdited) {
    displayName += ' (Edited)';
  }
  
  return displayName;
};

export default function HomeScreen() {
  const { user, credits, generations, setCredits, setGenerations, setUser } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const loadCachedData = async () => {
    try {
      const [cachedCredits, cachedGenerations] = await Promise.all([
        getCachedCredits(),
        getCachedGenerations(),
      ]);
      
      if (cachedCredits) {
        console.log('⚡ Loading cached credits instantly');
        setCredits(cachedCredits);
      }
      
      if (cachedGenerations) {
        console.log('⚡ Loading cached generations instantly');
        setGenerations(cachedGenerations);
      }
      
      return { hasCache: !!(cachedCredits || cachedGenerations) };
    } catch (error) {
      console.error('Failed to load cached data:', error);
      return { hasCache: false };
    }
  };

  const loadFreshData = async (showAsRefreshing = false, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      if (!showAsRefreshing) {
        setIsLoadingFresh(true);
      }
      
      // 🔥 FIX 1: On first load, ensure backend is ready before making API calls
      if (retryCount === 0 && !hasInitialLoad) {
        console.log('🔍 First load: Warming up backend...');
        await waitForBackendReady(15000);
      }
      
      // Small delay to ensure auth state is updated after signup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 🔥 FIX 2: getCredits() and getGenerations() now have built-in retry logic
      const [creditsData, generationsData] = await Promise.all([
        getCredits(),
        getGenerations(),
      ]);
      
      // Ensure freeCredits is a number
      const normalizedCredits = {
        ...creditsData,
        freeCredits: creditsData?.freeCredits ?? 0,
        hasCredits: creditsData?.hasCredits ?? false,
        isSubscribed: creditsData?.isSubscribed ?? false,
      };
      
      // Update state
      setCredits(normalizedCredits);
      setGenerations(generationsData?.generations || []);
      
      // Cache the fresh data
      await Promise.all([
        cacheCredits(normalizedCredits),
        cacheGenerations(generationsData?.generations || []),
      ]);
      
      console.log('✅ Fresh data loaded and cached');
    } catch (error: any) {
      console.error(`Failed to load fresh data (attempt ${retryCount + 1}/${maxRetries}):`, error);
      
      // 🔥 FIX 3: Never downgrade auth state on transient failures
      // Only reset to 0 if server explicitly says user not found (401/404)
      const isRealFailure = error?.status === 401 || error?.status === 404;
      
      if (isRealFailure) {
        console.error('❌ Real auth failure detected (401/404). User not found.');
        // Only in this case, reset to empty state
        setCredits({ 
          freeCredits: 0, 
          hasCredits: false, 
          isSubscribed: false 
        });
        setGenerations([]);
        return;
      }
      
      // For timeouts, 5xx errors, network errors: NEVER downgrade, keep retrying
      if (retryCount < maxRetries) {
        console.log(`🔄 Transient error. Retrying in ${(retryCount + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000)); // Exponential backoff: 2s, 4s, 6s
        return loadFreshData(showAsRefreshing, retryCount + 1);
      }
      
      // 🔥 After all retries failed due to transient errors: KEEP existing/cached data
      console.warn('⚠️ All retries exhausted due to transient errors. Preserving cached state.');
      console.warn('⚠️ User can pull-to-refresh to retry manually.');
      
      // Only set defaults if we have absolutely nothing (first time user with network issues)
      if (!credits && !generations.length) {
        console.warn('⚠️ No cached data available for first-time user. Showing placeholder.');
        setCredits({ 
          freeCredits: 0, 
          hasCredits: false, 
          isSubscribed: false 
        });
        setGenerations([]);
      }
    } finally {
      setIsLoadingFresh(false);
    }
  };

  useEffect(() => {
    if (user?.id && !hasInitialLoad) {
      setHasInitialLoad(true);
      
      // ALWAYS load cached data first for instant UI
      loadCachedData().then(({ hasCache }) => {
        if (hasCache) {
          console.log('⚡ Cached data loaded instantly');
        } else {
          console.log('ℹ️ No cached data, showing fresh data only');
        }
        
        // Then load fresh data in background (with retries)
        loadFreshData();
      });
    }
  }, [user?.id, hasInitialLoad]);
  
  // When navigating back to home (e.g., from subscription page), force refresh
  useFocusEffect(
    React.useCallback(() => {
      if (hasInitialLoad && user?.id) {
        console.log('🔄 Screen focused, forcing fresh data load');
        // Clear cache to ensure we get fresh subscription state
        clearCache().then(() => {
          loadFreshData();
        });
      }
    }, [hasInitialLoad, user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Run subscription sync and data fetch in parallel
    await Promise.all([
      // Sync subscription status from RevenueCat
      syncSubscriptionStatus()
        .then(isSubscribed => updateSubscriptionStatus(isSubscribed))
        .then(() => console.log('✅ Subscription status synced on refresh'))
        .catch(syncError => console.warn('⚠️ Failed to sync subscription status:', syncError)),
      
      // Load fresh data from backend
      loadFreshData(true),
    ]);
    
    setRefreshing(false);
  };

  const handleStartGeneration = () => {
    if (!credits?.hasCredits) {
      // Redirect to subscription when no credits
      router.push('/subscription');
      return;
    }
    router.push('/upload');
  };

  const completedGenerations = Array.isArray(generations) 
    ? generations.filter(g => g.status === 'completed')
    : [];
  const recentGenerations = completedGenerations.slice(0, 3);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
        >
          <View style={styles.creditsContainer}>
            <CreditsDisplay credits={credits} />
          </View>

          <View style={styles.howItWorks}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.steps}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Click the + Button</Text>
                <Text style={styles.stepDescription}>
                  Tap the + button below to get started
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Choose Style</Text>
                <Text style={styles.stepDescription}>
                  Pick from our professional styles
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>We Create</Text>
                <Text style={styles.stepDescription}>
                  We create your perfect headshot
                </Text>
              </View>
            </View>
          </View>

          {completedGenerations.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Portraits</Text>
                <TouchableOpacity onPress={() => router.push('/gallery')}>
                  <Text style={styles.viewAllButton}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.historyScroll}
              >
                {recentGenerations.map((gen) => (
                  <TouchableOpacity
                    key={gen.id}
                    style={styles.historyCard}
                    onPress={() => router.push({ 
                      pathname: '/result', 
                      params: { 
                        id: gen.id,
                        generatedUrl: gen.generated_image_url || '',
                        originalUrl: gen.original_image_url || '',
                        styleKey: gen.style_key,
                        customPrompt: gen.custom_prompt || ''
                      } 
                    })}
                  >
                    <Image
                      source={{ uri: gen.generated_image_url! }}
                      style={styles.historyImage}
                    />
                    <Text style={styles.historyStyle}>
                      {getStyleDisplayName(gen.style_key, gen.is_edited)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Updates Section */}
          <View style={styles.updatesSection}>
            <View style={styles.updateCard}>
              <View style={styles.updateTopRow}>
                <View style={styles.latestUpdateBadge}>
                  <Text style={styles.latestUpdateBadgeText}>WHAT'S NEW</Text>
                </View>
              </View>
              
              <Text style={styles.updateHeadline}>3 New Styles Added</Text>
              <Text style={styles.updateDescription}>
                Social, Lifestyle & Creative categories now available
              </Text>
              
              <View style={styles.updateDivider} />
              
              <View style={styles.nextUpdateRow}>
                <Text style={styles.nextUpdateLabel}>Next Update:</Text>
                <Text style={styles.nextUpdateDate}>Jan 15, 2025</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <BottomNav />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  guestText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
  },
  loginButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B', // Dark slate background
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#6366F1', // Primary color border
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  promoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promoIcon: {
    fontSize: 20,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  promoText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  promoArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
  },
  promoArrowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2, // Optical adjustment
  },
  creditsContainer: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  historySection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  historyScroll: {
    paddingRight: 20,
  },
  historyCard: {
    marginRight: 16,
    width: 160,
  },
  historyImage: {
    width: 160,
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyStyle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  howItWorks: {
    marginBottom: 32,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Updates Section
  updatesSection: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  updateCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  updateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  latestUpdateBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  latestUpdateBadgeText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  updateHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  updateDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  updateDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  nextUpdateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextUpdateLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  nextUpdateDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});