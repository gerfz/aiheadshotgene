import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');
const FIRST_TIME_KEY = 'has_seen_welcome';

export default function WelcomeScreen() {
  const handleContinue = async () => {
    // Mark that user has seen welcome screen
    await SecureStore.setItemAsync(FIRST_TIME_KEY, 'true');
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Main Image */}
      <View style={styles.imageContainer}>
        <View style={styles.imageWrapper}>
          {/* Before Image (Small Circle) */}
          <View style={styles.beforeImageContainer}>
            <Image
              source={require('../assets/business/518559229-793ad242-7867-4709-bdc6-55021f5eb78f.png')}
              style={styles.beforeImage}
              resizeMode="cover"
            />
          </View>
          
          {/* After Image (Large) */}
          <Image
            source={require('../assets/victoriasecret/G6TSEqzWYAIvaf9.jpg')}
            style={styles.mainImage}
            resizeMode="cover"
          />
          
          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={32} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Create AI Headshots</Text>
        <Text style={styles.subtitle}>
          Generate photos of yourself with AI. Convert your selfies into realistic photos.
        </Text>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
    paddingTop: 40,
  },
  imageWrapper: {
    position: 'relative',
    width: width * 0.85,
    height: height * 0.5,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  beforeImageContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    zIndex: 10,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  beforeImage: {
    width: '100%',
    height: '100%',
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 60,
    left: 60,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    paddingHorizontal: 30,
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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

