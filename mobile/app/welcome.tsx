import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { analytics } from '../src/services/posthog';
import tiktokService from '../src/services/tiktok';

const { width, height } = Dimensions.get('window');
const FIRST_TIME_KEY = 'has_seen_welcome';
const SHOW_SUBSCRIPTION_KEY = 'show_subscription_after_onboarding';

const onboardingImages = [
  require('../assets/onboarding/onboarding_1.png'),
  require('../assets/onboarding/onboarding_2.png'),
  require('../assets/onboarding/onboarding_3.png'),
  require('../assets/onboarding/onboarding_4.png'),
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleContinue = async () => {
    if (currentIndex < onboardingImages.length - 1) {
      // Go to next screen
      setCurrentIndex(currentIndex + 1);
    } else {
      // Mark that user has seen welcome screen
      await SecureStore.setItemAsync(FIRST_TIME_KEY, 'true');
      // Set flag to show subscription after first generation
      await SecureStore.setItemAsync(SHOW_SUBSCRIPTION_KEY, 'true');
      
      // Track onboarding completion
      analytics.onboardingCompleted();
      
      // Track Complete Registration in TikTok (key conversion event)
      tiktokService.trackCompleteRegistration();
      
      // Navigate to home page
      router.replace('/home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Onboarding Image */}
      <View style={styles.imageContainer}>
        <Image
          source={onboardingImages[currentIndex]}
          style={styles.onboardingImage}
          resizeMode="contain"
        />
      </View>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {onboardingImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>
            {currentIndex === onboardingImages.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  onboardingImage: {
    width: width - 40,
    height: height * 0.7,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#6366F1',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  continueButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

