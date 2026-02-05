import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_PRESETS } from '../src/constants/styles';
import { getMostUsedStyles } from '../src/services/api';
import { analytics } from '../src/services/posthog';
import { getSession } from '../src/services/supabase';
import { CreditsHeader } from '../src/components';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16; // Padding between cards
const SCREEN_PADDING = 20; // Side padding
const cardWidth = (width - (SCREEN_PADDING * 2) - (CARD_PADDING * 2)) / 3; // 3 columns with small peek of 4th
const cardHeight = cardWidth * 1.4;

// Memoized Style Card Component
const StyleCard = React.memo(({ 
  style, 
  selectedStyles, 
  onSelect
}: { 
  style: any; 
  selectedStyles: string[]; 
  onSelect: (key: string) => void;
}) => {
  const isSelected = selectedStyles.includes(style.key);
  
  return (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => onSelect(style.key)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={style.thumbnail} 
          style={styles.styleImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          priority="normal"
        />
        
        {/* Black gradient overlay at bottom */}
        <View style={styles.gradientOverlay} />
        
        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
          ) : (
            <View style={styles.unselectedCircle} />
          )}
        </View>
        
        {style.badge && (
          <View style={[
            styles.badge,
            style.badge.type === 'female' && styles.badgeFemale,
            style.badge.type === 'info' && styles.badgeInfo,
          ]}>
            <Text style={styles.badgeText}>{style.badge.label}</Text>
          </View>
        )}
        
        {/* Title on preview with gradient */}
        <View style={styles.titleContainer}>
          <Text style={styles.styleName} numberOfLines={1}>
            {style.name.length > 15 ? `${style.name.substring(0, 15)}...` : style.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Static category definitions (will be updated with dynamic most used)
const STATIC_CATEGORIES = [
  {
    id: 'business',
    name: 'Business',
    icon: '💼',
    styles: ['executive_portrait', 'corporate_headshot', 'startup_founder', 'business_casual', 'conference_speaker', 'business', 'tight_portrait', 'luxury_fashion', 'professional_headshot'],
  },
  {
    id: 'dating',
    name: 'Dating',
    icon: '💕',
    styles: ['candlelit_dinner', 'sunset_walk', 'cozy_date_night', 'romantic_picnic', 'jazz_club_date', 'wine_bar', 'emotional_film', 'with_puppy', 'nineties_camera'],
  },
  {
    id: 'social_lifestyle',
    name: 'Social / Lifestyle',
    icon: '📸',
    styles: ['with_supercar', 'coffee_shop', 'luxury_yacht', 'city_rooftop', 'beach_sunset', 'nineties_camera', 'with_puppy', 'emotional_film'],
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: '🎭',
    styles: ['magazine_cover', 'pikachu', 'bulbasaur', 'charmander', 'squirtle', 'jigglypuff', 'zootopia_cable_car', 'tom_and_jerry', 'ben_ten', 'pink_panther', 'victoria_secret', 'custom'],
  },
  {
    id: 'adventure',
    name: 'Adventure',
    icon: '🏔️',
    styles: ['mountain_hiking', 'safari_expedition', 'jungle_explorer', 'canyon_adventure', 'desert_wanderer', 'custom'],
  },
  {
    id: 'classy',
    name: 'Classy',
    icon: '👔',
    styles: ['black_tie', 'evening_gown', 'gentleman_study', 'champagne_celebration', 'art_museum', 'custom'],
  },
  {
    id: 'winter',
    name: 'Winter',
    icon: '❄️',
    styles: ['cozy_cabin', 'luxury_ski', 'winter_forest', 'mountain_peak', 'winter_city', 'custom'],
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: '💼',
    styles: ['executive_chef', 'airline_pilot', 'surgeon', 'creative_artist', 'firefighter_hero', 'custom'],
  },
];

type ViewMode = 'categories' | 'all';

export default function HomeScreen() {
  const { selectedStyle, setSelectedStyle, customPrompt, setCustomPrompt, credits, setSelectedImage, setCredits, cachedCategories, cachedAllStyles, setCachedStyles } = useAppStore();
  
  // Initialize with cached data if available (instant load)
  const [categories, setCategories] = useState(cachedCategories || STATIC_CATEGORIES);
  const [allStyles, setAllStyles] = useState<string[]>(cachedAllStyles || []);
  const [loading, setLoading] = useState(!cachedCategories); // Only show loading if no cache
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]); // Multi-select support

  // Load most used styles on mount (use cache if available and not expired)
  useEffect(() => {
    const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    const { stylesLoadedAt } = useAppStore.getState();
    const isCacheValid = stylesLoadedAt && (Date.now() - stylesLoadedAt < CACHE_EXPIRY_MS);
    
    if (cachedCategories && cachedAllStyles && isCacheValid) {
      // Use cached data (less than 30 days old) - already initialized in useState
      console.log('✅ Using cached styles (instant)');
      setLoading(false);
    } else {
      // Load fresh data (cache expired or doesn't exist)
      if (stylesLoadedAt) {
        console.log('🔄 Cache expired (30+ days old), refreshing styles');
      } else {
        console.log('🔄 Loading styles from database (first time)');
      }
      setLoading(true); // Show loading only when fetching fresh data
      loadMostUsedStyles();
    }
    // Debug: Refresh credits on mount
    refreshCredits();
  }, []);

  const refreshCredits = async () => {
    try {
      const { getCredits } = await import('../src/services/api');
      const creditsData = await getCredits();
      console.log('🔄 Credits refreshed from API:', creditsData);
      setCredits(creditsData);
    } catch (error) {
      console.error('❌ Failed to refresh credits:', error);
    }
  };

  const startBatchGeneration = async (imageUri: string, styleKeys: string[], prompt?: string | null) => {
    if (styleKeys.length === 0) return;
    
    try {
      const { generateBatchPortraits } = await import('../src/services/api');
      
      // Start batch generation with custom prompt if provided
      await generateBatchPortraits(imageUri, styleKeys, prompt);
      
      console.log(`✅ Batch generation started for ${styleKeys.length} styles`, prompt ? `with custom prompt: ${prompt}` : '');
      
      // Clear selections after starting
      setSelectedStyles([]);
      setCustomPrompt(null);
      
    } catch (error) {
      console.error('❌ Batch generation failed:', error);
      Alert.alert('Generation Failed', 'Please try again from the gallery.');
    }
  };

  const loadMostUsedStyles = async () => {
    try {
      const { mostUsedStyles } = await getMostUsedStyles();
      
      // Debug: Log what we got from the database
      console.log('📊 Most used styles from database:', mostUsedStyles.slice(0, 10).map(s => `${s.style_key} (${s.usage_count})`));
      
      // Custom is always first, then top 9 most used
      const mostUsedStyleKeys = ['custom'];
      
      // Add top 9 most used styles (excluding custom)
      mostUsedStyles.slice(0, 9).forEach((item) => {
        if (item.style_key !== 'custom' && STYLE_PRESETS[item.style_key]) {
          mostUsedStyleKeys.push(item.style_key);
        }
      });
      
      // If we don't have 10 styles yet, fill with defaults
      const defaultStyles = ['business', 'emotional_film', 'victoria_secret', 'professional_headshot', 'wine_bar', 'with_puppy', 'nineties_camera', 'tight_portrait', 'luxury_fashion'];
      for (const styleKey of defaultStyles) {
        if (mostUsedStyleKeys.length >= 10) break;
        if (!mostUsedStyleKeys.includes(styleKey)) {
          mostUsedStyleKeys.push(styleKey);
        }
      }
      
      // Debug: Log final order
      console.log('✅ Final Most Used order:', mostUsedStyleKeys);
      
      // Create the Most Used category
      const mostUsedCategory = {
        id: 'most_used',
        name: 'Most Used',
        icon: '⚡',
        styles: mostUsedStyleKeys,
      };
      
      // Update categories with Most Used at the top
      setCategories([mostUsedCategory, ...STATIC_CATEGORIES]);
      
      // Build all styles list for "Show All" mode
      const allStyleKeys = ['custom'];
      mostUsedStyles.forEach((item) => {
        if (item.style_key !== 'custom' && STYLE_PRESETS[item.style_key] && !allStyleKeys.includes(item.style_key)) {
          allStyleKeys.push(item.style_key);
        }
      });
      Object.keys(STYLE_PRESETS).forEach((key) => {
        if (!allStyleKeys.includes(key)) {
          allStyleKeys.push(key);
        }
      });
      setAllStyles(allStyleKeys);
      
      // Cache the loaded styles
      setCachedStyles([mostUsedCategory, ...STATIC_CATEGORIES], allStyleKeys);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load most used styles:', error);
      // Fallback to default Most Used category
      const defaultMostUsed = {
        id: 'most_used',
        name: 'Most Used',
        icon: '⚡',
        styles: ['custom', 'business', 'emotional_film', 'victoria_secret', 'professional_headshot'],
      };
      setCategories([defaultMostUsed, ...STATIC_CATEGORIES]);
      
      // Fallback all styles
      const fallbackStyles = ['custom', ...Object.keys(STYLE_PRESETS).filter(k => k !== 'custom')];
      setAllStyles(fallbackStyles);
      
      // Cache the fallback data
      setCachedStyles([defaultMostUsed, ...STATIC_CATEGORIES], fallbackStyles);
      
      setLoading(false);
    }
  };

  const handleStyleSelect = useCallback((styleKey: string) => {
    // Multi-select logic
    setSelectedStyles(prev => {
      const isSelected = prev.includes(styleKey);
      
      // If selecting custom, clear all other selections
      if (styleKey === 'custom' && !isSelected) {
        setShowCustomPrompt(true);
        return ['custom'];
      }
      
      // If custom is already selected and user selects another style, deselect custom
      if (prev.includes('custom') && styleKey !== 'custom') {
        setShowCustomPrompt(false);
        setCustomPrompt(null);
        return [styleKey];
      }
      
      if (isSelected) {
        // Deselect
        const newSelection = prev.filter(k => k !== styleKey);
        // Hide custom prompt if custom is deselected
        if (styleKey === 'custom') {
          setShowCustomPrompt(false);
          setCustomPrompt(null);
        }
        return newSelection;
      } else {
        // Select (add to array)
        return [...prev, styleKey];
      }
    });
    
    // Track style selection
    const category = categories.find(cat => cat.styles.includes(styleKey))?.name || 'Unknown';
    analytics.styleSelected(styleKey, category);
  }, [selectedStyles, setCustomPrompt, categories]);

  const handleContinue = useCallback(async () => {
    if (selectedStyles.length === 0) return;

    // For custom style, require custom prompt
    if (selectedStyles.includes('custom') && !customPrompt) {
      Alert.alert('Custom Prompt Required', 'Please enter a custom prompt to continue.');
      return;
    }

    // Calculate total cost
    const totalCost = selectedStyles.length * 200;

    // Check if user has enough credits
    if ((credits?.totalCredits || 0) < totalCost) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${totalCost} credits to generate ${selectedStyles.length} ${selectedStyles.length === 1 ? 'portrait' : 'portraits'}. You have ${credits?.totalCredits || 0} credits.`,
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
      
      // Navigate to gallery screen with flag indicating new generation
      router.push({
        pathname: '/gallery',
        params: { newGeneration: 'true' }
      });
      
      // Start batch generation in background
      setTimeout(() => {
        startBatchGeneration(result.assets[0].uri, selectedStyles, customPrompt);
      }, 100);
    }
  }, [selectedStyles, customPrompt, credits, setSelectedImage]);


  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          animation: 'fade',
          animationDuration: 150,
        }} 
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Credits Header */}
        <CreditsHeader showHistory={true} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading styles...</Text>
          </View>
        ) : (
          <>
            {/* Sort Options */}
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[styles.sortButton, viewMode === 'categories' && styles.sortButtonActive]}
                onPress={() => setViewMode('categories')}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortButtonText, viewMode === 'categories' && styles.sortButtonTextActive]}>
                  Categories
                </Text>
              </TouchableOpacity>
              
              <View style={styles.sortDivider} />
              
              <TouchableOpacity
                style={[styles.sortButton, viewMode === 'all' && styles.sortButtonActive]}
                onPress={() => setViewMode('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortButtonText, viewMode === 'all' && styles.sortButtonTextActive]}>
                  Show All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on view mode */}
            {viewMode === 'categories' ? (
              // Categories with Horizontal Scrolling
              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={8}
                windowSize={5}
              >
                {categories.map((category) => (
                  <View key={category.id} style={styles.categorySection}>
                    {/* Category Header with Arrow */}
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>
                        {category.name.toUpperCase()}
                      </Text>
                      <TouchableOpacity 
                        style={styles.seeAllButton}
                        onPress={() => {
                          router.push({
                            pathname: '/category-detail',
                            params: {
                              categoryId: category.id,
                              categoryName: category.name,
                              styles: category.styles.join(','),
                            },
                          });
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color="#666666" />
                      </TouchableOpacity>
                    </View>

                    {/* Horizontal Scroll of Styles */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalScroll}
                      removeClippedSubviews={true}
                      maxToRenderPerBatch={5}
                      updateCellsBatchingPeriod={50}
                      initialNumToRender={4}
                      windowSize={3}
                    >
                      {category.styles.map((styleKey) => {
                        const style = STYLE_PRESETS[styleKey];
                        return (
                          <StyleCard
                            key={style.key}
                            style={style}
                            selectedStyles={selectedStyles}
                            onSelect={handleStyleSelect}
                          />
                        );
                      })}
                    </ScrollView>
                  </View>
                ))}
              </ScrollView>
            ) : (
              // Show All - Grid View
              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.gridScrollContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={15}
                updateCellsBatchingPeriod={50}
                initialNumToRender={12}
                windowSize={5}
              >
                <View style={styles.gridContainer}>
                  {allStyles.map((styleKey) => {
                    const style = STYLE_PRESETS[styleKey];
                    return (
                      <StyleCard
                        key={style.key}
                        style={style}
                        selectedStyles={selectedStyles}
                        onSelect={handleStyleSelect}
                      />
                    );
                  })}
                </View>
              </ScrollView>
            )}


            {/* Become Pro Badge - Always visible at bottom if not subscribed */}
            {!credits?.isSubscribed && (
              <View style={styles.becomeProContainer}>
                <TouchableOpacity 
                  style={styles.becomeProBadge}
                  onPress={() => router.push('/subscription')}
                  activeOpacity={0.9}
                >
                  <Ionicons name="star" size={18} color="#FFFFFF" />
                  <View style={styles.becomeProTextContainer}>
                    <Text style={styles.becomeProText}>Become Pro</Text>
                    <Text style={styles.becomeProSubtext}>Get access to all packages</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeBecomePro}
                    onPress={(e) => {
                      e.stopPropagation();
                      // Just close the badge - you could add logic to hide it permanently
                    }}
                  >
                    <Ionicons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            )}

            {/* Continue Button - Only show when styles are selected */}
            {selectedStyles.length > 0 && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    selectedStyles.includes('custom') && (!customPrompt || customPrompt.trim().length === 0) && styles.continueButtonDisabled
                  ]}
                  onPress={handleContinue}
                  disabled={selectedStyles.includes('custom') && (!customPrompt || customPrompt.trim().length === 0)}
                >
                  <Text style={styles.continueButtonText}>
                    Continue ({selectedStyles.length} {selectedStyles.length === 1 ? 'style' : 'styles'} • {selectedStyles.length * 200} credits)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </SafeAreaView>

      {/* Custom Prompt Modal */}
      <Modal
        visible={selectedStyles.includes('custom')}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Remove custom from selection if user closes modal
          setSelectedStyles(prev => prev.filter(k => k !== 'custom'));
          setShowCustomPrompt(false);
          setCustomPrompt(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              // Remove custom from selection if user taps backdrop
              setSelectedStyles(prev => prev.filter(k => k !== 'custom'));
              setShowCustomPrompt(false);
              setCustomPrompt(null);
            }}
          />
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="sparkles" size={28} color="#6366F1" />
                <Text style={styles.modalTitle}>Custom Portrait</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedStyles(prev => prev.filter(k => k !== 'custom'));
                  setShowCustomPrompt(false);
                  setCustomPrompt(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Describe exactly what you want to see in your portrait
            </Text>

            {/* Text Input */}
            <TextInput
              style={styles.modalTextInput}
              placeholder="E.g., with bunny ears, wearing a red hoodie, in a cozy coffee shop..."
              placeholderTextColor="#64748B"
              multiline
              value={customPrompt || ''}
              onChangeText={setCustomPrompt}
              textAlignVertical="top"
              autoFocus
            />

            {/* Examples */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>💡 Examples:</Text>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => setCustomPrompt('with bunny ears, smiling')}
              >
                <Text style={styles.exampleText}>with bunny ears, smiling</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => setCustomPrompt('wearing a crown, royal background')}
              >
                <Text style={styles.exampleText}>wearing a crown, royal background</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => setCustomPrompt('as a superhero with cape')}
              >
                <Text style={styles.exampleText}>as a superhero with cape</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setSelectedStyles(prev => prev.filter(k => k !== 'custom'));
                  setShowCustomPrompt(false);
                  setCustomPrompt(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  (!customPrompt || customPrompt.trim().length === 0) && styles.modalConfirmButtonDisabled
                ]}
                onPress={async () => {
                  if (customPrompt && customPrompt.trim().length > 0) {
                    // Close modal and trigger continue (photo picker)
                    await handleContinue();
                  }
                }}
                disabled={!customPrompt || customPrompt.trim().length === 0}
              >
                <Text style={styles.modalConfirmText}>
                  {customPrompt && customPrompt.trim().length > 0 ? 'Choose Photo' : 'Enter prompt'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#666666',
    fontSize: 16,
  },
  
  // Sort Options
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 12,
    gap: 12,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#6366F1',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  sortDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#333333',
  },
  
  // Content
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  gridScrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
    paddingBottom: 120,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  // Category Section
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 1,
  },
  seeAllButton: {
    padding: 4,
  },
  
  // Horizontal Scroll
  horizontalScroll: {
    paddingLeft: SCREEN_PADDING,
    paddingRight: SCREEN_PADDING,
    gap: 12,
  },
  gridCard: {
    width: cardWidth,
  },
  imageContainer: {
    width: '100%',
    height: cardHeight,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'transparent',
    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
    // For React Native, we'll use a solid dark overlay at bottom
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 10,
    fontWeight: '600',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  styleName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Custom Prompt
  customPromptContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  customPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  customPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customPromptInput: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#333333',
  },
  customPromptHint: {
    color: '#666666',
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  
  // Become Pro Badge Container (fixed at bottom)
  becomeProContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  becomeProBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  becomeProTextContainer: {
    flex: 1,
  },
  becomeProText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  becomeProSubtext: {
    color: '#94A3B8',
    fontSize: 13,
  },
  closeBecomePro: {
    padding: 4,
  },
  
  // Footer
  footer: {
    padding: 20,
    paddingBottom: 30,
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
  continueButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalTextInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    maxHeight: 180,
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 16,
  },
  examplesContainer: {
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 12,
  },
  exampleChip: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  exampleText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
