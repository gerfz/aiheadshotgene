import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store/useAppStore';
import { purchaseCredits } from '../src/services/api';
import { analytics } from '../src/services/posthog';

interface CreditPack {
  id: string;
  credits: number;
  price: string;
  priceValue: number;
  popular?: boolean;
  bonus?: string;
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'credits_500',
    credits: 500,
    price: '$2.99',
    priceValue: 2.99,
  },
  {
    id: 'credits_1500',
    credits: 1500,
    price: '$7.99',
    priceValue: 7.99,
    popular: true,
    bonus: '+100 bonus',
  },
  {
    id: 'credits_3500',
    credits: 3500,
    price: '$14.99',
    priceValue: 14.99,
    bonus: '+500 bonus',
  },
];

export default function CreditPacksScreen() {
  const { credits, setCredits } = useAppStore();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (pack: CreditPack) => {
    try {
      setPurchasing(pack.id);
      
      // Track purchase intent
      analytics.creditPackSelected(pack.id, pack.credits, pack.priceValue);
      
      // TODO: Integrate with actual payment processor (Stripe, RevenueCat, etc.)
      // For now, show alert
      Alert.alert(
        'Purchase Credits',
        `Purchase ${pack.credits} credits for ${pack.price}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy Now',
            onPress: async () => {
              try {
                // Generate transaction ID
                const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Call backend to add credits
                const result = await purchaseCredits(pack.id, pack.credits, transactionId);
                
                if (result.success) {
                  // Update local state
                  if (credits) {
                    setCredits({
                      ...credits,
                      totalCredits: result.totalCredits,
                      hasCredits: true,
                    });
                  }
                  
                  // Track successful purchase
                  analytics.creditPackPurchased(pack.id, pack.credits, pack.priceValue);
                  
                  Alert.alert(
                    'Success!',
                    `${pack.credits} credits added to your account!`,
                    [{ text: 'OK', onPress: () => router.back() }]
                  );
                }
              } catch (error) {
                console.error('Purchase failed:', error);
                Alert.alert('Purchase Failed', 'Please try again later.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error initiating purchase:', error);
      Alert.alert('Error', 'Failed to initiate purchase');
    } finally {
      setPurchasing(null);
    }
  };

  const getGenerationsCount = (credits: number) => {
    return Math.floor(credits / 200);
  };

  const getEditsCount = (credits: number) => {
    return Math.floor(credits / 50);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Buy Credits',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="diamond" size={48} color="#A78BFA" />
            </View>
            <Text style={styles.title}>Buy Credits</Text>
            <Text style={styles.subtitle}>
              Choose a credit pack that works for you
            </Text>
            <View style={styles.currentCredits}>
              <Text style={styles.currentCreditsLabel}>Current Balance:</Text>
              <Text style={styles.currentCreditsValue}>
                {credits?.totalCredits?.toLocaleString() || '0'} credits
              </Text>
            </View>
          </View>

          {/* Credit Packs */}
          <View style={styles.packsContainer}>
            {CREDIT_PACKS.map((pack) => (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packCard,
                  pack.popular && styles.packCardPopular
                ]}
                onPress={() => handlePurchase(pack)}
                disabled={purchasing !== null}
                activeOpacity={0.8}
              >
                {pack.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}

                <View style={styles.packHeader}>
                  <Ionicons 
                    name="diamond" 
                    size={32} 
                    color={pack.popular ? '#A78BFA' : '#6366F1'} 
                  />
                  <Text style={styles.packCredits}>
                    {pack.credits.toLocaleString()}
                  </Text>
                  <Text style={styles.packCreditsLabel}>credits</Text>
                  {pack.bonus && (
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusText}>{pack.bonus}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.packDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="images-outline" size={16} color="#94A3B8" />
                    <Text style={styles.detailText}>
                      {getGenerationsCount(pack.credits)} generations
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="color-wand-outline" size={16} color="#94A3B8" />
                    <Text style={styles.detailText}>
                      {getEditsCount(pack.credits)} edits
                    </Text>
                  </View>
                </View>

                <View style={styles.packFooter}>
                  <Text style={styles.packPrice}>{pack.price}</Text>
                  {purchasing === pack.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.buyButton}>
                      <Text style={styles.buyButtonText}>Buy Now</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Credit Usage</Text>
            <View style={styles.infoRow}>
              <Ionicons name="image-outline" size={20} color="#6366F1" />
              <Text style={styles.infoText}>Generation: 200 credits</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="color-wand-outline" size={20} color="#6366F1" />
              <Text style={styles.infoText}>Edit: 50 credits</Text>
            </View>
          </View>

          {/* Or Subscribe */}
          <View style={styles.subscribeSection}>
            <Text style={styles.orText}>OR</Text>
            <TouchableOpacity
              style={styles.subscribeCard}
              onPress={() => router.push('/subscription')}
              activeOpacity={0.8}
            >
              <View style={styles.subscribeContent}>
                <Ionicons name="infinite" size={32} color="#10B981" />
                <View style={styles.subscribeText}>
                  <Text style={styles.subscribeTitle}>Subscribe Weekly</Text>
                  <Text style={styles.subscribeSubtitle}>
                    3000 credits every week
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  currentCredits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  currentCreditsLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  currentCreditsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A78BFA',
  },
  packsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  packCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  packCardPopular: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#A78BFA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  packHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  packCredits: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  packCreditsLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  bonusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  packDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  packFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  subscribeSection: {
    alignItems: 'center',
  },
  orText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 16,
  },
  subscribeCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  subscribeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  subscribeText: {
    gap: 4,
  },
  subscribeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subscribeSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
