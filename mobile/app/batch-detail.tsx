import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { getBatches } from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import type { GenerationBatch, Generation } from '../src/types';

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 16;
const imageSize = (width - PADDING * 2 - GAP) / 2; // 2 columns with gap

export default function BatchDetailScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const [batch, setBatch] = useState<GenerationBatch | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBatch = async () => {
    try {
      const batchesData = await getBatches();
      const foundBatch = batchesData.batches.find(b => b.id === batchId);
      setBatch(foundBatch || null);
    } catch (error) {
      console.error('Failed to load batch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatch();
  }, [batchId]);

  const renderItem = ({ item }: { item: Generation }) => {
    const isPending = item.status === 'pending' || item.status === 'processing';
    
    // Get style name from style_key
    const styleName = item.style_key
      .split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => {
          if (!isPending && item.generated_image_url) {
            router.push({
              pathname: '/result',
              params: {
                id: item.id,
                generatedUrl: item.generated_image_url || '',
                originalUrl: item.original_image_url || '',
                styleKey: item.style_key,
                customPrompt: '',
              },
            });
          }
        }}
        disabled={isPending}
      >
        {isPending || !item.generated_image_url ? (
          <View style={styles.pendingImage}>
            <Ionicons name="hourglass-outline" size={32} color="#6366F1" />
          </View>
        ) : (
          <Image
            source={{ uri: item.generated_image_url }}
            style={styles.gridImage}
          />
        )}
        <Text style={styles.styleName} numberOfLines={1}>
          {styleName}
        </Text>
        {isPending && (
          <View style={styles.statusBadge}>
            <Ionicons name="sync" size={10} color="#6366F1" />
            <Text style={styles.statusText}>Processing</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>⏳</Text>
      <Text style={styles.emptyTitle}>Processing...</Text>
      <Text style={styles.emptySubtitle}>
        Your photos are being generated. This may take a few minutes.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Batch not found</Text>
      </View>
    );
  }

  const completedCount = batch.generations.filter(g => g.status === 'completed').length;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Batch Photos',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        {/* Header info */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {completedCount}/{batch.total_count} {batch.total_count === 1 ? 'Photo' : 'Photos'} Complete
          </Text>
          {batch.status === 'processing' && (
            <View style={styles.processingBadge}>
              <Ionicons name="sync" size={14} color="#6366F1" />
              <Text style={styles.processingText}>Processing</Text>
            </View>
          )}
        </View>

        <FlatList
          data={batch.generations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.content}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    padding: PADDING,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  processingText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: PADDING,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  gridItem: {
    width: imageSize,
    marginBottom: 8,
  },
  gridImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  pendingImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#6366F1',
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
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
