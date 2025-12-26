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
import { router, Stack } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { getCredits, getGenerations } from '../src/services/api';
import { signOut } from '../src/services/supabase';
import { CreditsDisplay, BottomNav } from '../src/components';

// Helper to convert style keys to professional display names
const getStyleDisplayName = (styleKey: string): string => {
  const styleNames: Record<string, string> = {
    'business_photo': 'Business Photo',
    'emotional_film': 'Emotional Film',
    'victoria_secret': "Victoria's Secret",
    // Legacy style names
    'corporate': 'Corporate',
    'creative': 'Creative',
    'friendly': 'Friendly',
  };
  return styleNames[styleKey] || styleKey.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function HomeScreen() {
  const { user, credits, generations, setCredits, setGenerations, setUser } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Small delay to ensure auth state is updated after signup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const [creditsData, generationsData] = await Promise.all([
        getCredits(),
        getGenerations(),
      ]);
      setCredits(creditsData);
      setGenerations(generationsData?.generations || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty array on error to prevent undefined
      setGenerations([]);
      
      // Retry once after a short delay (in case of auth state sync issue)
      setTimeout(async () => {
        try {
          const [creditsData, generationsData] = await Promise.all([
            getCredits(),
            getGenerations(),
          ]);
          setCredits(creditsData);
          setGenerations(generationsData?.generations || []);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }, 1000);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when user changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
                  Tap the green + button below to get started
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
                <Text style={styles.sectionTitle}>Your Portraits</Text>
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
                      {getStyleDisplayName(gen.style_key)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
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
});
