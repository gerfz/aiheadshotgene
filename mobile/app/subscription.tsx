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
  SafeAreaView,
  Platform,
  StatusBar,
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

const { width, height } = Dimensions.get('window');

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
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

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
      if (customerInfo && await checkProStatus()) {
        Alert.alert('✅ Restored!', 'Your subscription has been restored.', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        Alert.alert('No Purchases', 'No active subscription found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
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

  const renderPackage = (pkg: any, label: string, subLabel?: string, badge?: string) => {
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
              onPress={() => router.back()}
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

            <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
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
    justifyContent: 'space-between', // Distribute space evenly
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
    marginBottom: 10,
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
    marginBottom: 10,
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
  restoreButton: {
    paddingVertical: 4,
  },
  restoreText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
});
