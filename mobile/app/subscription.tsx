import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

export default function SubscriptionScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { setCredits } = useAppStore();

  useEffect(() => {
    loadOfferings();
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
        // Update subscription status in backend
        try {
          const response = await fetch(`${API_URL}/api/user/subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({ isSubscribed: true }),
          });
          
          if (response.ok) {
            console.log('✅ Subscription status updated in database');
          }
        } catch (updateError) {
          console.error('Failed to update subscription status:', updateError);
        }
        
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
        
        // Refresh credits to show unlimited
        const isPro = await checkProStatus();
        if (isPro) {
          setCredits({ 
            freeCredits: 999, 
            hasCredits: true, 
            isSubscribed: true 
          });
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
    subtitle: string,
    badge?: string,
    isPopular?: boolean
  ) => {
    const isSelected = selectedPackage === pkg.identifier;
    const isPurchasing = purchasing && isSelected;

    return (
      <TouchableOpacity
        style={[
          styles.packageCard,
          isPopular && styles.popularCard,
        ]}
        onPress={() => handlePurchase(pkg)}
        disabled={purchasing}
        activeOpacity={0.7}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>⭐ BEST VALUE</Text>
          </View>
        )}
        
        {badge && !isPopular && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        <View style={styles.packageHeader}>
          <View>
            <Text style={styles.packageTitle}>{title}</Text>
            <Text style={styles.packageSubtitle}>{subtitle}</Text>
          </View>
          <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
        </View>

        <View style={styles.featuresList}>
          <FeatureItem text="Unlimited AI portraits" />
          <FeatureItem text="All styles included" />
          <FeatureItem text="Priority processing" />
          <FeatureItem text="No watermarks" />
        </View>

        <View style={styles.buttonContainer}>
          {isPurchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isPopular ? 'Get Started' : 'Subscribe'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const monthlyPackage = getPackageByIdentifier(PACKAGE_IDS.MONTHLY);
  const yearlyPackage = getPackageByIdentifier(PACKAGE_IDS.ANNUAL);
  const lifetimePackage = getPackageByIdentifier(PACKAGE_IDS.LIFETIME);

  // If no specific packages found, show all available packages (for preview mode)
  const hasSpecificPackages = monthlyPackage || yearlyPackage || lifetimePackage;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Upgrade to Pro',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Unlock Unlimited Portraits</Text>
            <Text style={styles.headerSubtitle}>
              Create as many AI portraits as you want with Pro
            </Text>
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
                <>
                  {yearlyPackage && renderPackageCard(
                    yearlyPackage,
                    'Yearly',
                    'Best value - Save 33%',
                    undefined,
                    true
                  )}

                  {monthlyPackage && renderPackageCard(
                    monthlyPackage,
                    'Monthly',
                    'Cancel anytime'
                  )}

                  {lifetimePackage && renderPackageCard(
                    lifetimePackage,
                    'Lifetime',
                    'One-time payment',
                    '🔥 Limited Time'
                  )}
                </>
              ) : (
                /* Show all available packages (preview mode or custom setup) */
                packages.map((pkg, index) => renderPackageCard(
                  pkg,
                  pkg.identifier === 'preview-package-id' ? 'Preview Plan' : pkg.identifier,
                  index === 0 ? 'Test subscription' : 'Available plan',
                  undefined,
                  index === 0
                ))
              )}

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

              {/* Footer */}
              <Text style={styles.footerText}>
                • Subscriptions auto-renew unless cancelled{'\n'}
                • Cancel anytime in Google Play{'\n'}
                • Unlimited generations with any plan
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
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
  packageCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  popularCard: {
    borderColor: '#6366F1',
    backgroundColor: '#1E293B',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  packageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  packageSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  packagePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    color: '#E2E8F0',
    fontSize: 15,
    marginLeft: 10,
  },
  buttonContainer: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  restoreButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
});
