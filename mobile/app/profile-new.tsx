import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store/useAppStore';
import { signOut } from '../src/services/supabase';
import { getCredits, getGenerations } from '../src/services/api';
import { restorePurchases, checkProStatus } from '../src/services/purchases';
import { FeedbackModal } from '../src/components/FeedbackModal';
import { trackEvent } from '../src/services/posthog';

export default function ProfileScreen() {
  const { user, setUser, credits, setCredits, isGuest, generations, setGenerations } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Define userId early so it can be used in functions
  const userId = user?.id?.slice(0, 13) || 'guest';

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [creditsData, generationsData] = await Promise.all([
        getCredits(),
        getGenerations(),
      ]);
      
      setCredits(creditsData);
      setGenerations(Array.isArray(generationsData.generations) ? generationsData.generations : []);
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSubscription = () => {
    router.push('/subscription');
  };

  const handleBuyCredits = () => {
    router.push('/credit-packs');
  };

  const handleSignUp = () => {
    router.push({ pathname: '/login', params: { mode: 'signup' } });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            setUser(null);
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleContactUs = () => {
    // Track feedback request
    trackEvent('feedback_requested', {
      source: 'profile_contact_us',
    });
    
    // Show feedback modal
    setShowFeedbackModal(true);
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const handleTermsOfUse = () => {
    router.push('/terms-of-use');
  };

  const handleRateUs = async () => {
    try {
      const packageName = Application.applicationId || 'com.aiportrait.studio';
      const playStoreUrl = `market://details?id=${packageName}`;
      const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
      
      // Try to open Play Store app first
      const canOpen = await Linking.canOpenURL(playStoreUrl);
      if (canOpen) {
        await Linking.openURL(playStoreUrl);
      } else {
        // Fallback to web browser
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open Play Store:', error);
      Alert.alert('Error', 'Could not open Play Store');
    }
  };

  const handleShareApp = async () => {
    try {
      const packageName = Application.applicationId || 'com.aiportrait.studio';
      const shareUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
      const message = `Check out Act! Create stunning professional portraits with AI.\n\n${shareUrl}`;
      
      // Use the Share API
      await Share.share({
        message: message,
        title: 'Act',
      });
    } catch (error) {
      console.error('Failed to share app:', error);
    }
  };

  const handleCopyUserId = async () => {
    try {
      await Clipboard.setStringAsync(userId);
      Alert.alert('Copied!', 'User ID copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', 'Failed to copy User ID');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setRefreshing(true);
      
      // Restore purchases from Google Play
      const customerInfo = await restorePurchases();
      
      if (!customerInfo) {
        Alert.alert('Error', 'Failed to restore purchases. Please try again.');
        return;
      }
      
      // Check if user has active subscription
      const isPro = await checkProStatus();
      
      if (isPro) {
        // Update subscription status in backend
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.id}`,
            },
            body: JSON.stringify({ isSubscribed: true }),
          });
          
          if (response.ok) {
            // Refresh credits to show updated subscription status
            const creditsData = await getCredits();
            setCredits(creditsData);
            
            Alert.alert(
              '✅ Subscription Restored!',
              'Your subscription has been successfully restored.',
              [{ text: 'OK' }]
            );
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
      setRefreshing(false);
    }
  };

  const completedCount = Array.isArray(generations) 
    ? generations.filter(g => g.status === 'completed').length 
    : 0;

  // Get version info from app.json via expo-constants
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.android?.versionCode || 
                      Constants.expoConfig?.ios?.buildNumber || 
                      '1';
  const versionString = `${appVersion} (${buildNumber})`;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600', fontSize: 20 },
        }} 
      />
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshData}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
        >
          {/* Premium Card (if not subscribed) */}
          {!credits?.isSubscribed && (
            <TouchableOpacity 
              style={styles.premiumCard}
              onPress={handleSubscription}
              activeOpacity={0.9}
            >
              <View style={styles.premiumContent}>
                <Text style={styles.premiumTitle}>Become Pro</Text>
                <Text style={styles.premiumSubtitle}>Get full access to all features</Text>
                
                <TouchableOpacity style={styles.tryProButton} onPress={handleSubscription}>
                  <Text style={styles.tryProButtonText}>Try Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionButton} onPress={handleRateUs}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="star" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Rate Us</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShareApp}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="share-social" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Share App</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* General Section */}
          <Text style={styles.sectionTitle}>General</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow} onPress={handleBuyCredits}>
              <View style={styles.settingLeft}>
                <Ionicons name="wallet" size={24} color="#F59E0B" />
                <Text style={styles.settingText}>Buy Credits</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow} onPress={handleContactUs}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Contact Us</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow} onPress={handlePrivacyPolicy}>
              <View style={styles.settingLeft}>
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow} onPress={handleTermsOfUse}>
              <View style={styles.settingLeft}>
                <Ionicons name="document-text" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Terms of Use</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow} onPress={handleCopyUserId}>
              <View style={styles.settingLeft}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>User ID</Text>
              </View>
              <View style={styles.userIdContainer}>
                <Text style={styles.userIdText}>{userId}</Text>
                <Ionicons name="copy" size={16} color="#64748B" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow} onPress={handleSubscription}>
              <View style={styles.settingLeft}>
                <Ionicons name="card" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Subscription Management</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow} onPress={handleRestorePurchases}>
              <View style={styles.settingLeft}>
                <Ionicons name="reload" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Restore Subscriptions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Sign Up Button (if guest) */}
          {isGuest && (
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Create Free Account</Text>
            </TouchableOpacity>
          )}

          {/* Version */}
          <Text style={styles.version}>{versionString}</Text>
        </ScrollView>

        {/* Feedback Modal */}
        <FeedbackModal
          visible={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          userId={user?.id}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Premium Card
  premiumCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    overflow: 'hidden',
  },
  premiumContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsContainer: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  tryProButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingHorizontal: 40,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tryProButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Action Buttons
  actionsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Settings Section
  sectionTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userIdText: {
    color: '#64748B',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
  },
  
  // Buttons
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Version
  version: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});

