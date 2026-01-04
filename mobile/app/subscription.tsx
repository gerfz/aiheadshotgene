import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { 
  getOfferings, 
  purchasePackage, 
  restorePurchases, 
  checkProStatus, 
  PACKAGE_IDS 
} from '../src/services/purchases';
import type { PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '../src/store/useAppStore';
import { supabase } from '../src/services/supabase';
import { API_URL } from '../src/constants/config';
import { analytics } from '../src/services/posthog';

const { width, height } = Dimensions.get('window');
const SHOW_SUBSCRIPTION_KEY = 'show_subscription_after_onboarding';

// Sample images from your style folders - Now hosted on Supabase
const SAMPLE_IMAGES = [
  { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/business/518559229-793ad242-7867-4709-bdc6-55021f5eb78f.png' },
  { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/emotionalfilm/518559958-243d1b11-9ef0-4d4f-b308-97d67b5d3bc3.png' },
  { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/victoriasecret/G6TSEqzWYAIvaf9.jpg' },
  { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/victoriasecret/G6TSEscXQAAm3Lo.jpg' },
  { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/victoriasecret/G6TSEuEWEAAaR7N.jpg' },
  { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/professionalheadshot/example1.png' },
  { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/1990s%20camera%20style/example1.png' },
  { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/withpuppy/example1.png' },
];

export default function SubscriptionScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { setCredits } = useAppStore();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    loadOfferings();
    // Track subscription screen view
    analytics.subscriptionScreenViewed();
  }, []);

  // Auto-scroll background images
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % SAMPLE_IMAGES.length;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: currentIndex * width,
          animated: true,
        });
      }
    }, 4000); 

    return () => clearInterval(interval);
  }, []);

  const loadOfferings = async () => {
    try {
      const availablePackages = await getOfferings();
      setPackages(availablePackages);
    } catch (error) {
      console.error('❌ Failed to load offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        const isPro = await checkProStatus();
        if (isPro) {
          // Update backend
          try {
            const session = await supabase.auth.getSession();
            await fetch(`${API_URL}/api/user/subscription`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session?.access_token}`,
              },
              body: JSON.stringify({ isSubscribed: true }),
            });
          } catch (e) {
            console.error('Backend update failed', e);
          }

          setCredits({ 
            freeCredits: 999, 
            hasCredits: true, 
            isSubscribed: true 
          });
          
          // Clear the subscription flag
          await SecureStore.deleteItemAsync(SHOW_SUBSCRIPTION_KEY);
          
          Alert.alert('🎉 Success!', 'Welcome to Pro!', [
            { text: 'Start Creating', onPress: () => router.back() }
          ]);
        }
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const customerInfo = await restorePurchases();
      
      if (!customerInfo) {
        Alert.alert('Error', 'Failed to restore purchases. Please try again.');
        return;
      }
      
      const isPro = await checkProStatus();
      
      if (isPro) {
        // Update subscription status in backend
        try {
          const response = await fetch(`${API_URL}/api/user/subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.id}`,
            },
            body: JSON.stringify({ isSubscribed: true }),
          });
          
          if (response.ok) {
            // Clear the subscription flag
            await SecureStore.deleteItemAsync(SHOW_SUBSCRIPTION_KEY);
            
            Alert.alert(
              '✅ Subscription Restored!',
              'Your subscription has been successfully restored.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          } else {
            Alert.alert('⚠️ Partially Restored', 'Subscription found but failed to sync. Please restart the app.');
          }
        } catch (error) {
          console.error('Failed to update subscription status:', error);
          Alert.alert('⚠️ Partially Restored', 'Subscription found but failed to sync. Please restart the app.');
        }
      } else {
        Alert.alert(
          'No Subscription Found',
          'No active subscription was found for this account. If you recently purchased, please wait a few minutes and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please check your internet connection and try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const getMockPackages = () => [
    { 
      identifier: '$rc_weekly', 
      product: { priceString: '$7.79', identifier: 'weekly_pro' } 
    },
    { 
      identifier: '$rc_monthly', 
      product: { priceString: '$14.79', identifier: 'monthly_pro' } 
    },
    { 
      identifier: '$rc_annual', 
      product: { priceString: '$79.79', identifier: 'yearly_pro' } 
    }
  ];

  // Helper to safely find package in real data, or fallback to mock
  const resolvePackage = (keyword: string, mockIndex: number) => {
    const found = packages.find(p => 
      p.identifier.toLowerCase().includes(keyword.toLowerCase()) || 
      (p.product.identifier && p.product.identifier.toLowerCase().includes(keyword.toLowerCase()))
    );
    return found || getMockPackages()[mockIndex];
  };

  const weeklyPkg = resolvePackage('weekly', 0);
  const monthlyPkg = resolvePackage('monthly', 1);
  const yearlyPkg = resolvePackage('annual', 2) || resolvePackage('yearly', 2);

  // Auto-select weekly if not set
  useEffect(() => {
    if (!selectedPackage && weeklyPkg) {
      setSelectedPackage(weeklyPkg.identifier);
    }
  }, [packages]); // Run when packages load

  const renderPackage = (pkg: any, label: string, subLabel?: string, badge?: string, hasIntroOffer?: boolean) => {
    if (!pkg) return null;
    const isSelected = selectedPackage === pkg.identifier;
    
    return (
      <TouchableOpacity 
        style={[styles.planCard, isSelected && styles.planCardSelected]} 
        onPress={() => setSelectedPackage(pkg.identifier)}
        activeOpacity={0.9}
      >
        {badge && (
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>{badge}</Text>
          </View>
        )}
        <View style={styles.planContent}>
          <View style={styles.planTextContainer}>
             <Text style={[styles.planName, isSelected && styles.textSelected]}>{label}</Text>
             {subLabel && <Text style={[styles.planSubLabel, isSelected && styles.textSelectedSub]}>{subLabel}</Text>}
          </View>
          <View style={styles.priceContainer}>
             <Text style={[styles.planPrice, isSelected && styles.textSelected]}>{pkg.product.priceString}</Text>
             <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                {isSelected && <View style={styles.radioButtonInner} />}
             </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper to get renewal text based on selected package
  const getRenewalText = () => {
    if (!selectedPackage) return '';
    
    const isWeekly = selectedPackage.includes('weekly');
    const isMonthly = selectedPackage.includes('monthly');
    const isYearly = selectedPackage.includes('annual') || selectedPackage.includes('yearly');
    
    // Check if weekly has intro offer (50% off)
    const weeklyHasIntro = isWeekly; // Assuming weekly always has intro offer
    
    if (isWeekly && weeklyHasIntro) {
      // For weekly with intro offer
      const introPrice = '$3.90'; // 50% of $7.79
      const regularPrice = weeklyPkg?.product?.priceString || '$7.79';
      return `Start 1-week trial for ${introPrice}, then ${regularPrice}/week`;
    } else if (isWeekly) {
      const price = weeklyPkg?.product?.priceString || '$7.79';
      return `Renews automatically at ${price}/week`;
    } else if (isMonthly) {
      const price = monthlyPkg?.product?.priceString || '$14.79';
      return `Renews automatically at ${price}/month`;
    } else if (isYearly) {
      const price = yearlyPkg?.product?.priceString || '$79.79';
      return `Renews automatically at ${price}/year`;
    }
    
    return '';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background */}
      <View style={styles.backgroundContainer}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.imageScroll}
        >
          {SAMPLE_IMAGES.map((image, index) => (
            <Image
              key={index}
              source={image}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          ))}
        </Animated.ScrollView>
        <View style={styles.overlay} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={async () => {
                // Clear the subscription flag
                await SecureStore.deleteItemAsync(SHOW_SUBSCRIPTION_KEY);
                
                // Check if we can go back, otherwise go to home
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/home');
                }
              }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" opacity={0.8} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Unlock <Text style={styles.titleHighlight}>Pro Access</Text></Text>
            </View>
          </View>

          {/* Infographics / Feature Boxes */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureBox}>
              <View style={styles.featureIcon}>
                <Ionicons name="infinite" size={24} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Unlimited Generations</Text>
                <Text style={styles.featureDescription}>Create as many portraits as you want</Text>
              </View>
            </View>

            <View style={styles.featureBox}>
              <View style={styles.featureIcon}>
                <Ionicons name="color-wand" size={24} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Custom Style Prompts</Text>
                <Text style={styles.featureDescription}>Write your own unique prompts</Text>
              </View>
            </View>

            <View style={styles.featureBox}>
              <View style={styles.featureIcon}>
                <Ionicons name="create" size={24} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Edit & Refine Results</Text>
                <Text style={styles.featureDescription}>Perfect your portraits with AI editing</Text>
              </View>
            </View>
          </View>

          {/* Plans */}
          <View style={styles.plansContainer}>
            {renderPackage(weeklyPkg, 'Weekly', '50% off first week', '1-Week Trial')}
            {renderPackage(monthlyPkg, 'Monthly', 'Cancel anytime')}
            {renderPackage(yearlyPkg, 'Yearly', 'Best value', 'Best Value')}
          </View>

          {/* Bottom Action */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
              onPress={() => {
                const pkg = [weeklyPkg, monthlyPkg, yearlyPkg].find(p => p.identifier === selectedPackage);
                if (pkg) handlePurchase(pkg as PurchasesPackage);
              }}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.ctaText}>
                  {selectedPackage?.includes('weekly') ? 'Start 1-Week Trial' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.renewalText}>{getRenewalText()}</Text>
            
            {/* Maybe Later Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={async () => {
                // Clear the subscription flag
                await SecureStore.deleteItemAsync(SHOW_SUBSCRIPTION_KEY);
                
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/home');
                }
              }}
            >
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  imageScroll: {
    flex: 1,
    height: '100%',
  },
  backgroundImage: {
    width: width,
    height: height,
    opacity: 0.6, // Slightly clearer background
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', // Darker overlay for content pop
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 10,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleHighlight: {
    color: '#6366F1',
  },
  
  // Features (Infographics)
  featuresContainer: {
    gap: 10,
    marginBottom: 20,
    flex: 1, // Take up available space
  },
  featureBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDescription: {
    color: '#94A3B8',
    fontSize: 13,
  },

  // Plans
  plansContainer: {
    gap: 8,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 64, // Fixed compact height
    justifyContent: 'center',
  },
  planCardSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTextContainer: {
    justifyContent: 'center',
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  planSubLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textSelected: {
    color: '#6366F1',
  },
  textSelectedSub: {
    color: '#A5B4FC',
  },
  planBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },

  // Bottom Section
  bottomSection: {
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  renewalText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
});
