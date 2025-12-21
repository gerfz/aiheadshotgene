import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { signOut } from '../src/services/supabase';
import { CreditsDisplay, BottomNav } from '../src/components';

export default function ProfileScreen() {
  const { user, isGuest, credits, generations, setUser } = useAppStore();

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
    router.push('/login');
  };

  const handleSubscription = () => {
    router.push('/subscription');
  };

  const completedCount = generations.filter(g => g.status === 'completed').length;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
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
                <Text style={styles.userId}>ID: {user?.id?.slice(0, 8)}...</Text>
              </>
            )}
          </View>

          {/* Credits Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isGuest ? 'Free Credits' : 'Subscription'}
            </Text>
            <View style={styles.creditsWrapper}>
              <CreditsDisplay credits={credits} />
            </View>
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
              <TouchableOpacity style={styles.upgradeButton} onPress={handleSubscription}>
                <Text style={styles.upgradeButtonText}>
                  {credits?.isSubscribed ? 'Manage Subscription' : 'Upgrade to Pro'}
                </Text>
              </TouchableOpacity>
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
