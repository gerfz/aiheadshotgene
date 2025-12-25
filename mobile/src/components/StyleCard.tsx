import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StylePreset } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const CARD_PADDING = 40; // 20px padding on each side
const IMAGE_WIDTH = screenWidth - CARD_PADDING;

interface StyleCardProps {
  style: StylePreset;
  selected: boolean;
  onSelect: () => void;
}

export function StyleCard({ style, selected, onSelect }: StyleCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const thumbnails = style.thumbnails || [style.thumbnail];
  const hasMultipleThumbnails = thumbnails.length > 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / (IMAGE_WIDTH - 32)); // Account for card border
    setActiveIndex(currentIndex);
  };

  // For custom style, don't show image container
  if (style.isCustom) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.customCard, selected && styles.selected]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        <View style={styles.customContent}>
          <Text style={styles.customIcon}>✨</Text>
          <Text style={styles.name}>{style.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {style.description}
          </Text>
        </View>
        {selected && (
          <View style={[styles.checkmark, styles.checkmarkCustom]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {hasMultipleThumbnails ? (
          <>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.carousel}
            >
              {thumbnails.map((thumb, index) => (
                <View key={index} style={[styles.imageWrapper, { width: IMAGE_WIDTH - 4 }]}>
                  <Image
                    source={thumb}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
            {/* Pagination dots */}
            <View style={styles.pagination}>
              {thumbnails.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
            {/* Swipe hint */}
            <View style={styles.swipeHint}>
              <Text style={styles.swipeHintText}>← Swipe →</Text>
            </View>
          </>
        ) : (
          <Image
            source={style.thumbnail}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        {selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
        {style.badge && (
          <View style={[
            styles.badge,
            style.badge.type === 'female' && styles.badgeFemale,
            style.badge.type === 'male' && styles.badgeMale,
          ]}>
            <Text style={styles.badgeIcon}>
              {style.badge.type === 'female' ? '♀' : style.badge.type === 'male' ? '♂' : 'ℹ'}
            </Text>
            <Text style={styles.badgeText}>{style.badge.label}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{style.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {style.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#6366F1',
  },
  imageContainer: {
    position: 'relative',
    height: 220,
  },
  carousel: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 220,
  },
  imageWrapper: {
    height: 220,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: 350, // Taller than container to allow positioning
    position: 'absolute',
    top: 0, // Align to top to show faces
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  swipeHint: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  swipeHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  badge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  badgeFemale: {
    backgroundColor: 'rgba(236, 72, 153, 0.9)', // Pink for female
  },
  badgeMale: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)', // Blue for male
  },
  badgeIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  customCard: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  checkmarkCustom: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
