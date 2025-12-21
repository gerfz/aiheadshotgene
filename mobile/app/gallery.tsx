import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { getGenerations } from '../src/services/api';
import { BottomNav } from '../src/components';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 2; // 2 columns with padding

export default function GalleryScreen() {
  const { generations, setGenerations } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadGenerations = async () => {
    try {
      const generationsData = await getGenerations();
      setGenerations(generationsData.generations);
    } catch (error) {
      console.error('Failed to load generations:', error);
    }
  };

  useEffect(() => {
    loadGenerations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGenerations();
    setRefreshing(false);
  };

  const completedGenerations = generations.filter(g => g.status === 'completed');

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Your Gallery',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 600 },
        }} 
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
        >
          {completedGenerations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🖼️</Text>
              <Text style={styles.emptyTitle}>No portraits yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first professional portrait to see it here
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {completedGenerations.map((gen) => (
                <TouchableOpacity
                  key={gen.id}
                  style={styles.gridItem}
                  onPress={() =>
                    router.push({
                      pathname: '/result',
                      params: {
                        id: gen.id,
                        generatedUrl: gen.generated_image_url || '',
                        originalUrl: gen.original_image_url || '',
                        styleKey: gen.style_key,
                      },
                    })
                  }
                >
                  <Image
                    source={{ uri: gen.generated_image_url! }}
                    style={styles.gridImage}
                  />
                  <View style={styles.gridOverlay}>
                    <Text style={styles.gridStyle}>
                      {gen.style_key.charAt(0).toUpperCase() + gen.style_key.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        <BottomNav />
      </View>
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
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: imageSize,
    height: imageSize * 1.3,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  gridStyle: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

