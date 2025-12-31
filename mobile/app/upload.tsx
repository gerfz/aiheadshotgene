import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PhotoPicker } from '../src/components';
import { useAppStore } from '../src/store/useAppStore';

export default function UploadScreen() {
  const { selectedImage, setSelectedImage } = useAppStore();

  const handleContinue = () => {
    if (selectedImage) {
      router.push('/style-select');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Upload Photo' }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.step}>Step 1 of 3</Text>
              <Text style={styles.title}>Upload Your Photo</Text>
              <Text style={styles.subtitle}>
                For best results, use a clear, front-facing photo with good lighting
              </Text>
            </View>

            <PhotoPicker
              imageUri={selectedImage}
              onImageSelected={setSelectedImage}
            />

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>GUIDE FOR BEST RESULTS</Text>
              
              <View style={styles.tipsGrid}>
                <View style={styles.tipRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="scan-outline" size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.tipText}>Face the camera directly</Text>
                </View>
                
                <View style={styles.tipRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="sunny-outline" size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.tipText}>Use natural, even lighting</Text>
                </View>
                
                <View style={styles.tipRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="contrast-outline" size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.tipText}>Avoid heavy shadows</Text>
                </View>
                
                <View style={styles.tipRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="happy-outline" size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.tipText}>Keep a natural expression</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, !selectedImage && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!selectedImage}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 12,
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
    lineHeight: 22,
  },
  tipsContainer: {
    marginTop: 32,
    paddingHorizontal: 4,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tipsGrid: {
    gap: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 20, // Reduced bottom padding as SafeAreaView handles safe area
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
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

