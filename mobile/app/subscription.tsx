import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';

type PlanType = 'monthly' | 'yearly';

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');

  const handleSubscribe = async () => {
    Alert.alert(
      'Setup Required',
      'To enable purchases, configure RevenueCat with a development build (not Expo Go)',
      [{ text: 'OK' }]
    );
  };

  const plans = {
    monthly: {
      price: '$4.99',
      period: 'month',
      savings: null,
    },
    yearly: {
      price: '$39.99',
      period: 'year',
      savings: 'Save 33%',
    },
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Go Pro', presentation: 'modal' }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.icon}>⭐</Text>
            <Text style={styles.title}>Upgrade to Pro</Text>
            <Text style={styles.subtitle}>
              Unlock unlimited professional portraits
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Unlimited portrait generations</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>All professional styles</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>High-resolution downloads</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Priority processing</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>New styles added regularly</Text>
            </View>
          </View>

          <View style={styles.plans}>
            <TouchableOpacity
              style={[
                styles.plan,
                selectedPlan === 'yearly' && styles.planSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              {plans.yearly.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plans.yearly.savings}</Text>
                </View>
              )}
              <View style={styles.planRadio}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPlan === 'yearly' && styles.radioOuterSelected,
                  ]}
                >
                  {selectedPlan === 'yearly' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planPrice}>
                  {plans.yearly.price}
                  <Text style={styles.planPeriod}>/{plans.yearly.period}</Text>
                </Text>
                <Text style={styles.planNote}>$3.33/month, billed annually</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.plan,
                selectedPlan === 'monthly' && styles.planSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planRadio}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPlan === 'monthly' && styles.radioOuterSelected,
                  ]}
                >
                  {selectedPlan === 'monthly' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>
                  {plans.monthly.price}
                  <Text style={styles.planPeriod}>/{plans.monthly.period}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Maybe later</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            Subscription automatically renews unless cancelled at least 24 hours
            before the end of the current period. Cancel anytime.
          </Text>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  features: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  plans: {
    gap: 12,
    marginBottom: 24,
  },
  plan: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  planSelected: {
    borderColor: '#6366F1',
  },
  savingsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planRadio: {
    marginRight: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#6366F1',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  planNote: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  subscribeButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
  },
  terms: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

