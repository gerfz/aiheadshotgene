import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAppStore } from '../src/store/useAppStore';

const { width } = Dimensions.get('window');

export default function EditPortraitScreen() {
  const params = useLocalSearchParams<{
    generatedUrl: string;
    originalUrl: string;
    styleKey: string;
    id?: string;
  }>();

  const { generatedUrl, originalUrl, styleKey, id } = params;
  const { credits } = useAppStore();

  const [editPrompt, setEditPrompt] = useState('');

  const handleEdit = () => {
    if (!editPrompt.trim()) {
      Alert.alert('Enter Changes', 'Please describe what you want to change');
      return;
    }

    // Check if user is subscribed
    if (!credits?.isSubscribed) {
      Alert.alert(
        'Pro Feature',
        'Editing portraits is a Pro feature. Subscribe to unlock unlimited edits!',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Plans', 
            onPress: () => router.push('/subscription')
          }
        ]
      );
      return;
    }

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

  const suggestions = [
    { icon: 'shirt-outline', text: 'Red Suit' },
    { icon: 'pricetag-outline', text: 'Add Tie' },
    { icon: 'happy-outline', text: 'Smile' },
    { icon: 'sunny-outline', text: 'Brighter' },
    { icon: 'business-outline', text: 'Office BG' },
    { icon: 'glasses-outline', text: 'Glasses' },
    { icon: 'color-palette-outline', text: 'B&W' },
    { icon: 'cut-outline', text: 'Shorter Hair' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Photo',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Image Preview Section */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: generatedUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.wandContainer}>
               <Ionicons name="color-wand" size={20} color="#FFFFFF" />
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>What would you like to change?</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ex: Change tie to red, make me smile, remove glasses..."
                placeholderTextColor="#64748B"
                value={editPrompt}
                onChangeText={setEditPrompt}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {editPrompt.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={() => setEditPrompt('')}
                >
                  <Ionicons name="close-circle" size={20} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Suggestions (Horizontal Scroll) */}
          <View style={styles.suggestionsContainer}>
            <Text style={styles.subLabel}>Quick Suggestions</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => {
                    const newText = editPrompt 
                      ? `${editPrompt}, ${item.text.toLowerCase()}`
                      : item.text;
                    setEditPrompt(newText);
                  }}
                >
                  <Ionicons name={item.icon as any} size={16} color="#E2E8F0" />
                  <Text style={styles.suggestionText}>{item.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Pro Tip Section */}
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Pro Tip:</Text> Be specific with colors and styles for best results!
            </Text>
          </View>

        </ScrollView>

        {/* Bottom Action Section */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.generateButton, !editPrompt.trim() && styles.generateButtonDisabled]}
            onPress={handleEdit}
            disabled={!editPrompt.trim()}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.generateButtonText}>Generate New Version</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            Modifies only what you ask, keeps the rest.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Space for footer
  },
  
  // Image Preview
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  previewImage: {
    width: width * 0.65, // Increased from 0.5
    height: width * 0.65 * 1.3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  wandContainer: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#6366F1',
    padding: 10,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#0F172A',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },

  // Input
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    paddingRight: 40,
    color: '#FFFFFF',
    fontSize: 16,
    height: 100,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Suggestions
  suggestionsContainer: {
    flex: 1, // Fill available space
  },
  suggestionsScroll: {
    paddingRight: 20,
    gap: 10,
    paddingBottom: 20, // Add some bottom padding
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)', // Tinted blue bg
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  suggestionText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },

  // Pro Tip
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)', // Amber tint
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    marginTop: 10,
  },
  tipText: {
    color: '#94A3B8',
    fontSize: 13,
    flex: 1,
  },
  tipBold: {
    color: '#F59E0B',
    fontWeight: '700',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  generateButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerNote: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
});
