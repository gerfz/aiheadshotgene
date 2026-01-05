import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_PRESETS } from '../src/constants/styles';
import { deleteGeneration, getUserGenerations } from '../src/services/api';
import { analytics } from '../src/services/posthog';
import { RateUsModal, shouldShowRateUs } from '../src/components/RateUsModal';

export default function ResultScreen() {
  const { setSelectedImage, setSelectedStyle, setGenerations } = useAppStore();
  const [showRateModal, setShowRateModal] = useState(false);
  
  const params = useLocalSearchParams<{
    id?: string;
    generatedUrl: string;
    originalUrl: string;
    styleKey: string;
    customPrompt?: string;
    isEdited?: string;
    showRateUs?: string;
  }>();

  const { id, generatedUrl, originalUrl, styleKey, customPrompt, isEdited, showRateUs } = params;

  // Check if we should show the Rate Us modal
  useEffect(() => {
    const checkRateUs = async () => {
      // If param says show rate us, or check the stored count
      if (showRateUs === 'true') {
        const shouldShow = await shouldShowRateUs();
        if (shouldShow) {
          // Small delay to let the screen render first
          setTimeout(() => {
            setShowRateModal(true);
          }, 1000);
        }
      }
    };
    checkRateUs();
  }, [showRateUs]);

  if (!generatedUrl) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Image Not Found</Text>
            <Text style={styles.errorMessage}>
              Could not load the generated portrait.
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Get the style name and add (Edited) suffix if it was edited
  let styleName = STYLE_PRESETS[styleKey || '']?.name || styleKey;
  if (isEdited === 'true') {
    styleName = `${styleName} (Edited)`;
  }

  const handleDownload = async () => {
    try {
      // On Android, use ImagePicker permissions which only asks for photos
      // On iOS, use MediaLibrary permissions
      let hasPermission = false;
      
      if (Platform.OS === 'android') {
        // Use ImagePicker's media library permission - this only asks for photos/videos, NOT audio
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        hasPermission = status === 'granted';
      } else {
        // iOS - use MediaLibrary
        const { status } = await MediaLibrary.requestPermissionsAsync();
        hasPermission = status === 'granted';
      }
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to save photos to your gallery.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Download the image to a temporary location
      const filename = `AI_Portrait_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.downloadAsync(generatedUrl, fileUri);
      
      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      
      // Optionally create an album and add the photo to it
      try {
        const album = await MediaLibrary.getAlbumAsync('AI Portrait Studio');
        if (album == null) {
          await MediaLibrary.createAlbumAsync('AI Portrait Studio', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (albumError) {
        console.log('Album creation skipped:', albumError);
        // Continue even if album creation fails
      }
      
      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Cleanup skipped:', cleanupError);
      }
      
      // Track download
      analytics.photoDownloaded(styleKey || 'unknown');
      
      Alert.alert(
        'Success! 🎉',
        'Portrait saved to your gallery',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
        return;
      }

      const filename = `portrait_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.downloadAsync(generatedUrl, fileUri);
      await Sharing.shareAsync(fileUri);
      
      // Track share
      analytics.photoShared(styleKey || 'unknown');
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleCreateNew = () => {
    // Keep the selected image so user can reuse it
    // Only clear the selected style
    setSelectedStyle(null);
    // Navigate to style selection screen (skip upload since we have the photo)
    router.push('/style-select');
  };

  const handleDelete = async () => {
    if (!id) {
      Alert.alert('Error', 'Cannot delete this portrait');
      return;
    }

    Alert.alert(
      'Delete Portrait',
      'Are you sure you want to delete this portrait? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGeneration(id);
              
              // Track delete
              analytics.photoDeleted(styleKey || 'unknown');
              
              // Refresh the generations list
              const generationsData = await getUserGenerations();
              setGenerations(generationsData.generations);
              // Navigate back
              router.back();
            } catch (error) {
              console.error('Failed to delete:', error);
              Alert.alert('Error', 'Failed to delete portrait');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Your Portrait',
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              // Navigate to home - will work from any depth
              router.push('/home');
            }} style={{ marginRight: 15 }}>
              <Text style={{ fontSize: 28, color: '#FFFFFF' }}>←</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Header - fixed */}
          <View style={styles.header}>
            <Text style={styles.styleName}>{styleName}</Text>
          </View>

          {/* Show custom prompt if it's a custom style */}
          {styleKey === 'custom' && customPrompt && (
            <View style={styles.customPromptContainer}>
              <View style={styles.customPromptHeader}>
                <Text style={styles.customPromptIcon}>✨</Text>
                <Text style={styles.customPromptTitle}>Your Prompt</Text>
              </View>
              <Text style={styles.customPromptText} numberOfLines={2}>{customPrompt}</Text>
            </View>
          )}

          {/* Image container - flexible, takes remaining space */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: generatedUrl }}
              style={styles.resultImage}
              resizeMode="contain"
            />
          </View>
          
          {/* Icon Bar - fixed */}
          <View style={styles.iconBar}>
            <TouchableOpacity style={styles.iconButton} onPress={handleDownload}>
              <View style={styles.iconCircle}>
                <Ionicons name="download-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.iconLabel}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <View style={[styles.iconCircle, styles.secondaryIcon]}>
                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.iconLabel}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton} onPress={() => {
              analytics.photoEdited(styleKey || 'unknown');
              router.push({
                pathname: '/edit-portrait',
                params: {
                  generatedUrl,
                  originalUrl,
                  styleKey,
                  id: id || '',
                }
              });
            }}>
              <View style={[styles.iconCircle, styles.editIcon]}>
                <Ionicons name="color-wand-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.iconLabel}>Edit</Text>
            </TouchableOpacity>
            
            {id && (
              <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
                <View style={[styles.iconCircle, styles.deleteIcon]}>
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                </View>
                <Text style={styles.iconLabel}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Comparison - fixed (optional) */}
          {originalUrl && (
            <View style={styles.comparison}>
              <View style={styles.compareItem}>
                <Image
                  source={{ uri: originalUrl }}
                  style={styles.compareImage}
                />
                <Text style={styles.compareLabel}>Original</Text>
              </View>
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={16} color="#6366F1" />
              </View>
              <View style={styles.compareItem}>
                <Image
                  source={{ uri: generatedUrl }}
                  style={styles.compareImage}
                />
                <Text style={styles.compareLabel}>Generated</Text>
              </View>
            </View>
          )}

          {/* Button - fixed at bottom */}
          <TouchableOpacity style={styles.newButton} onPress={handleCreateNew}>
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.newButtonText}>Create New Portrait</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Rate Us Modal */}
      <RateUsModal 
        visible={showRateModal} 
        onClose={() => setShowRateModal(false)} 
      />
    </>
  );
}

// Styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  styleName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  customPromptContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  customPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  customPromptIcon: {
    fontSize: 14,
  },
  customPromptTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customPromptText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  iconBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    marginBottom: 8,
  },
  iconButton: {
    alignItems: 'center',
    minWidth: 60,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryIcon: {
    backgroundColor: '#334155',
    shadowColor: '#000',
  },
  editIcon: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  deleteIcon: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.1,
  },
  iconLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  comparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 12,
    gap: 10,
  },
  compareItem: {
    alignItems: 'center',
  },
  compareImage: {
    width: 50,
    height: 62,
    borderRadius: 6,
    marginBottom: 2,
    backgroundColor: '#334155',
  },
  compareLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  arrow: {
    paddingHorizontal: 2,
  },
  newButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

