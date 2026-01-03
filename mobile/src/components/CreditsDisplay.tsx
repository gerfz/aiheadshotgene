import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CreditsInfo } from '../types';

interface CreditsDisplayProps {
  credits: CreditsInfo | null;
}

export function CreditsDisplay({ credits }: CreditsDisplayProps) {
  if (!credits) return null;

  if (credits.isSubscribed) {
    return (
      <View style={[styles.container, styles.subscribed]}>
        <Text style={styles.text}>Pro Member</Text>
      </View>
    );
  }

  // Normalize freeCredits to handle undefined, null, or 0
  const freeCredits = credits.freeCredits ?? 0;

  // Show "Upgrade Now" banner when credits are 0 or undefined
  if (freeCredits === 0 || !credits.hasCredits) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles.upgradeContainer]}
        onPress={() => router.push('/subscription')}
        activeOpacity={0.8}
      >
        <Text style={styles.upgradeText}>Upgrade Now</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎁</Text>
      <Text style={styles.text}>
        {freeCredits} free {freeCredits === 1 ? 'photo' : 'photos'} remaining
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  subscribed: {
    backgroundColor: '#4F46E5',
  },
  upgradeContainer: {
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

