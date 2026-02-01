import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '../store/useAppStore';

interface CreditsHeaderProps {
  showHistory?: boolean;
  onHistoryPress?: () => void;
}

export function CreditsHeader({ showHistory = true, onHistoryPress }: CreditsHeaderProps) {
  const credits = useAppStore((state) => state.credits);

  const handleHistoryPress = () => {
    if (onHistoryPress) {
      onHistoryPress();
    } else {
      router.push('/gallery');
    }
  };

  const handleCreditsPress = () => {
    // Navigate to subscription/credit packs screen
    router.push('/subscription');
  };

  return (
    <View style={styles.container}>
      {/* Left: Credits Display */}
      <TouchableOpacity 
        style={styles.creditsButton}
        onPress={handleCreditsPress}
        activeOpacity={0.7}
      >
        <Ionicons name="diamond" size={20} color="#A78BFA" />
        <Text style={styles.creditsText}>
          {credits?.totalCredits?.toLocaleString() || '0'}
        </Text>
        {credits?.isTrialActive && (
          <View style={styles.trialBadge}>
            <Text style={styles.trialText}>TRIAL</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Center: App Title */}
      <Text style={styles.title}>AI Headshot Studio</Text>

      {/* Right: History Button */}
      {showHistory && (
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={handleHistoryPress}
          activeOpacity={0.7}
        >
          <Ionicons name="images-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  creditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minWidth: 80,
  },
  creditsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trialBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  trialText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1, // Behind buttons so they're tappable
  },
  historyButton: {
    padding: 8,
  },
});
