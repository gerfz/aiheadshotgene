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
  Modal,
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
import tiktokService from '../src/services/tiktok';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { setCredits } = useAppStore();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadOfferings();
    // Track subscription screen view
    analytics.subscriptionScreenViewed();
    tiktokService.trackSubscriptionView();
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
      
      // Debug: Log intro offer information
      availablePackages.forEach(pkg => {
        console.log(`📦 Package: ${pkg.identifier}`);
        console.log(`  Price: ${pkg.product.priceString}`);
        console.log(`  Intro Price:`, pkg.product.introPrice);
        if (pkg.product.introPrice) {
          console.log(`    Intro Price String: ${pkg.product.introPrice.priceString}`);
          console.log(`    Intro Price: ${pkg.product.introPrice.price}`);
          console.log(`    Period: ${pkg.product.introPrice.period}`);
          console.log(`    Cycles: ${pkg.product.introPrice.cycles}`);
        }
      });
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
          
          // Track subscription purchase in TikTok
          const price = pkg.product.price;
          const productId = pkg.identifier;
          await tiktokService.trackSubscriptionPurchase(productId, price, pkg.product.currencyCode);
          
          // Clear the subscription flag
          await SecureStore.deleteItemAsync(SHOW_SUBSCRIPTION_KEY);
          
          // Show success modal
          setShowSuccessModal(true);
          
          // Animate success modal
          Animated.parallel([
            Animated.spring(successScale, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.timing(successOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
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
            
            // Show success modal
            setShowSuccessModal(true);
            
            // Animate success modal
            Animated.parallel([
              Animated.spring(successScale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
              }),
              Animated.timing(successOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start();
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
  const yearlyPkg = resolvePackage('annual', 2) || resolvePackage('yearly', 2);

  // Auto-select weekly if not set
  useEffect(() => {
    if (!selectedPackage && weeklyPkg) {
      setSelectedPackage(weeklyPkg.identifier);
    }
  }, [packages]); // Run when packages load

  // Helper to check if package has intro offer
  const hasIntroOffer = (pkg: any): boolean => {
    return pkg?.product?.introPrice !== null && pkg?.product?.introPrice !== undefined;
  };

  // Helper to get intro price display text
  const getIntroOfferText = (pkg: any): string | null => {
    if (!hasIntroOffer(pkg)) return null;
    
    const introPrice = pkg.product.introPrice;
    if (introPrice?.priceString) {
      return introPrice.priceString;
    }
    return null;
  };

  // Helper to calculate discount percentage
  const getDiscountPercentage = (pkg: any): string | null => {
    if (!hasIntroOffer(pkg)) return null;
    
    const introPrice = pkg.product.introPrice;
    const regularPrice = pkg.product.price;
    
    if (introPrice?.price && regularPrice) {
      const discount = Math.round(((regularPrice - introPrice.price) / regularPrice) * 100);
      return `${discount}% off`;
    }
    
    return null;
  };

  const renderPackage = (pkg: any, label: string, defaultBadge?: string) => {
    if (!pkg) return null;
    const isSelected = selectedPackage === pkg.identifier;
    
    // Dynamically determine badge and sublabel based on intro offer
    const hasIntro = hasIntroOffer(pkg);
    const discountText = getDiscountPercentage(pkg);
    const badge = hasIntro && discountText ? discountText : defaultBadge;
    const subLabel = hasIntro ? `${discountText} first period` : 'Cancel anytime';
    
    // Display intro price if available, otherwise show regular price
    const displayPrice = hasIntro && pkg.product.introPrice?.priceString 
      ? pkg.product.introPrice.priceString 
      : pkg.product.priceString;
    
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
             <Text style={[styles.planSubLabel, isSelected && styles.textSelectedSub]}>{subLabel}</Text>
          </View>
          <View style={styles.priceContainer}>
             <Text style={[styles.planPrice, isSelected && styles.textSelected]}>{displayPrice}</Text>
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
    
    // Find the selected package
    let selectedPkg = null;
    let period = '';
    
    if (selectedPackage.includes('weekly')) {
      selectedPkg = weeklyPkg;
      period = 'week';
    } else if (selectedPackage.includes('annual') || selectedPackage.includes('yearly')) {
      selectedPkg = yearlyPkg;
      period = 'year';
    }
    
    if (!selectedPkg) return '';
    
    // Check if package has intro offer
    const hasIntro = hasIntroOffer(selectedPkg);
    const regularPrice = selectedPkg.product.priceString;
    
    if (hasIntro) {
      const introPrice = getIntroOfferText(selectedPkg);
      const introPeriod = selectedPkg.product.introPrice?.period || period;
      
      if (introPrice) {
        return `Start trial for ${introPrice}, then ${regularPrice}/${period}`;
      }
    }
    
    // No intro offer
    return `Renews automatically at ${regularPrice}/${period}`;
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    successScale.setValue(0);
    successOpacity.setValue(0);
    router.replace('/home');
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
                
                // Always navigate to home screen when closing subscription
                router.replace('/home');
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
            {renderPackage(weeklyPkg, 'Weekly')}
            {renderPackage(yearlyPkg, 'Yearly', 'Best Value')}
          </View>

          {/* Bottom Action */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
              onPress={() => {
                const pkg = [weeklyPkg, yearlyPkg].find(p => p.identifier === selectedPackage);
                if (pkg) handlePurchase(pkg as PurchasesPackage);
              }}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.ctaText}>
                  {(() => {
                    const pkg = [weeklyPkg, yearlyPkg].find(p => p.identifier === selectedPackage);
                    if (pkg && hasIntroOffer(pkg)) {
                      return 'Start Trial';
                    }
                    return 'Continue';
                  })()}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.renewalText}>{getRenewalText()}</Text>
          </View>

        </View>
      </SafeAreaView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successModal,
              {
                transform: [{ scale: successScale }],
                opacity: successOpacity,
              },
            ]}
          >
            {/* Confetti/Celebration Icon */}
            <View style={styles.successIconContainer}>
              <Text style={styles.successEmoji}>🎉</Text>
              <View style={styles.successGlow} />
            </View>

            {/* Success Title */}
            <Text style={styles.successTitle}>Welcome to Pro!</Text>
            
            {/* Success Message */}
            <Text style={styles.successMessage}>
              You now have unlimited access to all features. Start creating amazing portraits!
            </Text>

            {/* Features unlocked */}
            <View style={styles.successFeatures}>
              <View style={styles.successFeatureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.successFeatureText}>Unlimited Generations</Text>
              </View>
              <View style={styles.successFeatureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.successFeatureText}>Custom Prompts</Text>
              </View>
              <View style={styles.successFeatureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.successFeatureText}>AI Editing Tools</Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessClose}
              activeOpacity={0.9}
            >
              <Text style={styles.successButtonText}>Start Creating</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
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

  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: '#1E293B',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: {
    fontSize: 72,
    textAlign: 'center',
  },
  successGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366F1',
    opacity: 0.15,
    zIndex: -1,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  successMessage: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successFeatures: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  successFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successFeatureText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
