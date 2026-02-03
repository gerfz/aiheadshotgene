import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { analytics } from '../src/services/posthog';
import tiktokService from '../src/services/tiktok';

const { width, height } = Dimensions.get('window');
const FIRST_TIME_KEY = 'has_seen_welcome';
const SHOW_SUBSCRIPTION_KEY = 'show_subscription_after_onboarding';

export default function WelcomeScreen() {
  // Track when onboarding screen is viewed
  React.useEffect(() => {
    analytics.onboardingScreenViewed();
  }, []);

  const handleContinue = async () => {
    // Track dive in button clicked
    analytics.onboardingDiveInClicked();
    
    // Mark that user has seen welcome screen
    await SecureStore.setItemAsync(FIRST_TIME_KEY, 'true');
    // Set flag to show subscription after first generation
    await SecureStore.setItemAsync(SHOW_SUBSCRIPTION_KEY, 'true');
    
    // Track onboarding completion
    analytics.onboardingCompleted();
    
    // Track Complete Registration in TikTok (key conversion event)
    tiktokService.trackCompleteRegistration();
    
    // Navigate to subscription screen first
    router.replace('/subscription');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Onboarding Image - Full Screen Background */}
      <Image
        source={require('../assets/onboarding.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Overlay Content */}
      <View style={styles.overlay}>
        {/* Text at Bottom */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Your creative journey{'\n'}starts here</Text>
          
          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Dive in</Text>
          </TouchableOpacity>

          {/* Terms and Privacy */}
          <Text style={styles.termsText}>
            By continuing I agree with the{' '}
            <Text style={styles.link}>Terms & Conditions</Text>
            {' '}and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  textContainer: {
    paddingHorizontal: 32,
    paddingBottom: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 40,
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
  },
});

