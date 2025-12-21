import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router, Stack } from 'expo-router';
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

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>📌 Tips for great results:</Text>
            <Text style={styles.tip}>• Face the camera directly</Text>
            <Text style={styles.tip}>• Use even, natural lighting</Text>
            <Text style={styles.tip}>• Avoid heavy shadows on your face</Text>
            <Text style={styles.tip}>• Keep a neutral expression or slight smile</Text>
          </View>

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
    padding: 20,
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
  tips: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 6,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
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

