import React, { useState } from 'react';
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
} from 'react-native';
import { router, Stack } from 'expo-router';
import { signIn, signUp } from '../src/services/supabase';
import { migrateGuestData } from '../src/services/api';
import { getGuestId, clearGuestId } from '../src/services/guestStorage';
import { useAppStore } from '../src/store/useAppStore';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          setUser({ id: user.id, email: user.email! });
          setStoreGuestId(null);
          router.replace('/home');
        }
      } else {
        // Sign up - includes migration of guest data
        const { user } = await signUp(email, password);
        if (user) {
          setUser({ id: user.id, email: user.email! });
          
          // Migrate guest data if exists
          const currentGuestId = guestId || await getGuestId();
          if (currentGuestId) {
            try {
              await migrateGuestData(currentGuestId);
              await clearGuestId();
              console.log('Guest data migrated successfully');
            } catch (migrationError) {
              // Migration is optional - don't block signup
              console.log('Guest migration completed (may have had no data)');
            }
          }
          
          setStoreGuestId(null);
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
        >
          <View style={styles.header}>
            <Text style={styles.logo}>✨</Text>
            <Text style={styles.title}>AI Portrait Studio</Text>
            <Text style={styles.subtitle}>
              Transform your photos into professional headshots
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            
            {!isLogin && (
              <Text style={styles.signupBenefit}>
                Get 3 free portrait generations!
              </Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleContinueAsGuest}
            style={styles.guestButton}
          >
            <Text style={styles.guestButtonText}>Continue without account</Text>
          </TouchableOpacity>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureText}>Upload any photo</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureText}>Choose your style</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>AI transforms it</Text>
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
    marginBottom: 40,
  },
  logo: {
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
  form: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  signupBenefit: {
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#6366F1',
    fontSize: 14,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  guestButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feature: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});
