import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎁</Text>
      <Text style={styles.text}>
        {credits.freeCredits} free {credits.freeCredits === 1 ? 'photo' : 'photos'} remaining
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
  icon: {
    fontSize: 16,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

