import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { signOut } from '../src/services/supabase';
import { CreditsDisplay, BottomNav, Toast } from '../src/components';
import { getCredits, getGenerations } from '../src/services/api';

export default function ProfileScreen() {
  const { user, isGuest, credits, generations, setUser } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreditsToast, setShowCreditsToast] = useState(false);
  const [previousCredits, setPreviousCredits] = useState<number | null>(null);

  // Refresh credits and generations
  const refreshData = async () => {
    if (isGuest) return;
    
    setRefreshing(true);
    try {
      // Store previous credits before refresh
      const oldCredits = credits?.freeCredits || 0;
      
      // Force refresh from backend
      const [creditsData, generationsData] = await Promise.all([
        getCredits(),
        getGenerations()
      ]);
      
      // Check if credits increased (email verification)
      const newCredits = creditsData.freeCredits || 0;
      if (newCredits > oldCredits && creditsData.emailVerified && !credits?.emailVerified) {
        // Email was just verified and credits were awarded
        setShowCreditsToast(true);
      }
      
      // Update store with fresh data
      useAppStore.setState({ 
        credits: creditsData,
        generations: generationsData 
      });
      
      console.log('Profile data refreshed:', creditsData);
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshData();
      
      // Poll for verification status every 5 seconds if not verified
      let interval: NodeJS.Timeout | null = null;
      if (!isGuest && credits && !credits.emailVerified) {
        interval = setInterval(() => {
          refreshData();
        }, 5000); // Check every 5 seconds
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [isGuest, credits?.emailVerified])
  );

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
            // Guest mode will be restored by _layout.tsx
          },
        },
      ]
    );
  };

  const handleSignUp = () => {
    router.push({ pathname: '/login', params: { mode: 'signup' } });
  };

  const handleSubscription = () => {
    router.push('/subscription');
  };

  const completedCount = Array.isArray(generations) 
    ? generations.filter(g => g.status === 'completed').length 
    : 0;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <Toast
        message="🎉 3 Free Credits Added!"
        visible={showCreditsToast}
        onHide={() => setShowCreditsToast(false)}
        duration={2000}
        icon="gift"
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
          {/* User/Guest Info Card */}
          <View style={styles.card}>
            <View style={[styles.avatarContainer, isGuest && styles.avatarGuest]}>
              <Text style={styles.avatarText}>
                {isGuest ? '👤' : user?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            {isGuest ? (
              <>
                <Text style={styles.guestTitle}>Guest User</Text>
                <Text style={styles.guestSubtitle}>Sign up to save your portraits</Text>
                <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                  <Text style={styles.signUpButtonText}>Create Free Account</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.email}>{user?.email}</Text>
                <View style={styles.verificationContainer}>
                  {credits?.emailVerified ? (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedIcon}>✓</Text>
                      <Text style={styles.verifiedText}>Email Verified</Text>
                    </View>
                  ) : (
                    <View style={styles.unverifiedBadge}>
                      <Text style={styles.unverifiedIcon}>!</Text>
                      <Text style={styles.unverifiedText}>Email Not Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userId}>ID: {user?.id?.slice(0, 8)}...</Text>
              </>
            )}
          </View>

          {/* Credits Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isGuest ? 'Free Credits' : 'Subscription'}
            </Text>
            
            {/* Subscription Status */}
            {!isGuest && credits?.isSubscribed && (
              <View style={styles.proBadge}>
                <Text style={styles.proIcon}>⭐</Text>
                <Text style={styles.proText}>Pro Member - Unlimited Generations</Text>
              </View>
            )}
            
            {/* Credits Display */}
            {!credits?.isSubscribed && (
              <View style={styles.creditsWrapper}>
                <CreditsDisplay credits={credits} />
              </View>
            )}
            
            {isGuest ? (
              <View style={styles.guestCreditsInfo}>
                <Text style={styles.guestCreditsText}>
                  {credits?.hasCredits 
                    ? `${credits.freeCredits} free generation${credits.freeCredits === 1 ? '' : 's'} remaining`
                    : 'No free credits remaining'}
                </Text>
                {!credits?.hasCredits && (
                  <TouchableOpacity style={styles.upgradeButton} onPress={handleSignUp}>
                    <Text style={styles.upgradeButtonText}>Sign Up for More</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {!credits?.isSubscribed && (
                  <View style={styles.guestCreditsInfo}>
                    <Text style={styles.guestCreditsText}>
                      {credits?.hasCredits 
                        ? `${credits.freeCredits} free generation${credits.freeCredits === 1 ? '' : 's'} remaining`
                        : 'No free credits remaining'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={styles.upgradeButton} onPress={handleSubscription}>
                  <Text style={styles.upgradeButtonText}>
                    {credits?.isSubscribed ? 'Manage Subscription' : 'Upgrade to Pro'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Stats Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Statistics</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedCount}</Text>
                <Text style={styles.statLabel}>Portraits Created</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{credits?.freeCredits || 0}</Text>
                <Text style={styles.statLabel}>Credits Remaining</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          {isGuest ? (
            <View style={styles.guestActions}>
              <TouchableOpacity style={styles.signInButton} onPress={handleSignUp}>
                <Text style={styles.signInButtonText}>Sign In / Sign Up</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
        <BottomNav />
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
    paddingTop: 60,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarGuest: {
    backgroundColor: '#475569',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  verificationContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedIcon: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  unverifiedIcon: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  unverifiedText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  signUpButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  creditsWrapper: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  guestCreditsInfo: {
    alignItems: 'center',
  },
  guestCreditsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  proIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  proText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  guestActions: {
    marginTop: 8,
  },
  signInButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 24,
  },
});
