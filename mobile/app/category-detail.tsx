import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_PRESETS } from '../src/constants/styles';
import { analytics } from '../src/services/posthog';
import { getSession } from '../src/services/supabase';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 16;
const CARD_GAP = 12;
const NUM_COLUMNS = 2;
// 2 columns with gap
const cardWidth = (width - SCREEN_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const cardHeight = cardWidth * 1.4;

export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
    styles: string;
  }>();

  const { selectedStyle, setSelectedStyle, setSelectedImage, credits } = useAppStore();
  
  // Parse styles from comma-separated string
  const styleKeys = params.styles?.split(',') || [];

  const handleStyleSelect = (styleKey: string) => {
    // Allow deselecting by clicking the same style again
    if (selectedStyle === styleKey) {
      setSelectedStyle(null);
      return;
    }

    setSelectedStyle(styleKey);
    analytics.styleSelected(styleKey, params.categoryName || 'Category');
  };

  const handleContinue = async () => {
    if (!selectedStyle) return;

    // Check if user has enough credits
    if (!credits?.canGenerate) {
      Alert.alert(
        'Insufficient Credits',
        'You need 200 credits to generate a portrait.',
        [
          { text: 'Get Credits', onPress: () => router.push('/subscription') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    // Check if user is authenticated before proceeding
    try {
      const session = await getSession();
      if (!session) {
        Alert.alert(
          'Session Error',
          'Please restart the app to continue.',
          [{ text: 'OK' }]
        );
        return;
      }
    } catch (error) {
      console.error('❌ Failed to check session:', error);
      Alert.alert(
        'Connection Error',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Open image picker
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1.0,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      analytics.photoUploaded('gallery');
      
      // Navigate to gallery screen immediately
      router.push('/gallery');
      
      // Start generation in background
      setTimeout(() => {
        startBackgroundGeneration(result.assets[0].uri, selectedStyle);
      }, 100);
    }
  };

  const startBackgroundGeneration = async (imageUri: string, styleKey: string | null) => {
    if (!styleKey) return;
    
    try {
      const { generatePortrait } = await import('../src/services/api');
      
      // Start generation
      await generatePortrait(
        imageUri,
        styleKey,
        undefined
      );
      
      // Generation complete - will show in gallery on next refresh
    } catch (error) {
      console.error('❌ Background generation failed:', error);
      Alert.alert('Generation Failed', 'Please try again from the gallery.');
    }
  };

  const renderItem = ({ item: styleKey }: { item: string }) => {
    const style = STYLE_PRESETS[styleKey.trim()];
    if (!style) return null;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleStyleSelect(style.key)}
        activeOpacity={0.9}
      >
        <Image
          source={style.thumbnail}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        
        {/* Selection Indicator */}
        {selectedStyle === style.key && (
          <View style={styles.selectedOverlay}>
            <Ionicons name="checkmark-circle" size={32} color="#6366F1" />
          </View>
        )}
        
        {/* Badge if present */}
        {style.badge && (
          <View style={[
            styles.badge,
            style.badge.type === 'female' && styles.badgeFemale,
            style.badge.type === 'info' && styles.badgeInfo,
          ]}>
            <Text style={styles.badgeText}>{style.badge.label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: params.categoryName || 'Category',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FlatList
          data={styleKeys}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          numColumns={NUM_COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
        />
        
        {/* Continue Button - Only show when style is selected */}
        {selectedStyle && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>
                Continue (200 credits)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 20,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
  },
  badgeFemale: {
    backgroundColor: 'rgba(236, 72, 153, 0.9)',
  },
  badgeInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 20,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  continueButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
