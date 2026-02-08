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
import { useAppStore } from '../src/store/useAppStore';
import { addCredits } from '../src/services/api';
import { analytics } from '../src/services/posthog';
import tiktokService from '../src/services/tiktok';
import appsFlyerService from '../src/services/appsflyer';
import { 
  getCreditPackOfferings, 
  purchaseCreditPack,
  CREDIT_PACK_IDS 
} from '../src/services/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

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

// Credit pack metadata
const CREDIT_PACK_META = {
  '5000credits': { credits: 5000, popular: false, best: false },
  '15000credits': { credits: 15000, popular: true, best: false },
  '50000credits': { credits: 50000, popular: false, best: true },
};

export default function CreditPacksScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0);
  const { setCredits, user } = useAppStore();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const screenViewTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    screenViewTimeRef.current = Date.now();
    loadCreditPacks();
    
    // Track credit pack screen viewed
    analytics.trackEvent('credit_pack_screen_viewed');
  }, []);

  const loadCreditPacks = async () => {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [2000, 3000, 5000]; // 2s, 3s, 5s
    
    setLoading(true);
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const availablePackages = await getCreditPackOfferings();
        
        if (availablePackages.length > 0) {
          setPackages(availablePackages);
          console.log(`✅ Loaded ${availablePackages.length} credit packs (attempt ${attempt + 1})`);
          
          // Auto-select the popular pack (15000 credits)
          const popularPack = availablePackages.find(p => 
            p.product.identifier === CREDIT_PACK_IDS.MEDIUM
          );
          if (popularPack) {
            setSelectedPack(popularPack.identifier);
          } else if (availablePackages.length > 0) {
            setSelectedPack(availablePackages[0].identifier);
          }
          setLoading(false);
          return; // Success - exit
        }
        
        // Empty packages - RevenueCat might not be ready
        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ No credit packs available (attempt ${attempt + 1}/${MAX_RETRIES + 1}) - retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        } else {
          console.error('❌ No credit packs available after all retries');
          setPackages([]);
          setLoading(false);
        }
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ Failed to load credit packs (attempt ${attempt + 1}): ${error} - retrying...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        } else {
          console.error('❌ Failed to load credit packs after all retries:', error);
          setLoading(false);
        }
      }
    }
  };

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

  const handlePurchase = async () => {
    if (!selectedPack) return;
    
    setPurchasing(true);
    try {
      const pkg = packages.find(p => p.identifier === selectedPack);
      if (!pkg) {
        Alert.alert('Error', 'Selected pack not found');
        return;
      }

      const meta = CREDIT_PACK_META[pkg.product.identifier as keyof typeof CREDIT_PACK_META];
      const credits = meta?.credits || 0;

      // Track purchase attempt
      analytics.trackEvent('credit_pack_clicked', {
        pack_id: pkg.identifier,
        product_id: pkg.product.identifier,
        credits: credits,
        price: pkg.product.priceString,
      });

      // Purchase the pack
      const customerInfo = await purchaseCreditPack(pkg);
      
      if (customerInfo) {
        // Get the transaction to verify purchase
        const transaction = customerInfo.nonSubscriptionTransactions.find(
          t => t.productIdentifier === pkg.product.identifier
        );
        
        if (transaction) {
          console.log('💳 Transaction confirmed:', transaction);
          
          // Update backend with new credits (uses self-healing auth)
          try {
            const data = await addCredits(
              credits,
              transaction.transactionIdentifier,
              pkg.product.identifier
            );
            console.log('✅ Credits added to backend:', data);
            
            // Update local state
            setCredits({ 
              totalCredits: data.totalCredits,
              hasCredits: true,
            });

            // Track successful purchase
            analytics.creditPackPurchased(
              pkg.identifier,
              pkg.product.identifier,
              credits,
              pkg.product.priceString
            );

            // Track in TikTok and AppsFlyer
            await tiktokService.trackEvent('credit_pack_purchased', {
              credits: credits,
              price: pkg.product.price,
              currency: pkg.product.currencyCode,
            });
            await appsFlyerService.trackEvent('credit_pack_purchased', {
              credits: credits,
              revenue: pkg.product.price,
              currency: pkg.product.currencyCode,
            });

            // Show success modal
            setPurchasedCredits(credits);
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
          } catch (backendError) {
            console.error('❌ Failed to update backend:', backendError);
            Alert.alert(
              'Purchase Successful',
              'Your purchase was successful, but we had trouble updating your account. Please restart the app.',
              [{ text: 'OK' }]
            );
          }
        }
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', 'Please try again.');
        analytics.creditPackPurchaseFailed(error.message || 'Unknown error');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleSuccessClose = async () => {
    setShowSuccessModal(false);
    successScale.setValue(0);
    successOpacity.setValue(0);
    
    // Navigate to home screen
    router.replace('/home');
    
    // Refresh credits in background to show updated balance
    try {
      const { getCredits } = await import('../src/services/api');
      const creditsData = await getCredits();
      setCredits(creditsData);
      console.log('✅ Credits refreshed after purchase:', creditsData);
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  };

  const renderCreditPack = (pkg: PurchasesPackage) => {
    const isSelected = selectedPack === pkg.identifier;
    const meta = CREDIT_PACK_META[pkg.product.identifier as keyof typeof CREDIT_PACK_META];
    
    if (!meta) return null;
    
    return (
      <TouchableOpacity 
        key={pkg.identifier}
        style={[styles.packCard, isSelected && styles.packCardSelected]} 
        onPress={() => setSelectedPack(pkg.identifier)}
        activeOpacity={0.9}
      >
        {meta.popular && (
          <View style={[styles.packBadge, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.packBadgeText}>Popular</Text>
          </View>
        )}
        {meta.best && (
          <View style={[styles.packBadge, { backgroundColor: '#10B981' }]}>
            <Text style={styles.packBadgeText}>Best</Text>
          </View>
        )}
        <View style={styles.packContent}>
          <View style={styles.packTextContainer}>
             <Text style={[styles.packName, isSelected && styles.textSelected]}>
               {meta.credits.toLocaleString()} Credits
             </Text>
          </View>
          <View style={styles.priceContainer}>
             <Text style={[styles.packPrice, isSelected && styles.textSelected]}>
               {pkg.product.priceString}
             </Text>
             <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                {isSelected && <View style={styles.radioButtonInner} />}
             </View>
          </View>
        </View>
      </TouchableOpacity>
    );
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
          
          {/* Close Button - top right */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
              const duration = (Date.now() - screenViewTimeRef.current) / 1000;
              analytics.trackEvent('credit_pack_screen_closed', {
                method: 'x_button',
                duration_seconds: duration,
              });
              router.back();
            }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" opacity={0.4} />
          </TouchableOpacity>

          {/* Spacer to push content down */}
          <View style={styles.spacer} />

          {/* Bottom Action */}
          <View style={styles.bottomSection}>
            {/* Title */}
            <Text style={styles.title}>Upgrade Your Plan</Text>
            <Text style={styles.subtitle}>
              Unlock more creative possibilities with extra credits. Pick an option that fits your needs.
            </Text>

            {/* Compact Feature Tags */}
            <View style={styles.featureTagsContainer}>
              <View style={styles.featureTag}>
                <Ionicons name="lock-open" size={14} color="#FFFFFF" />
                <Text style={styles.featureTagText}>AI Profiles</Text>
              </View>
              <View style={styles.featureTag}>
                <Ionicons name="lock-open" size={14} color="#FFFFFF" />
                <Text style={styles.featureTagText}>Personalized looks</Text>
              </View>
              <View style={styles.featureTag}>
                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                <Text style={styles.featureTagText}>Realistic results</Text>
              </View>
              <View style={styles.featureTag}>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                <Text style={styles.featureTagText}>Stunning collections</Text>
              </View>
            </View>

            {/* Credit Packs */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Loading credit packs...</Text>
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                <Text style={styles.errorText}>No credit packs available</Text>
                <Text style={styles.errorSubtext}>Please try again later</Text>
              </View>
            ) : (
              <>
                <View style={styles.packsContainer}>
                  {packages.map(pack => renderCreditPack(pack))}
                </View>

                {/* Purchase Button */}
                <TouchableOpacity
                  style={[styles.ctaButton, (purchasing || !selectedPack) && styles.ctaButtonDisabled]}
                  onPress={handlePurchase}
                  disabled={purchasing || !selectedPack}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.ctaText}>Add Credits</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Easy to cancel text */}
            <Text style={styles.easyToCancelText}>Easy to cancel.</Text>

            {/* Footer Links */}
            <View style={styles.footerLinks}>
              <TouchableOpacity>
                <Text style={styles.footerLinkText}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>|</Text>
              <TouchableOpacity>
                <Text style={styles.footerLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.footerSeparator}>|</Text>
              <TouchableOpacity>
                <Text style={styles.footerLinkText}>Already Subscribed?</Text>
              </TouchableOpacity>
            </View>
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
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Text style={styles.successEmoji}>💳</Text>
              <View style={styles.successGlow} />
            </View>

            {/* Success Title */}
            <Text style={styles.successTitle}>Credits Added!</Text>
            
            {/* Success Message */}
            <Text style={styles.successMessage}>
              {purchasedCredits.toLocaleString()} credits have been added to your account. Start creating amazing portraits!
            </Text>

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
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 10,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  spacer: {
    flex: 1,
  },
  
  // Compact Feature Tags
  featureTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
    width: '100%',
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  featureTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },

  // Loading & Error states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#94A3B8',
    fontSize: 14,
  },

  // Credit Packs
  packsContainer: {
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  packCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    height: 70,
    justifyContent: 'center',
  },
  packCardSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  packContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packTextContainer: {
    justifyContent: 'center',
  },
  packName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  textSelected: {
    color: '#6366F1',
  },
  packBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  packBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },

  // Bottom Section
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  easyToCancelText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  footerLinkText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '400',
  },
  footerSeparator: {
    color: '#64748B',
    fontSize: 12,
    marginHorizontal: 8,
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
