import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

const { width } = Dimensions.get('window');

// Sample images from your style folders
const SAMPLE_IMAGES = [
  require('../assets/business/518559229-793ad242-7867-4709-bdc6-55021f5eb78f.png'),
  require('../assets/emotionalfilm/518559958-243d1b11-9ef0-4d4f-b308-97d67b5d3bc3.png'),
  require('../assets/victoriasecret/G6TSEqzWYAIvaf9.jpg'),
  require('../assets/victoriasecret/G6TSEscXQAAm3Lo.jpg'),
  require('../assets/victoriasecret/G6TSEuEWEAAaR7N.jpg'),
  require('../assets/professionalheadshot/example1.png'),
  require('../assets/1990s camera style/example1.png'),
  require('../assets/withpuppy/example1.png'),
];

export default function SubscriptionScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { setCredits } = useAppStore();
  const scrollX = useState(new Animated.Value(0))[0];
  const scrollViewRef = React.useRef<any>(null);

  useEffect(() => {
    loadOfferings();
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
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const loadOfferings = async () => {
    try {
      console.log('🔄 Loading offerings...');
      const availablePackages = await getOfferings();
      console.log('📦 Received packages:', availablePackages.length);
      console.log('📦 Package details:', availablePackages.map(p => ({
        id: p.identifier,
        product: p.product.identifier,
        price: p.product.priceString
      })));
      setPackages(availablePackages);
      
      if (availablePackages.length === 0) {
        console.warn('⚠️ No packages available. Check RevenueCat dashboard!');
      }
    } catch (error) {
      console.error('❌ Failed to load offerings:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    setSelectedPackage(pkg.identifier);

    try {
      const customerInfo = await purchasePackage(pkg);
      
      if (customerInfo) {
        // Check if user has pro access
        const isPro = await checkProStatus();
        
        if (isPro) {
          // Update subscription status in backend and wait for it
          try {
            const session = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/api/user/subscription`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session?.access_token}`,
              },
              body: JSON.stringify({ isSubscribed: true }),
            });
            
            if (response.ok) {
              console.log('✅ Subscription status updated in database');
              
              // Now update local state
              setCredits({ 
                freeCredits: 999, 
                hasCredits: true, 
                isSubscribed: true 
              });
            } else {
              console.error('Failed to update subscription in backend');
              // Still update local state
              setCredits({ 
                freeCredits: 999, 
                hasCredits: true, 
                isSubscribed: true 
              });
            }
          } catch (updateError) {
            console.error('Error updating subscription status:', updateError);
            // Still update local state
            setCredits({ 
              freeCredits: 999, 
              hasCredits: true, 
              isSubscribed: true 
            });
          }
          
          // Wait a moment for backend to fully update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          Alert.alert(
            '🎉 Success!',
            'You now have unlimited AI portrait generations!',
            [
              {
                text: 'Start Creating',
                onPress: () => router.back(),
              },
            ]
          );
        }
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const customerInfo = await restorePurchases();
      
      if (customerInfo) {
        const isPro = await checkProStatus();
        if (isPro) {
          Alert.alert(
            '✅ Restored!',
            'Your subscription has been restored.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          Alert.alert('No Purchases Found', 'No active subscriptions to restore.');
        }
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const getPackageByIdentifier = (identifier: string) => {
    return packages.find(pkg => pkg.identifier === identifier);
  };

  const renderPackageCard = (
    pkg: PurchasesPackage,
    title: string,
    badge?: string,
    isPopular?: boolean
  ) => {
    const isSelected = selectedPackage === pkg.identifier;

    return (
      <TouchableOpacity
        style={[
          styles.packageCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => setSelectedPackage(pkg.identifier)}
        activeOpacity={0.8}
        disabled={purchasing}
      >
        {badge && (
          <View style={[styles.badge, isPopular && styles.popularBadge]}>
            <Text style={isPopular ? styles.popularBadgeText : styles.badgeText}>{badge}</Text>
          </View>
        )}

        <View style={styles.packageContent}>
          <View style={styles.packageLeft}>
            <Text style={styles.packageTitle}>{title}</Text>
            <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
          </View>
          
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
            </View>
          )}
        </View>

        <Text style={styles.cancelText}>Cancel anytime.</Text>
      </TouchableOpacity>
    );
  };

  const weeklyPackage = getPackageByIdentifier(PACKAGE_IDS.WEEKLY);
  const monthlyPackage = getPackageByIdentifier(PACKAGE_IDS.MONTHLY);
  const yearlyPackage = getPackageByIdentifier(PACKAGE_IDS.ANNUAL);

  // If no specific packages found, show all available packages (for preview mode)
  const hasSpecificPackages = weeklyPackage || monthlyPackage || yearlyPackage;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        {/* Animated Background with Sample Images */}
        <View style={styles.backgroundContainer}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            style={styles.imageScroll}
          >
            {SAMPLE_IMAGES.map((image, index) => (
              <Image
                key={index}
                source={image}
                style={styles.backgroundImage}
                blurRadius={2}
              />
            ))}
          </Animated.ScrollView>
          <View style={styles.overlay} />
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create <Text style={styles.aiText}>AI Headshots</Text></Text>
            <Text style={styles.headerSubtitle}>
              Generate photos of yourself with AI. Convert{'\n'}your selfies into realistic photos.
            </Text>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresPreview}>
            <View style={styles.featureBox}>
              <View style={styles.featureIcon}>
                <Ionicons name="infinite" size={32} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Unlimited Generations</Text>
                <Text style={styles.featureDescription}>Create as many portraits as you want</Text>
              </View>
            </View>

            <View style={styles.featureBox}>
              <View style={styles.featureIcon}>
                <Ionicons name="color-wand" size={32} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Custom Style Prompts</Text>
                <Text style={styles.featureDescription}>Write your own unique prompts</Text>
              </View>
            </View>

            <View style={styles.featureBox}>
              <View style={styles.featureIcon}>
                <Ionicons name="create" size={32} color="#6366F1" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Edit & Refine Results</Text>
                <Text style={styles.featureDescription}>Perfect your portraits with AI editing</Text>
              </View>
            </View>
          </View>

          {/* Loading State */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading options...</Text>
            </View>
          ) : packages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.headerTitle}>⚠️ No Packages Available</Text>
              <Text style={styles.footerText}>
                Please make sure:{'\n\n'}
                1. Products are created in Google Play Console{'\n'}
                2. Products are synced to RevenueCat{'\n'}
                3. An offering is created and set as "Current"{'\n'}
                4. App is installed from Play Store (not sideloaded)
              </Text>
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={loadOfferings}
              >
                <Text style={styles.restoreButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Show specific packages if available */}
              {hasSpecificPackages ? (
                <View style={styles.packagesContainer}>
                  {weeklyPackage && renderPackageCard(
                    weeklyPackage,
                    'Weekly',
                    '1-week trial'
                  )}

                  {monthlyPackage && renderPackageCard(
                    monthlyPackage,
                    'Monthly',
                    undefined
                  )}

                  {yearlyPackage && renderPackageCard(
                    yearlyPackage,
                    'Yearly',
                    'Popular',
                    true
                  )}
                </View>
              ) : (
                /* Show mock packages for preview/simulator */
                <View style={styles.packagesContainer}>
                  {/* Weekly Mock */}
                  {packages[0] && renderPackageCard(
                    { 
                      ...packages[0], 
                      identifier: '$rc_weekly',
                      product: { 
                        ...packages[0].product, 
                        priceString: '$2.99',
                        identifier: 'weekly_pro'
                      } 
                    } as any,
                    'Weekly',
                    '1-week trial'
                  )}

                  {/* Monthly Mock */}
                  {packages[0] && renderPackageCard(
                    { 
                      ...packages[0], 
                      identifier: '$rc_monthly',
                      product: { 
                        ...packages[0].product, 
                        priceString: '$9.99',
                        identifier: 'monthly_pro'
                      } 
                    } as any,
                    'Monthly',
                    undefined
                  )}

                  {/* Yearly Mock */}
                  {packages[0] && renderPackageCard(
                    { 
                      ...packages[0], 
                      identifier: '$rc_annual',
                      product: { 
                        ...packages[0].product, 
                        priceString: '$39.99',
                        identifier: 'yearly_pro'
                      } 
                    } as any,
                    'Yearly',
                    'Popular',
                    true
                  )}
                </View>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.continueButton, !selectedPackage && styles.continueButtonDisabled]}
                onPress={() => {
                  if (selectedPackage) {
                    const pkg = packages.find(p => p.identifier === selectedPackage);
                    if (pkg) handlePurchase(pkg);
                  }
                }}
                disabled={purchasing || !selectedPackage}
              >
                {purchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.continueButtonText}>Start Free Trial</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <Text style={styles.footerText}>
                Renews automatically at {selectedPackage ? packages.find(p => p.identifier === selectedPackage)?.product.priceString : '€X.XX'} per {selectedPackage?.includes('year') ? 'year' : selectedPackage?.includes('month') ? 'month' : 'week'}.
              </Text>

              {/* Restore Button */}
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestore}
                disabled={purchasing}
              >
                <Text style={styles.restoreButtonText}>
                  Restore Purchases
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  imageScroll: {
    flex: 1,
  },
  backgroundImage: {
    width: width,
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  aiText: {
    color: '#6366F1',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresPreview: {
    marginBottom: 32,
    gap: 12,
  },
  featureBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
  },
  packagesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadge: {
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  popularBadgeText: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageLeft: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  checkmark: {
    marginLeft: 12,
  },
  cancelText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  continueButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
  },
});
