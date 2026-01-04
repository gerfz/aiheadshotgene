import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Button } from '../components';
import { useAppStore } from '../store/useAppStore';
import { STYLE_PRESETS } from '../constants/styles';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export function ResultScreen({ navigation, route }: Props) {
  const { setSelectedImage, setSelectedStyle } = useAppStore();
  const generation = route.params?.generation;

  if (!generation) {
    return null;
  }

  const styleName = STYLE_PRESETS[generation.styleKey]?.name || generation.styleKey;

  const handleDownload = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save photos');
        return;
      }

      const filename = `portrait_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.downloadAsync(generation.generatedImageUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(fileUri);

      Alert.alert('Success! 🎉', 'Portrait saved to your gallery');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
        return;
      }

      const filename = `portrait_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.downloadAsync(generation.generatedImageUrl, fileUri);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleCreateNew = () => {
    // Keep the selected image so user can reuse it
    // Only clear the selected style
    setSelectedStyle(null);
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.title}>Your Portrait is Ready!</Text>
          <Text style={styles.styleName}>{styleName}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: generation.generatedImageUrl }}
            style={styles.resultImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.comparison}>
          <View style={styles.compareItem}>
            <Image
              source={{ uri: generation.originalImageUrl }}
              style={styles.compareImage}
            />
            <Text style={styles.compareLabel}>Original</Text>
          </View>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={styles.compareItem}>
            <Image
              source={{ uri: generation.generatedImageUrl }}
              style={styles.compareImage}
            />
            <Text style={styles.compareLabel}>Generated</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="📥  Download"
            onPress={handleDownload}
            style={styles.actionButton}
          />
          <Button
            title="📤  Share"
            onPress={handleShare}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <Button
          title="Create New Portrait"
          onPress={handleCreateNew}
          variant="outline"
          style={styles.newButton}
        />
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  styleName: {
    fontSize: 16,
    color: '#6366F1',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultImage: {
    width: 300,
    height: 400,
    borderRadius: 20,
  },
  comparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12,
  },
  compareItem: {
    alignItems: 'center',
  },
  compareImage: {
    width: 100,
    height: 130,
    borderRadius: 12,
    marginBottom: 8,
  },
  compareLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  arrow: {
    paddingHorizontal: 12,
  },
  arrowText: {
    fontSize: 24,
    color: '#6366F1',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  newButton: {
    marginTop: 8,
  },
});

