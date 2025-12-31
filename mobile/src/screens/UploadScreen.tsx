import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button, PhotoPicker } from '../components';
import { useAppStore } from '../store/useAppStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export function UploadScreen({ navigation }: Props) {
  const { selectedImage, setSelectedImage } = useAppStore();

  const handleContinue = () => {
    if (selectedImage) {
      navigation.navigate('StyleSelect');
    }
  };

  return (
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

        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedImage}
          />
        </View>
      </View>
    </SafeAreaView>
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
    marginTop: 'auto',
    paddingTop: 20,
  },
});

