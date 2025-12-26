import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EditPortraitScreen() {
  const params = useLocalSearchParams<{
    generatedUrl: string;
    originalUrl: string;
    styleKey: string;
    id?: string;
  }>();

  const { generatedUrl, originalUrl, styleKey, id } = params;

  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleEdit = () => {
    if (!editPrompt.trim()) {
      Alert.alert('Enter Changes', 'Please describe what you want to change');
      return;
    }

    // Navigate to generating screen with edit mode
    router.push({
      pathname: '/generating',
      params: {
        imageUrl: generatedUrl,
        editPrompt: editPrompt,
        isEdit: 'true',
        originalGeneratedUrl: generatedUrl,
        originalUrl: originalUrl,
        styleKey: styleKey,
        originalId: id || '',
      },
    });
  };

  const examplePrompts = [
    'Change the shirt color to navy blue',
    'Add a smile',
    'Change the background to white',
    'Make the lighting brighter',
    'Add professional glasses',
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Portrait',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.icon}>✨</Text>
            <Text style={styles.title}>Refine Your Portrait</Text>
            <Text style={styles.subtitle}>
              Describe what you'd like to change. We'll keep your face exactly the same!
            </Text>
          </View>

          <View style={styles.imagePreview}>
            <Image
              source={{ uri: generatedUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.editBadge}>
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text style={styles.editBadgeText}>Editing</Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>What would you like to change?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Change shirt to blue, add glasses, brighter lighting..."
              placeholderTextColor="#64748B"
              value={editPrompt}
              onChangeText={setEditPrompt}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.hint}>
              💡 Be specific! The more details you provide, the better the result.
            </Text>
          </View>

          <View style={styles.examplesSection}>
            <Text style={styles.examplesTitle}>Example changes:</Text>
            {examplePrompts.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleChip}
                onPress={() => setEditPrompt(example)}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateButton, !editPrompt.trim() && styles.generateButtonDisabled]}
            onPress={handleEdit}
            disabled={!editPrompt.trim()}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.generateButtonText}>Generate Edited Portrait</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              Your face will remain exactly the same. Only the requested changes will be applied.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  previewImage: {
    width: 200,
    height: 260,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  editBadge: {
    position: 'absolute',
    top: 12,
    right: '50%',
    transform: [{ translateX: 70 }],
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  editBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hint: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  examplesSection: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
  },
  exampleChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exampleText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  generateButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  infoText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
});

