import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signUp } from '../src/services/supabase';
import { migrateGuestData } from '../src/services/api';
import { getGuestId, clearGuestId } from '../src/services/guestStorage';
import { useAppStore } from '../src/store/useAppStore';

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const [isLogin, setIsLogin] = useState(params.mode !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { setUser, setGuestId: setStoreGuestId, guestId } = useAppStore();

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Sign in
        const { user } = await signIn(email, password);
        if (user) {
          // Clear guest state when signing in
          await clearGuestId();
          setStoreGuestId(null);
          
          // Set authenticated user
          setUser({ id: user.id, email: user.email! });
          
          // Wait a bit for auth state to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
          router.replace('/home');
        }
      } else {
        // Sign up - includes migration of guest data
        const { user } = await signUp(email, password);
        if (user) {
          // Migrate guest data if exists BEFORE setting user
          const currentGuestId = guestId || await getGuestId();
          if (currentGuestId) {
            try {
              await migrateGuestData(currentGuestId);
              console.log('Guest data migrated successfully');
            } catch (migrationError) {
              // Migration is optional - don't block signup
              console.log('Guest migration completed (may have had no data)');
            }
          }
          
          // Clear guest state completely
          await clearGuestId();
          setStoreGuestId(null);
          
          // Now set the authenticated user
          setUser({ id: user.id, email: user.email! });
          
          // Wait a bit for auth state to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
          router.replace('/home');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    router.replace('/home');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logoImage} 
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>AI Portrait Studio</Text>
            <Text style={styles.subtitle}>
              Professional headshots in seconds
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, isLogin && styles.activeTab]} 
                onPress={() => { setIsLogin(true); setError(''); }}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, !isLogin && styles.activeTab]} 
                onPress={() => { setIsLogin(false); setError(''); }}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContent}>
              {!isLogin && (
                <View style={styles.benefitBadge}>
                  <Ionicons name="gift-outline" size={16} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={styles.benefitText}>Get free credits!</Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleContinueAsGuest}
            style={styles.guestButton}
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>Try as Guest</Text>
            <Ionicons name="arrow-forward" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <View style={styles.footerFeatures}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <Ionicons name="camera-outline" size={20} color="#6366F1" />
              </View>
              <Text style={styles.featureLabel}>Upload Photo</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <Ionicons name="color-wand-outline" size={20} color="#EC4899" />
              </View>
              <Text style={styles.featureLabel}>Choose Style</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.featureItem}>
              <View style={styles.featureIconBg}>
                <Ionicons name="flash-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.featureLabel}>AI Magic</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 0,
    overflow: 'hidden', // Ensures logo stays inside circle
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  activeTab: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  formContent: {
    padding: 24,
  },
  benefitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  benefitText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
    backgroundColor: '#4F46E5',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 40,
  },
  guestButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  footerFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#1E293B',
  },
});
