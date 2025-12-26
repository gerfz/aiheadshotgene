import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { generatePortrait } from '../src/services/api';
import { STYLE_PRESETS } from '../src/constants/styles';

const LOADING_MESSAGES = [
  'Analyzing your photo...',
  'Applying professional styling...',
  'Enhancing lighting and shadows...',
  'Perfecting skin texture...',
  'Adding final touches...',
  'Almost there...',
];

export default function GeneratingScreen() {
  const { selectedImage, selectedStyle, customPrompt, setIsGenerating } = useAppStore();
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    startGeneration();
  }, []);

  const startGeneration = async () => {
    if (!selectedImage || !selectedStyle) {
      router.back();
      return;
    }

    // Only send customPrompt if the style is 'custom'
    const promptToSend = selectedStyle === 'custom' ? customPrompt : null;
    
    console.log('Starting generation with:', { selectedStyle, customPrompt: promptToSend });

    setIsGenerating(true);
    setError(null);

    try {
      console.log('📤 Calling generatePortrait API...');
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out after 120 seconds')), 120000)
      );
      
      const result = await Promise.race([
        generatePortrait(selectedImage, selectedStyle, promptToSend),
        timeoutPromise
      ]) as any;
      console.log('📥 API response received:', result);
      
      if (result.success) {
        console.log('✅ Generation successful, navigating to result...');
        router.replace({ 
          pathname: '/result', 
          params: { 
            generatedUrl: result.generation.generatedImageUrl,
            originalUrl: result.generation.originalImageUrl,
            styleKey: result.generation.styleKey,
            customPrompt: promptToSend || '',
          } 
        });
      } else {
        console.error('❌ Generation not successful');
        throw new Error('Generation failed');
      }
    } catch (err: any) {
      console.error('❌ Generation error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Check if error is about no credits (403)
      if (err.message && (err.message.includes('No credits remaining') || err.message.includes('403'))) {
        // Redirect to subscription page
        console.log('⚠️ No credits, redirecting to subscription...');
        setIsGenerating(false);
        router.replace('/subscription');
        return;
      }
      
      setError(err.message || 'Failed to generate portrait. Please try again.');
    } finally {
      console.log('🏁 Generation process finished');
      setIsGenerating(false);
    }
  };

  const styleName = selectedStyle ? STYLE_PRESETS[selectedStyle]?.name : '';

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.errorIcon}>😔</Text>
            <Text style={styles.errorTitle}>Generation Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Text
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              Go Back
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <View style={styles.pulseRing} />
          </View>

          <Text style={styles.title}>Creating Your Portrait</Text>
          <Text style={styles.styleName}>{styleName} Style</Text>

          <Animated.Text style={[styles.message, { opacity: fadeAnim }]}>
            {LOADING_MESSAGES[messageIndex]}
          </Animated.Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((messageIndex + 1) / LOADING_MESSAGES.length) * 100}%` },
                ]}
              />
            </View>
          </View>

          <Text style={styles.waitNote}>
            This usually takes 15-30 seconds
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loaderContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#6366F1',
    opacity: 0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  styleName: {
    fontSize: 16,
    color: '#6366F1',
    marginBottom: 32,
  },
  message: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  waitNote: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
});

