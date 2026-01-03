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
import { generatePortrait, editPortrait } from '../src/services/api';
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
  const params = useLocalSearchParams<{
    imageUrl?: string;
    editPrompt?: string;
    isEdit?: string;
    originalGeneratedUrl?: string;
    originalUrl?: string;
    styleKey?: string;
    originalId?: string;
  }>();

  const { selectedImage, selectedStyle, customPrompt, setIsGenerating } = useAppStore();
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
                  // Navigate to result with edited version, using push so back goes to home
                  router.push({
                    pathname: '/result',
                    params: {
                      generatedUrl: editedResult.generatedImageUrl,
                      originalUrl: params.originalUrl!,
                      styleKey: params.styleKey!,
                      id: editedResult.id,
                      isEdited: 'true',
                    },
                  });
                }}
              >
                <Text style={styles.keepEditedButtonText}>✓ Keep Edited</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keepOriginalButton}
                onPress={() => {
                  // Navigate to result with original version
                  router.push({
                    pathname: '/result',
                    params: {
                      generatedUrl: params.originalGeneratedUrl!,
                      originalUrl: params.originalUrl!,
                      styleKey: params.styleKey!,
                      id: params.originalId!,
                      isEdited: 'false',
                    },
                  });
                }}
              >
                <Text style={styles.keepOriginalButtonText}>Keep Original</Text>
              </TouchableOpacity>
            </View>

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
        </SafeAreaView>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.errorIcon}>😔</Text>
            <Text style={styles.errorTitle}>{isEditMode ? 'Edit Failed' : 'Generation Failed'}</Text>
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

