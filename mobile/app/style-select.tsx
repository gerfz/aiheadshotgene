import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_PRESETS } from '../src/constants/styles';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 2 columns with padding

// Category definitions
const CATEGORIES = [
  {
    id: 'most_used',
    name: 'Most Used',
    icon: '⚡',
    styles: ['custom', 'business', 'professional_headshot', 'emotional_film'],
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
    id: 'female_only',
    name: 'Female Only',
    icon: '👩',
    styles: ['victoria_secret', 'emotional_film'],
  },
  {
    id: 'male_only',
    name: 'Male Only',
    icon: '👨',
    styles: ['business', 'professional_headshot', 'nineties_camera'],
  },
];

export default function StyleSelectScreen() {
  const { selectedStyle, setSelectedStyle } = useAppStore();

  const handleStyleSelect = (styleKey: string) => {
    setSelectedStyle(styleKey);
  };

  const handleContinue = () => {
    if (selectedStyle) {
      router.push('/generating');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Realistic AI',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600', fontSize: 20 },
        }} 
      />
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
              style={styles.filterTab}
            >
              <Text style={styles.filterIcon}>{category.icon}</Text>
              <Text style={styles.filterText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* All Categories - Vertical Scroll */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {CATEGORIES.map((category) => (
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
              >
                {category.styles.map((styleKey) => {
                  const style = STYLE_PRESETS[styleKey];
                  return (
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
                  );
                })}
              </ScrollView>
            </View>
          ))}
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
    </>
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
  filterIcon: {
    fontSize: 16,
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Content
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
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

