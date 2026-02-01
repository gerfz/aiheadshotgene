import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';
import { getBatches } from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import type { GenerationBatch } from '../src/types';

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 16;
const imageSize = (width - PADDING * 2 - GAP) / 2; // 2 columns with gap

export default function GalleryScreen() {
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadBatches = async () => {
    try {
      const batchesData = await getBatches();
      console.log('📦 Loaded batches:', batchesData.batches?.length || 0);
      if (batchesData.batches && batchesData.batches.length > 0) {
        console.log('📦 First batch:', JSON.stringify(batchesData.batches[0], null, 2));
      }
      setBatches(Array.isArray(batchesData.batches) ? batchesData.batches : []);
    } catch (error) {
      console.error('Failed to load batches:', error);
      setBatches([]); // Set empty array on error
    }
  };

  useEffect(() => {
    loadBatches();
    
    // Auto-refresh every 3 seconds if there are pending batches
    const interval = setInterval(() => {
      const hasPending = batches.some(b => b.status === 'pending' || b.status === 'processing');
      
      if (hasPending) {
        loadBatches();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [batches]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: GenerationBatch }) => {
    const isPending = item.status === 'pending' || item.status === 'processing';
    const completedCount = item.generations?.filter(g => g.status === 'completed').length || 0;
    
    console.log(`📦 Rendering batch ${item.id}: status=${item.status}, completed=${completedCount}/${item.total_count}`);
    
    // Get first completed generation for thumbnail
    const firstCompleted = item.generations?.find(g => g.status === 'completed' && g.generated_image_url);
    
    // Format the date
    const date = new Date(item.created_at);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => {
          // Allow clicking if at least one photo is completed
          if (completedCount > 0) {
            console.log(`📦 Opening batch ${item.id}`);
            router.push({
              pathname: '/batch-detail',
              params: {
                batchId: item.id,
              },
            });
          } else {
            console.log(`📦 Batch ${item.id} has no completed photos yet`);
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
            <Text style={styles.projectTitle}>Batch Generation</Text>
            <Text style={styles.imageCount}>
              {completedCount}/{item.total_count} {item.total_count === 1 ? 'photo' : 'photos'}
            </Text>
            {isPending ? (
              <View style={styles.statusContainer}>
                <Ionicons name="sync" size={12} color="#6366F1" />
                <Text style={styles.statusText}>
                  {item.status === 'pending' ? '2 minutes left' : 'Processing...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.dateText}>{formattedDate}</Text>
            )}
          </View>
          
          {/* Delete button - only show for completed */}
          {!isPending && completedCount === item.total_count && (
            <TouchableOpacity style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>✨</Text>
      <Text style={styles.emptyTitle}>It's empty here</Text>
      <Text style={styles.emptySubtitle}>
        Your projects will appear here once you generate something.
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'History',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#FFFFFF',
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
        <FlatList
          data={batches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.content}
          ListEmptyComponent={renderEmpty}
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







