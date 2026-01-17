import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import * as SecureStore from 'expo-secure-store';
import { analytics } from '../services/posthog';

const RATE_US_SHOWN_KEY = 'rate_us_shown';
const GENERATION_COUNT_KEY = 'generation_count';

interface RateUsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RateUsModal: React.FC<RateUsModalProps> = ({ visible, onClose }) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      setSelectedRating(0);
      setShowThankYou(false);
    }
  }, [visible]);

  const handleStarPress = async (rating: number) => {
    setSelectedRating(rating);
    
    // Track the rating
    analytics.appRated(rating);
    
    // Small delay to show the selection
    setTimeout(async () => {
      // Award 2 credits for ANY rating
      try {
        const { awardRatingCredits } = await import('../services/api');
        await awardRatingCredits();
        console.log('✅ Awarded 2 credits for rating');
      } catch (error) {
        console.log('Error awarding credits:', error);
      }
      
      if (rating >= 4) {
        // Good rating - trigger native store review
        try {
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            await StoreReview.requestReview();
          } else {
            // Fallback: open store page directly
            if (Platform.OS === 'android') {
              // You can add your Play Store link here
              // Linking.openURL('market://details?id=YOUR_PACKAGE_NAME');
            }
          }
        } catch (error) {
          console.log('Store review error:', error);
        }
        
        setShowThankYou(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Low rating - don't send to Play Store, but still give credits (already awarded above)
        setShowThankYou(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
      
      // Mark as shown so we don't ask again
      await SecureStore.setItemAsync(RATE_US_SHOWN_KEY, 'true');
    }, 300);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isSelected = i <= selectedRating;
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          style={styles.starButton}
          activeOpacity={0.7}
        >
          <Animated.View
            style={[
              styles.starContainer,
              isSelected && styles.starSelected,
            ]}
          >
            <Ionicons
              name={isSelected ? 'star' : 'star-outline'}
              size={40}
              color={isSelected ? '#FFD700' : '#64748B'}
            />
          </Animated.View>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <BlurView intensity={30} style={styles.overlay} tint="dark">
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {!showThankYou ? (
            <>
              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>

              {/* Emoji header */}
              <Text style={styles.emoji}>✨</Text>
              
              {/* Title */}
              <Text style={styles.title}>Enjoying the App?</Text>
              
              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Rate us and earn 2 free credits!{'\n'}
                Tap a star to rate us
              </Text>

              {/* Stars */}
              <View style={styles.starsContainer}>
                {renderStars()}
              </View>

              {/* Description labels */}
              <View style={styles.labelsContainer}>
                <Text style={styles.labelText}>Not great</Text>
                <Text style={styles.labelText}>Love it!</Text>
              </View>
            </>
          ) : (
            <>
              {/* Thank you state */}
              <Text style={styles.thankYouEmoji}>
                {selectedRating >= 4 ? '🎉' : '💙'}
              </Text>
              <Text style={styles.thankYouTitle}>
                {selectedRating >= 4 ? 'Thank You!' : 'Thanks for the feedback!'}
              </Text>
              <Text style={styles.thankYouSubtitle}>
                {selectedRating >= 4 
                  ? 'You earned 2 free credits! 🎁' 
                  : 'You earned 2 free credits! We\'ll work hard to improve! 🎁'}
              </Text>
            </>
          )}
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// Helper functions for managing rate us logic
export const shouldShowRateUs = async (): Promise<boolean> => {
  try {
    const shown = await SecureStore.getItemAsync(RATE_US_SHOWN_KEY);
    if (shown === 'true') return false;

    const countStr = await SecureStore.getItemAsync(GENERATION_COUNT_KEY);
    const count = countStr ? parseInt(countStr, 10) : 0;
    
    // Show after 2 generations
    return count >= 2;
  } catch {
    return false;
  }
};

export const incrementGenerationCount = async (): Promise<number> => {
  try {
    const countStr = await SecureStore.getItemAsync(GENERATION_COUNT_KEY);
    const count = (countStr ? parseInt(countStr, 10) : 0) + 1;
    await SecureStore.setItemAsync(GENERATION_COUNT_KEY, count.toString());
    return count;
  } catch {
    return 0;
  }
};

export const hasBeenAskedToRate = async (): Promise<boolean> => {
  try {
    const shown = await SecureStore.getItemAsync(RATE_US_SHOWN_KEY);
    return shown === 'true';
  } catch {
    return false;
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 28,
    padding: 28,
    paddingTop: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  starContainer: {
    transform: [{ scale: 1 }],
  },
  starSelected: {
    transform: [{ scale: 1.1 }],
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  labelText: {
    fontSize: 12,
    color: '#64748B',
  },
  thankYouEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  thankYouTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  thankYouSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RateUsModal;

