import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { hasBeenAskedToRate } from './RateUsModal';
import { analytics } from '../services/posthog';

interface NoCreditsModalProps {
  visible: boolean;
  onClose: () => void;
  onRateUs: () => void;
  source?: 'create_button' | 'upload' | 'generation';
}

export const NoCreditsModal: React.FC<NoCreditsModalProps> = ({ 
  visible, 
  onClose, 
  onRateUs,
  source = 'create_button'
}) => {
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  const [hasAlreadyRated, setHasAlreadyRated] = useState(false);

  useEffect(() => {
    if (visible) {
      // Check if user has already rated
      hasBeenAskedToRate().then((hasRated) => {
        setHasAlreadyRated(hasRated);
        
        // Track modal shown event
        analytics.noCreditsModalShown(hasRated, source);
      });
      
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
    }
  }, [visible]);

  const handleRateUs = () => {
    // Track rate us button click
    analytics.noCreditsRateUsClicked();
    analytics.noCreditsModalClosed('rate_us', hasAlreadyRated);
    
    onClose();
    // Small delay to allow modal to close before showing rate modal
    setTimeout(() => {
      onRateUs();
    }, 100);
  };

  const handleSubscribe = () => {
    // Track subscribe button click
    analytics.noCreditsSubscribeClicked(hasAlreadyRated);
    analytics.noCreditsModalClosed('subscribe', hasAlreadyRated);
    
    onClose();
    // Small delay to allow modal to close before navigating
    setTimeout(() => {
      router.push('/subscription');
    }, 100);
  };

  const handleClose = () => {
    // Track dismissal
    analytics.noCreditsModalClosed('dismissed', hasAlreadyRated);
    onClose();
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
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="wallet-outline" size={48} color="#EF4444" />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Out of Credits</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {hasAlreadyRated 
              ? "You've run out of free credits. Subscribe to get unlimited AI headshots!"
              : "You've run out of free credits. Get more credits to continue creating amazing AI headshots!"
            }
          </Text>

          {/* Rate Us Button - Only show if user hasn't rated yet */}
          {!hasAlreadyRated && (
            <TouchableOpacity
              style={[styles.button, styles.rateButton]}
              onPress={handleRateUs}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="star" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Rate Us for 2 Free Credits</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Subscribe Button */}
          <TouchableOpacity
            style={[
              styles.button, 
              styles.subscribeButton,
              hasAlreadyRated && styles.lastButton
            ]}
            onPress={handleSubscribe}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Go Pro - Unlimited Credits</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
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
    shadowColor: '#000',
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rateButton: {
    backgroundColor: '#10B981',
  },
  subscribeButton: {
    backgroundColor: '#6366F1',
  },
  lastButton: {
    marginBottom: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default NoCreditsModal;
