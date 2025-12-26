import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_PRESETS } from '../src/constants/styles';
import { deleteGeneration, getUserGenerations } from '../src/services/api';

export default function ResultScreen() {
  const { setSelectedImage, setSelectedStyle, setGenerations } = useAppStore();
  const params = useLocalSearchParams<{
    id?: string;
    generatedUrl: string;
    originalUrl: string;
    styleKey: string;
    customPrompt?: string;
    isEdited?: string;
  }>();

  const { id, generatedUrl, originalUrl, styleKey, customPrompt, isEdited } = params;

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
      // Use sharing instead of direct save for Expo Go compatibility
      const filename = `portrait_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.downloadAsync(generatedUrl, fileUri);
      
      // Share the file - user can save from share menu
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save your portrait',
          UTI: 'image/jpeg'
        });
      } else {
        Alert.alert('Success', 'Portrait downloaded to app storage');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save image');
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
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleCreateNew = () => {
    setSelectedImage(null);
    setSelectedStyle(null);
    router.replace('/home');
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
              // Always go back to home, clearing the navigation stack
              router.dismissAll();
              router.replace('/home');
            }} style={{ marginRight: 15 }}>
              <Text style={{ fontSize: 28, color: '#FFFFFF' }}>←</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
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
              <Text style={styles.customPromptText}>{customPrompt}</Text>
            </View>
          )}

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: generatedUrl }}
              style={styles.resultImage}
              resizeMode="cover"
            />
          </View>

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
                <Text style={styles.arrowText}>→</Text>
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

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
              <Text style={styles.actionButtonText}>📥  Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleShare}>
              <Text style={styles.actionButtonText}>📤  Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={() => router.push({
            pathname: '/edit-portrait',
            params: {
              generatedUrl,
              originalUrl,
              styleKey,
              id: id || '',
            }
          })}>
            <Text style={styles.editButtonText}>✨  Edit Portrait</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newButton} onPress={handleCreateNew}>
            <Text style={styles.newButtonText}>Create New Portrait</Text>
          </TouchableOpacity>

          {id && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>🗑️  Delete Portrait</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  styleName: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '600',
  },
  customPromptContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  customPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  customPromptIcon: {
    fontSize: 20,
  },
  customPromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customPromptText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultImage: {
    width: 300,
    height: 400,
    borderRadius: 20,
  },
  comparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12,
  },
  compareItem: {
    alignItems: 'center',
  },
  compareImage: {
    width: 100,
    height: 130,
    borderRadius: 12,
    marginBottom: 8,
  },
  compareLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  arrow: {
    paddingHorizontal: 12,
  },
  arrowText: {
    fontSize: 24,
    color: '#6366F1',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#1F2937',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  newButton: {
    borderWidth: 2,
    borderColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  newButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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

