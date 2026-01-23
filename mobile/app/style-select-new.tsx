import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_PRESETS } from '../src/constants/styles';
import tiktokService from '../src/services/tiktok';
import { getSession } from '../src/services/supabase';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding

// Category definitions
const CATEGORIES = [
  {
    id: 'most_used',
    name: 'Most Used',
    icon: '⚡',
    styles: ['business', 'professional_headshot', 'emotional_film'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '👔',
    styles: ['business', 'professional_headshot'],
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: '💼',
    styles: ['business', 'professional_headshot', 'nineties_camera'],
  },
  {
    id: 'dating',
    name: 'Dating',
    icon: '💕',
    styles: ['wine_bar', 'emotional_film', 'with_puppy', 'nineties_camera'],
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: '🎨',
    styles: ['emotional_film', 'victoria_secret', 'with_puppy'],
  },
];

export default function StyleSelectScreen() {
  const { selectedStyle, setSelectedStyle } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('most_used');

  const handleStyleSelect = (styleKey: string) => {
    setSelectedStyle(styleKey);
  };

  const handleContinue = async () => {
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
      
      // Track style selection in TikTok
      await tiktokService.trackStyleSelection(selectedStyle);
      router.push('/generating');
    }
  };

  const currentCategory = CATEGORIES.find(cat => cat.id === activeCategory);
  const stylesToShow = currentCategory?.styles.map(key => STYLE_PRESETS[key]) || [];

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Realistic AI',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600', fontSize: 20 },
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={styles.container}>
        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                activeCategory === category.id && styles.categoryTabActive
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                activeCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Styles Grid */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Title */}
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{currentCategory?.icon} {currentCategory?.name}</Text>
          </View>

          {/* Grid of Styles */}
          <View style={styles.grid}>
            {stylesToShow.map((style) => (
              <TouchableOpacity
                key={style.key}
                style={styles.styleCard}
                onPress={() => handleStyleSelect(style.key)}
                activeOpacity={0.9}
              >
                <View style={styles.imageContainer}>
                  <Image 
                    source={style.thumbnail} 
                    style={styles.styleImage}
                    resizeMode="cover"
                  />
                  {/* Selection Indicator */}
                  <View style={styles.selectionIndicator}>
                    {selectedStyle === style.key ? (
                      <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                    ) : (
                      <View style={styles.unselectedCircle} />
                    )}
                  </View>
                  
                  {/* Badge */}
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
            ))}
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="flash" size={24} color="#64748B" />
            <Text style={styles.navButtonText}>Generate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.navButtonActive]}
            onPress={handleContinue}
            disabled={!selectedStyle}
          >
            <Ionicons name="sparkles" size={24} color="#6366F1" />
            <Text style={[styles.navButtonText, styles.navButtonTextActive]}>Realistic AI</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => router.push('/gallery')}
          >
            <Ionicons name="images" size={24} color="#64748B" />
            <Text style={styles.navButtonText}>Library</Text>
          </TouchableOpacity>
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
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  
  // Categories
  categoriesScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    gap: 6,
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#6366F1',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  
  // Content
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  categoryHeader: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  styleCard: {
    width: cardWidth,
    marginBottom: 8,
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
  
  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  navButtonActive: {
    // Active state styling
  },
  navButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  navButtonTextActive: {
    color: '#6366F1',
  },
});

