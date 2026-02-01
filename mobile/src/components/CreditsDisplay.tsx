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

  // Show trial badge if active
  if (credits.isTrialActive) {
    return (
      <View style={[styles.container, styles.trial]}>
        <Ionicons name="time-outline" size={16} color="#FFFFFF" />
        <Text style={styles.text}>
          Trial: {credits.trialDaysRemaining} {credits.trialDaysRemaining === 1 ? 'day' : 'days'} left
        </Text>
      </View>
    );
  }

  // Show subscribed badge
  if (credits.isSubscribed) {
    return (
      <View style={[styles.container, styles.subscribed]}>
        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
        <Text style={styles.text}>Pro Member</Text>
      </View>
    );
  }

  const totalCredits = credits.totalCredits ?? 0;

  // Show "Get Credits" banner when credits are low or 0
  if (totalCredits === 0 || !credits.hasCredits) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles.upgradeContainer]}
        onPress={() => router.push('/subscription')}
        activeOpacity={0.8}
      >
        <Text style={styles.upgradeText}>Get Credits</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="diamond" size={16} color="#A78BFA" />
      <Text style={styles.text}>
        {totalCredits.toLocaleString()} credits
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
  trial: {
    backgroundColor: '#10B981',
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

