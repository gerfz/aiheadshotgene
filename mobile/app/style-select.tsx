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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_PRESETS } from '../src/constants/styles';
import { getMostUsedStyles } from '../src/services/api';
import { analytics } from '../src/services/posthog';
import { getSession } from '../src/services/supabase';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding
const cardHeight = cardWidth * 1.2;

// Memoized Style Card Component
const StyleCard = React.memo(({ 
  style, 
  selectedStyle, 
  onSelect, 
  isGrid = false 
}: { 
  style: any; 
  selectedStyle: string | null; 
  onSelect: (key: string) => void;
  isGrid?: boolean;
}) => {
  return (
    <TouchableOpacity
      style={isGrid ? styles.gridCard : styles.styleCard}
      onPress={() => onSelect(style.key)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={style.thumbnail} 
          style={styles.styleImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        <View style={styles.selectionIndicator}>
          {selectedStyle === style.key ? (
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
      </View>
      <Text style={styles.styleName}>{style.name}</Text>
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

export default function StyleSelectScreen() {
  const { selectedStyle, setSelectedStyle, customPrompt, setCustomPrompt } = useAppStore();
  const [categories, setCategories] = useState(STATIC_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // Load most used styles on mount
  useEffect(() => {
    loadMostUsedStyles();
  }, []);

  const loadMostUsedStyles = async () => {
    try {
      const { mostUsedStyles } = await getMostUsedStyles();
      
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
      
      // Create the Most Used category
      const mostUsedCategory = {
        id: 'most_used',
        name: 'Most Used',
        icon: '⚡',
        styles: mostUsedStyleKeys,
      };
      
      // Update categories with Most Used at the top
      setCategories([mostUsedCategory, ...STATIC_CATEGORIES]);
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
      setLoading(false);
    }
  };

  const handleStyleSelect = useCallback((styleKey: string) => {
    setSelectedStyle(styleKey);
    
    // Track style selection
    const category = categories.find(cat => cat.styles.includes(styleKey))?.name || 'Unknown';
    analytics.styleSelected(styleKey, category);
    
    // Show custom prompt input if custom style is selected
    if (styleKey === 'custom') {
      setShowCustomPrompt(true);
    } else {
      setShowCustomPrompt(false);
      // Clear custom prompt when selecting a non-custom style
      setCustomPrompt(null);
    }
  }, [setSelectedStyle, setCustomPrompt, categories]);

  const handleContinue = useCallback(async () => {
    if (selectedStyle) {
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
      
      router.push('/generating');
    }
  }, [selectedStyle]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    // Toggle: if clicking the active category, deselect it
    setActiveCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  // Memoize filtered categories
  const displayedCategories = useMemo(() => {
    if (activeCategory) {
      return categories.filter(cat => cat.id === activeCategory);
    }
    return categories;
  }, [activeCategory, categories]);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Choose Style',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600', fontSize: 20 },
        }} 
      />
      <SafeAreaView style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading styles...</Text>
          </View>
        ) : (
          <>
            {/* Category Filter Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterTabsScroll}
              contentContainerStyle={styles.filterTabsContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterTab,
                    activeCategory === category.id && styles.filterTabActive
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <Text style={styles.filterIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.filterText,
                    activeCategory === category.id && styles.filterTextActive
                  ]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Content Area - Show all categories or filtered */}
            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={activeCategory ? styles.contentContainerGrid : styles.contentContainer}
              showsVerticalScrollIndicator={false}
              // Performance optimizations
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={8}
              windowSize={5}
            >
              {activeCategory ? (
                // Filtered: Show selected category in grid layout
                <View style={styles.gridContainer}>
                  {categories.find(cat => cat.id === activeCategory)?.styles.map((styleKey) => {
                    const style = STYLE_PRESETS[styleKey];
                    return (
                      <StyleCard
                        key={style.key}
                        style={style}
                        selectedStyle={selectedStyle}
                        onSelect={handleStyleSelect}
                        isGrid={true}
                      />
                    );
                  })}
                </View>
              ) : (
                // No filter: Show all categories with horizontal scrolling
                displayedCategories.map((category) => (
            <View key={category.id} style={styles.categorySection}>
              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>
                  {category.icon} {category.name}
                </Text>
              </View>

              {/* Horizontal Scroll of Styles */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
                // Performance optimizations for horizontal scrolling
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
                      selectedStyle={selectedStyle}
                      onSelect={handleStyleSelect}
                      isGrid={false}
                    />
                  );
                })}
              </ScrollView>
            </View>
                ))
              )}
            </ScrollView>

            {/* Custom Prompt Input - Show when custom style is selected */}
            {showCustomPrompt && selectedStyle === 'custom' && (
              <View style={styles.customPromptContainer}>
                <View style={styles.customPromptHeader}>
                  <Ionicons name="create-outline" size={24} color="#6366F1" />
                  <Text style={styles.customPromptTitle}>Describe Your Portrait</Text>
                </View>
                <TextInput
                  style={styles.customPromptInput}
                  placeholder="E.g., Professional headshot in a modern office, wearing a navy suit..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={4}
                  value={customPrompt || ''}
                  onChangeText={setCustomPrompt}
                  textAlignVertical="top"
                />
                <Text style={styles.customPromptHint}>
                  💡 Tip: Be specific about clothing, background, lighting, and mood
                </Text>
              </View>
            )}

            {/* Continue Button - Only show when style is selected */}
            {selectedStyle && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    selectedStyle === 'custom' && (!customPrompt || customPrompt.trim().length === 0) && styles.continueButtonDisabled
                  ]}
                  onPress={handleContinue}
                  disabled={selectedStyle === 'custom' && (!customPrompt || customPrompt.trim().length === 0)}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  
  // Filter Tabs at Top
  filterTabsScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    gap: 6,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
  },
  filterIcon: {
    fontSize: 16,
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Content
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  contentContainerGrid: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  
  // Grid Layout (for filtered view)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: cardWidth,
    marginBottom: 16,
  },
  
  // Category Section
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Horizontal Scroll
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
  },
  styleCard: {
    width: cardWidth,
  },
  imageContainer: {
    width: '100%',
    height: cardWidth * 1.4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
  styleName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Custom Prompt
  customPromptContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1E293B',
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
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#334155',
  },
  customPromptHint: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  
  // Footer
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
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
});
