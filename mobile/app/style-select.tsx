import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { StyleCard } from '../src/components';
import { useAppStore } from '../src/store/useAppStore';
import { STYLE_LIST } from '../src/constants/styles';

export default function StyleSelectScreen() {
  const { selectedStyle, setSelectedStyle, customPrompt, setCustomPrompt } = useAppStore();
  const [localCustomPrompt, setLocalCustomPrompt] = useState(customPrompt || '');

  const isCustomSelected = selectedStyle === 'custom';
  const canContinue = selectedStyle && (!isCustomSelected || localCustomPrompt.trim().length > 0);

  const handleContinue = () => {
    if (canContinue) {
      if (isCustomSelected) {
        setCustomPrompt(localCustomPrompt.trim());
      }
      router.push('/generating');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Choose Style' }} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
            keyboardShouldPersistTaps="handled"
          >
            {STYLE_LIST.map((style) => (
              <StyleCard
                key={style.key}
                style={style}
                selected={selectedStyle === style.key}
                onSelect={() => {
                  setSelectedStyle(style.key);
                  if (style.key !== 'custom') {
                    setCustomPrompt(null);
                  }
                }}
              />
            ))}
          </ScrollView>

          {isCustomSelected && (
            <View style={styles.customPromptContainer}>
              <Text style={styles.customPromptLabel}>
                Describe your desired portrait style:
              </Text>
              <TextInput
                style={styles.customPromptInput}
                placeholder="E.g., A professional photo in a modern office with natural lighting..."
                placeholderTextColor="#6B7280"
                value={localCustomPrompt}
                onChangeText={setLocalCustomPrompt}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoFocus
              />
              <Text style={styles.customPromptHint}>
                💡 Your face will be kept 100% accurate. Just describe the setting, style, and mood you want.
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, !canContinue && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text style={styles.buttonText}>Generate Portrait</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  customPromptContainer: {
    backgroundColor: '#1F2937',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  customPromptLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  customPromptInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 100,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  customPromptHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 12,
    lineHeight: 18,
  },
});
