import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { STYLE_PRESETS } from '../constants/styles';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding
const cardHeight = cardWidth * 1.2; // Reduced from 1.4 to 1.2 for smaller cards

// Memoized Style Card Component to prevent unnecessary re-renders
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

// Category definitions - moved outside component to prevent recreation
const CATEGORIES = [
  {
    id: 'most_used',
    name: 'Most Used',
    icon: '⚡',
    styles: ['custom', 'business', 'emotional_film', 'victoria_secret'],
  },
  {
    id: 'business',
    name: 'Business',
    icon: '💼',
    styles: ['business', 'tight_portrait', 'luxury_fashion', 'professional_headshot'],
  },
  {
    id: 'dating',
    name: 'Dating',
    icon: '💕',
    styles: ['emotional_film', 'with_puppy', 'nineties_camera'],
  },
  {
    id: 'social_lifestyle',
    name: 'Social / Lifestyle',
    icon: '📸',
    styles: ['nineties_camera', 'with_puppy', 'emotional_film'],
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

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export function StyleSelectScreen({ navigation }: Props) {
  const { selectedStyle, setSelectedStyle } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Memoize handlers to prevent recreation on every render
  const handleStyleSelect = useCallback((styleKey: string) => {
    setSelectedStyle(styleKey);
  }, [setSelectedStyle]);

  const handleContinue = useCallback(() => {
    if (selectedStyle) {
      navigation.navigate('Generating');
    }
  }, [selectedStyle, navigation]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    // Toggle: if clicking the active category, deselect it
    setActiveCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  // Memoize filtered styles to prevent recalculation
  const displayedCategories = useMemo(() => {
    if (activeCategory) {
      return CATEGORIES.filter(cat => cat.id === activeCategory);
    }
    return CATEGORIES;
  }, [activeCategory]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Category Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabsScroll}
        contentContainerStyle={styles.filterTabsContent}
      >
        {CATEGORIES.map((category) => (
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
            {CATEGORIES.find(cat => cat.id === activeCategory)?.styles.map((styleKey) => {
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

      {/* Continue Button - Only show when style is selected */}
      {selectedStyle && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    marginBottom: 16, // Reduced from 24 to 16
  },
  categoryHeader: {
    paddingHorizontal: 20,
    marginBottom: 12, // Reduced from 16 to 12
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
    gap: 12, // Reduced from 16 to 12
  },
  styleCard: {
    width: cardWidth,
  },
  imageContainer: {
    width: '100%',
    height: cardHeight, // Using the new smaller height
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
    fontSize: 13, // Reduced from 14 to 13
    fontWeight: '500',
    marginTop: 6, // Reduced from 8 to 6
    textAlign: 'center',
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});