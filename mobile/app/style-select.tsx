import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { StyleCard } from '../src/components';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_LIST } from '../src/constants/styles';

export default function StyleSelectScreen() {
  const { selectedStyle, setSelectedStyle } = useAppStore();

  const handleContinue = () => {
    if (selectedStyle) {
      router.push('/generating');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Choose Style' }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 3</Text>
          <Text style={styles.title}>Choose Your Style</Text>
          <Text style={styles.subtitle}>
            Select the professional look that fits your needs
          </Text>
        </View>

        <ScrollView
          style={styles.stylesList}
          contentContainerStyle={styles.stylesContent}
          showsVerticalScrollIndicator={false}
        >
          {STYLE_LIST.map((style) => (
            <StyleCard
              key={style.key}
              style={style}
              selected={selectedStyle === style.key}
              onSelect={() => setSelectedStyle(style.key)}
            />
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !selectedStyle && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!selectedStyle}
          >
            <Text style={styles.buttonText}>Generate Portrait</Text>
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
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  step: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  stylesList: {
    flex: 1,
  },
  stylesContent: {
    padding: 20,
    paddingTop: 12,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

