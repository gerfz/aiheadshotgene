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
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store/useAppStore';
import { signOut } from '../src/services/supabase';
import { getCredits, getGenerations } from '../src/services/api';

export default function ProfileScreen() {
  const { user, setUser, credits, setCredits, isGuest, generations, setGenerations } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

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
    Linking.openURL('mailto:support@aiportrait.app');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://aiportraitapp.netlify.app/');
  };

  const completedCount = Array.isArray(generations) 
    ? generations.filter(g => g.status === 'completed').length 
    : 0;

  const userId = user?.id?.slice(0, 13) || 'guest';

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
              style={styles.premiumCard}
              onPress={handleSubscription}
              activeOpacity={0.9}
            >
              <View style={styles.premiumContent}>
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.benefitText}>Multiple Results</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.benefitText}>Fast processing</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.benefitText}>Remove all ads</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.tryProButton} onPress={handleSubscription}>
                  <Text style={styles.tryProButtonText}>Try Pro Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="star" size={24} color="#6366F1" />
              </View>
              <Text style={styles.actionButtonText}>Rate Us</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="share-social" size={24} color="#6366F1" />
              </View>
              <Text style={styles.actionButtonText}>Share App</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
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
            
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="document-text" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Terms of use</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>User Id</Text>
              </View>
              <View style={styles.userIdContainer}>
                <Text style={styles.userIdText}>{userId}</Text>
                <Ionicons name="copy" size={16} color="#64748B" />
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
            
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Format App</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="reload" size={24} color="#FFFFFF" />
                <Text style={styles.settingText}>Restore Subscriptions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Logout Button (if not guest) */}
          {!isGuest && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}

          {/* Sign Up Button (if guest) */}
          {isGuest && (
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Create Free Account</Text>
            </TouchableOpacity>
          )}

          {/* Version */}
          <Text style={styles.version}>1.3.0 (81)</Text>
        </ScrollView>
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
  premiumCard: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  premiumContent: {
    gap: 20,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tryProButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Action Buttons
  actionsCard: {
    backgroundColor: '#1E293B',
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
    backgroundColor: '#0F172A',
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
  },
  userIdText: {
    color: '#64748B',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
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

