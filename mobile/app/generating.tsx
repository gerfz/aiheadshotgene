import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { generatePortrait, editPortrait, getCredits } from '../src/services/api';
import { STYLE_PRESETS } from '../src/constants/styles';
import { analytics } from '../src/services/posthog';
import { incrementGenerationCount } from '../src/components/RateUsModal';
import { cacheCredits } from '../src/services/cache';
import tiktokService from '../src/services/tiktok';

const LOADING_MESSAGES = [
  'Analyzing your photo...',
  'Applying professional styling...',
  'Enhancing lighting and shadows...',
  'Perfecting skin texture...',
  'Adding final touches...',
  'Almost there...',
];

export default function GeneratingScreen() {
  const params = useLocalSearchParams<{
    imageUrl?: string;
    editPrompt?: string;
    isEdit?: string;
    originalGeneratedUrl?: string;
    originalUrl?: string;
    styleKey?: string;
    originalId?: string;
  }>();

  const { selectedImage, selectedStyle, customPrompt, setIsGenerating, setCredits } = useAppStore();
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editedResult, setEditedResult] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const isEditMode = params.isEdit === 'true';

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
    // Handle edit mode
    if (isEditMode) {
      if (!params.imageUrl || !params.editPrompt) {
        router.back();
        return;
      }
      await startEdit();
      return;
    }

    // Handle normal generation
    if (!selectedImage || !selectedStyle) {
      router.back();
      return;
    }

    // Only send customPrompt if the style is 'custom'
    const promptToSend = selectedStyle === 'custom' ? customPrompt : null;
    
    console.log('Starting generation with:', { selectedStyle, customPrompt: promptToSend });

    setIsGenerating(true);
    setError(null);

    // Track generation started
    const startTime = Date.now();
    analytics.generationStarted(selectedStyle, true);

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
        
        // Track generation completed
        const duration = (Date.now() - startTime) / 1000;
        analytics.generationCompleted(selectedStyle, duration);
        
        // Track in TikTok
        const imageCount = result.generation?.images?.length || 4;
        await tiktokService.trackPortraitGeneration(selectedStyle, imageCount);
        
        // Increment generation count for Rate Us popup logic
        const genCount = await incrementGenerationCount();
        console.log('📊 Generation count:', genCount);
        
        // Update credits cache in background (non-blocking)
        getCredits()
          .then(creditsData => {
            setCredits(creditsData);
            cacheCredits(creditsData);
            console.log('💾 Credits updated after generation:', creditsData.totalCredits);
          })
          .catch(err => console.warn('Failed to update credits cache:', err));
        
        router.replace({ 
          pathname: '/result', 
          params: { 
            generatedUrl: result.generation.generatedImageUrl,
            originalUrl: result.generation.originalImageUrl,
            styleKey: result.generation.styleKey,
            customPrompt: promptToSend || '',
            showRateUs: genCount === 2 ? 'true' : 'false',
          } 
        });
      } else {
        console.error('❌ Generation not successful');
        throw new Error('Generation failed');
      }
    } catch (err: any) {
      console.error('❌ Generation error:', err);
      
      const errorMessage = err.message || 'Unknown error';
      
      // Determine error type for better analytics
      const isNoCredits = errorMessage.includes('No credits remaining') || errorMessage.includes('403');
      const isAuthError = errorMessage.includes('401') || 
                          errorMessage.includes('Missing or invalid authorization') ||
                          errorMessage.includes('Invalid or expired token');
      const isContentViolation = errorMessage.includes('CONTENT_POLICY_VIOLATION') || 
                                  errorMessage.includes('E005') || 
                                  errorMessage.includes('flagged as sensitive');
      const isTimeout = errorMessage.includes('timed out') || errorMessage.includes('timeout');
      const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch');
      
      // Track generation failed with context
      analytics.generationFailed(selectedStyle, errorMessage, {
        noCredits: isNoCredits,
        contentViolation: isContentViolation,
        timeout: isTimeout,
        networkError: isNetworkError
      });
      
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Check if error is about authentication (401)
      if (isAuthError) {
        console.log('⚠️ Auth error, redirecting to login...');
        setIsGenerating(false);
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return;
      }
      
      // Check if error is about no credits (403)
      if (isNoCredits) {
        // Redirect to subscription page
        console.log('⚠️ No credits, redirecting to subscription...');
        setIsGenerating(false);
        router.replace('/subscription');
        return;
      }
      
      setError(errorMessage);
    } finally {
      console.log('🏁 Generation process finished');
      setIsGenerating(false);
    }
  };

  const startEdit = async () => {
    console.log('Starting edit with:', { imageUrl: params.imageUrl, editPrompt: params.editPrompt });

    setIsGenerating(true);
    setError(null);

    try {
      console.log('📤 Calling editPortrait API...');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out after 120 seconds')), 120000)
      );
      
      const result = await Promise.race([
        editPortrait(params.imageUrl!, params.editPrompt!, params.styleKey),
        timeoutPromise
      ]) as any;
      console.log('📥 Edit API response received:', result);
      
      if (result.success) {
        console.log('✅ Edit successful, showing comparison...');
        setEditedResult(result.generation);
        setShowComparison(true);
      } else {
        console.error('❌ Edit not successful');
        throw new Error('Edit failed');
      }
    } catch (err: any) {
      console.error('❌ Edit error:', err);
      
      if (err.message && (err.message.includes('No credits remaining') || err.message.includes('403'))) {
        setIsGenerating(false);
        router.replace('/subscription');
        return;
      }
      
      setError(err.message || 'Failed to edit portrait. Please try again.');
    } finally {
      console.log('🏁 Edit process finished');
      setIsGenerating(false);
    }
  };

  const styleName = selectedStyle ? STYLE_PRESETS[selectedStyle]?.name : '';

  // Show comparison screen after edit is complete
  if (showComparison && editedResult) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.comparisonContent}>
            <Text style={styles.comparisonTitle}>✨ Your Edited Portrait</Text>
            <Text style={styles.comparisonSubtitle}>Choose which version you prefer</Text>

            <View style={styles.comparisonImages}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Original</Text>
                <Image
                  source={{ uri: params.originalGeneratedUrl }}
                  style={styles.comparisonImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Edited</Text>
                <Image
                  source={{ uri: editedResult.generatedImageUrl }}
                  style={styles.comparisonImage}
                  resizeMode="cover"
                />
              </View>
            </View>

            <View style={styles.comparisonActions}>
              <TouchableOpacity
                style={styles.keepEditedButton}
                onPress={() => {
                  // Navigate to gallery - the edited photo is already saved in the batch
                  router.push('/gallery');
                }}
              >
                <Text style={styles.keepEditedButtonText}>✓ Keep Edited</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={() => {
                  // Go back to edit screen to try different changes
                  router.back();
                }}
              >
                <Text style={styles.tryAgainButtonText}>← Try Different Edits</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (error) {
    // Check if this is a content policy violation
    const isContentViolation = error.includes('CONTENT_POLICY_VIOLATION') || error.includes('flagged as sensitive');
    
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.errorIcon}>{isContentViolation ? '🚫' : '😔'}</Text>
            <Text style={styles.errorTitle}>
              {isContentViolation ? 'Content Not Allowed' : (isEditMode ? 'Edit Failed' : 'Generation Failed')}
            </Text>
            <Text style={styles.errorMessage}>
              {isContentViolation 
                ? 'Your prompt contains content that violates our community guidelines. Please ensure your request is appropriate and does not include explicit, sensitive, or inappropriate content.'
                : error
              }
            </Text>
            
            {isContentViolation && (
              <View style={styles.guidelinesBox}>
                <Text style={styles.guidelinesTitle}>✓ Allowed Content:</Text>
                <Text style={styles.guidelineText}>• Professional portraits</Text>
                <Text style={styles.guidelineText}>• Fashion & lifestyle photos</Text>
                <Text style={styles.guidelineText}>• Creative & artistic styles</Text>
                <Text style={styles.guidelineText}>• Family-friendly edits</Text>
                
                <Text style={[styles.guidelinesTitle, { marginTop: 12 }]}>✗ Not Allowed:</Text>
                <Text style={styles.guidelineText}>• Adult or explicit content</Text>
                <Text style={styles.guidelineText}>• Violence or gore</Text>
                <Text style={styles.guidelineText}>• Discriminatory content</Text>
                <Text style={styles.guidelineText}>• Illegal activities</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>
                {isContentViolation ? '← Try a Different Prompt' : 'Go Back'}
              </Text>
            </TouchableOpacity>
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

          <Text style={styles.title}>{isEditMode ? 'Editing Your Portrait' : 'Creating Your Portrait'}</Text>
          {!isEditMode && <Text style={styles.styleName}>{styleName} Style</Text>}

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
    backgroundColor: '#000000',
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
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  guidelinesBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    maxWidth: 400,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  guidelineText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  comparisonContent: {
    flex: 1,
    padding: 20,
  },
  comparisonTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  comparisonSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
  },
  comparisonImages: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    gap: 16,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
  },
  comparisonImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  comparisonActions: {
    gap: 12,
    marginBottom: 16,
  },
  keepEditedButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  keepEditedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  keepOriginalButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  keepOriginalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  tryAgainButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
});

