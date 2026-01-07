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
  TextInput,
  Modal,
  ImageBackground,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { useAppStore } from '../src/store/useAppStore';
import { signOut, supabase } from '../src/services/supabase';
import { getCredits, getGenerations } from '../src/services/api';
import { restorePurchases, checkProStatus } from '../src/services/purchases';
import Constants from 'expo-constants';
import posthog from '../src/services/posthog';
import { FeedbackModal } from '../src/components/FeedbackModal';

export default function ProfileScreen() {
  const { user, setUser, credits, setCredits, generations, setGenerations } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    // Get device ID on mount
    const getDeviceId = async () => {
      try {
        const id = Application.getAndroidId();
        setDeviceId(id || user?.id?.substring(0, 8) || 'unknown');
      } catch (error) {
        console.error('Failed to get device ID:', error);
        setDeviceId(user?.id?.substring(0, 8) || 'unknown');
      }
    };
    getDeviceId();
  }, [user?.id]);

  const loadUserEmail = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user?.id)
        .single();
      
      if (data && data.email && !data.email.includes('@anonymous.local')) {
        setUserEmail(data.email);
        setEmailInput(data.email);
      }
    } catch (error) {
      console.error('Failed to load user email:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadUserEmail();
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserEmail();
  }, []);

  const handleSubscription = () => {
    router.push('/subscription');
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
    posthog.capture('feedback_requested', {
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
      const packageName = Application.applicationId || 'com.aiportrait.app';
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
      const packageName = Application.applicationId || 'com.aiportrait.app';
      const shareUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
      const message = `Check out AI Portrait Studio! Create stunning professional portraits with AI.\n\n${shareUrl}`;
      
      // Use the Share API
      await Share.share({
        message: message,
        title: 'AI Portrait Studio',
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

  const handleEmailPress = () => {
    setShowEmailModal(true);
  };

  const handleSaveEmail = async () => {
    if (!emailInput.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      console.log('Updating email for user:', user?.id);
      console.log('New email:', emailInput.trim());
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ email: emailInput.trim() })
        .eq('id', user?.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      setUserEmail(emailInput.trim());
      setShowEmailModal(false);
      Alert.alert('Success', 'Email updated successfully');
    } catch (error: any) {
      console.error('Failed to update email:', error);
      const errorMessage = error?.message || 'Failed to update email. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const completedCount = Array.isArray(generations) 
    ? generations.filter(g => g.status === 'completed').length 
    : 0;

  // Use the full Supabase UID for identification
  const userId = user?.id || 'loading...';
  const userIdPreview = userId.length > 8 ? userId.substring(0, 8) + '...' : userId;

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
          headerStyle: { backgroundColor: '#0F172A' },
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
              style={styles.premiumCardWrapper}
              onPress={handleSubscription}
              activeOpacity={0.95}
            >
              <ImageBackground
                source={{ uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/victoriasecret/G6TSEqzWYAIvaf9.jpg' }}
                style={styles.premiumBackground}
                imageStyle={{ borderRadius: 24, opacity: 0.6 }}
              >
                <View style={styles.premiumOverlay}>
                  <View style={styles.premiumHeader}>
                    <Text style={styles.premiumTitle}>Unlock Pro Access</Text>
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  </View>
                  
                  <View style={styles.premiumFeatures}>
                    <View style={styles.featureItem}>
                      <View style={styles.featureIconBox}>
                        <Ionicons name="infinite" size={20} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text style={styles.featureTitle}>Unlimited Generations</Text>
                        <Text style={styles.featureSubtitle}>Create as many portraits as you want</Text>
                      </View>
                    </View>
                    
                    <View style={styles.featureItem}>
                      <View style={[styles.featureIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                        <Ionicons name="sparkles" size={20} color="#F472B6" />
                      </View>
                      <View>
                        <Text style={styles.featureTitle}>Custom Style Prompts</Text>
                        <Text style={styles.featureSubtitle}>Write your own unique prompts</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.upgradeButton} onPress={handleSubscription}>
                    <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard} onPress={handleRateUs}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="star" size={24} color="#6366F1" />
              </View>
              <Text style={styles.actionCardText}>Rate Us</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleShareApp}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="share-social" size={24} color="#6366F1" />
              </View>
              <Text style={styles.actionCardText}>Share App</Text>
            </TouchableOpacity>
          </View>

          {/* General Section */}
          <Text style={styles.sectionTitle}>General</Text>
          
          <View style={styles.settingsCard}>
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
                <Text style={styles.userIdText}>
                  {userIdPreview}
                </Text>
                <Ionicons name="copy" size={16} color="#64748B" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow} onPress={handleEmailPress}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Email</Text>
              </View>
              <View style={styles.emailContainer}>
                <Text style={styles.emailText}>
                  {userEmail || 'Not set'}
                </Text>
                <Ionicons name="create-outline" size={16} color="#64748B" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="star" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Tier</Text>
              </View>
              <View style={styles.tierContainer}>
                <Text style={[styles.tierText, credits?.isSubscribed && styles.tierTextPro]}>
                  {credits?.isSubscribed ? 'Pro' : 'Free'}
                </Text>
              </View>
            </View>
            
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


          {/* Version */}
          <Text style={styles.version}>{versionString}</Text>
        </ScrollView>

        {/* Email Modal */}
        <Modal
          visible={showEmailModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEmailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Email Address</Text>
              <Text style={styles.modalSubtitle}>
                This email will be used for contact purposes
              </Text>
              
              <TextInput
                style={styles.emailInput}
                placeholder="Enter your email"
                placeholderTextColor="#64748B"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setEmailInput(userEmail);
                    setShowEmailModal(false);
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleSaveEmail}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Premium Card
  premiumCardWrapper: {
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  premiumBackground: {
    width: '100%',
    minHeight: 280,
  },
  premiumOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 24,
    justifyContent: 'space-between',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  proBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  premiumFeatures: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  upgradeButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  
  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    backgroundColor: '#1E293B',
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
    flex: 1,
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },
  userIdText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },
  emailText: {
    color: '#64748B',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tierText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  tierTextPro: {
    color: '#6366F1',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  
  // Buttons
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

  // Email Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 20,
  },
  emailInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#334155',
  },
  modalButtonSave: {
    backgroundColor: '#6366F1',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextCancel: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
});

