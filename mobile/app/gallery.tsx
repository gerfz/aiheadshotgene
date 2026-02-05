import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { getBatches, deleteBatch } from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import type { GenerationBatch } from '../src/types';

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 16;
const imageSize = (width - PADDING * 2 - GAP) / 2; // 2 columns with gap

export default function GalleryScreen() {
  const params = useLocalSearchParams<{ newGeneration?: string }>();
  const isNewGeneration = params.newGeneration === 'true';
  
  const { cachedBatches, setCachedBatches } = useAppStore();
  // Start with cached batches if available
  const [batches, setBatches] = useState<GenerationBatch[]>(cachedBatches || []);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [showNewGenerationBanner, setShowNewGenerationBanner] = useState(isNewGeneration);
  const [initialBatchCount] = useState(cachedBatches?.length || 0);
  const batchesRef = useRef<GenerationBatch[]>(batches);
  const showBannerRef = useRef(isNewGeneration);

  const loadBatches = async () => {
    try {
      const batchesData = await getBatches();
      const batchesArray = Array.isArray(batchesData.batches) ? batchesData.batches : [];
      
      setBatches(batchesArray);
      batchesRef.current = batchesArray; // Update ref for interval
      setCachedBatches(batchesArray); // Cache the batches
      
      // Hide banner when new batch appears (count increased)
      if (showBannerRef.current && batchesArray.length > initialBatchCount) {
        setShowNewGenerationBanner(false);
        showBannerRef.current = false;
      }
      
      setInitialLoading(false);
    } catch (error) {
      console.error('Failed to load batches:', error);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    // Load batches immediately when screen mounts
    loadBatches();
    
    // Set up auto-refresh interval
    const interval = setInterval(() => {
      const hasPending = batchesRef.current.some(b => b.status === 'pending' || b.status === 'processing');
      
      // Keep polling if there are pending batches OR if we're waiting for new generation
      if (hasPending || showBannerRef.current) {
        loadBatches();
      }
    }, 3000);

    // Hide banner after 60 seconds max
    const bannerTimeout = setTimeout(() => {
      setShowNewGenerationBanner(false);
      showBannerRef.current = false;
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(bannerTimeout);
    };
  }, []); // Only run once on mount

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const handleDeleteBatch = async (batchId: string, photoCount: number) => {
    Alert.alert(
      'Delete Batch',
      `Are you sure you want to delete ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBatch(batchId);
              // Reload batches after deletion
              await loadBatches();
            } catch (error) {
              console.error('Failed to delete batch:', error);
              Alert.alert('Error', 'Failed to delete batch. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: GenerationBatch }) => {
    const isPending = item.status === 'pending' || item.status === 'processing';
    const completedCount = item.generations?.filter(g => g.status === 'completed').length || 0;
    
    // Get first completed generation for thumbnail
    const firstCompleted = item.generations?.find(g => g.status === 'completed' && g.generated_image_url);
    
    // Get style names from generations - show "Edited Photo" for edited
    const styleNames = item.generations
      ?.map(g => {
        // Check if this is an edited photo
        if (g.is_edited) {
          return 'Edited Photo';
        }
        // Otherwise show the style name
        return g.style_key
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      })
      .join(', ') || 'Processing...';
    
    // Format the date with error handling
    let formattedDate = 'Just now';
    try {
      if (item.created_at) {
        const date = new Date(item.created_at);
        if (!isNaN(date.getTime())) {
          formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
      }
    } catch (e) {
      console.error('Date formatting error:', e);
    }
    
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => {
          // Allow clicking if at least one photo is completed
          if (completedCount > 0) {
            // If only 1 photo, open directly in result screen
            if (item.total_count === 1 && firstCompleted) {
              router.push({
                pathname: '/result',
                params: {
                  id: firstCompleted.id,
                  generatedUrl: firstCompleted.generated_image_url || '',
                  originalUrl: firstCompleted.original_image_url || '',
                  styleKey: firstCompleted.style_key,
                  customPrompt: '',
                },
              });
            } else {
              // Multiple photos, open batch detail
              router.push({
                pathname: '/batch-detail',
                params: {
                  batchId: item.id,
                },
              });
            }
          }
        }}
        disabled={completedCount === 0}
      >
        <View style={styles.cardContainer}>
          {firstCompleted ? (
            <Image
              source={{ uri: firstCompleted.generated_image_url! }}
              style={styles.gridImage}
            />
          ) : (
            <View style={styles.pendingImageContainer}>
              <Ionicons name="hourglass-outline" size={32} color="#6366F1" />
            </View>
          )}
          
          {/* Info section on the right */}
          <View style={styles.infoSection}>
            <Text style={styles.projectTitle} numberOfLines={1}>{styleNames}</Text>
            <Text style={styles.imageCount}>
              {completedCount}/{item.total_count} {item.total_count === 1 ? 'photo' : 'photos'}
            </Text>
            {isPending ? (
              <View style={styles.statusContainer}>
                <Ionicons name="sync" size={12} color="#6366F1" />
                <Text style={styles.statusText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.dateText}>{formattedDate}</Text>
            )}
          </View>
          
          {/* Delete button - always show */}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent opening the batch
              handleDeleteBatch(item.id, item.total_count);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };


  const renderEmpty = () => {
    if (initialLoading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyTitle}>Loading...</Text>
          <Text style={styles.emptySubtitle}>
            Fetching your photos
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>✨</Text>
        <Text style={styles.emptyTitle}>It's empty here</Text>
        <Text style={styles.emptySubtitle}>
          Your projects will appear here once you generate something.
        </Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'History',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
          animation: 'fade',
          animationDuration: 150,
          headerTitleStyle: { fontWeight: 600 },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/home')}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/profile-new')}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        {/* New Generation Banner */}
        {showNewGenerationBanner && (
          <View style={styles.newGenerationBanner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="hourglass-outline" size={24} color="#6366F1" />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Processing your photo...</Text>
              <Text style={styles.bannerSubtitle}>This usually takes 15-30 seconds</Text>
            </View>
          </View>
        )}
        
        <FlatList
          data={batches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.content}
          ListEmptyComponent={!showNewGenerationBanner ? renderEmpty : null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
          showsVerticalScrollIndicator={false}
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
  content: {
    padding: PADDING,
    paddingBottom: 40,
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
  
  // New Generation Banner
  newGenerationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#888888',
    fontSize: 14,
  },
  
  gridItem: {
    marginBottom: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  gridImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  pendingImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
    marginLeft: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  imageCount: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666666',
  },
  deleteButton: {
    padding: 8,
  },
});







