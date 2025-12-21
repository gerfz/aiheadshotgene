import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, CreditsDisplay } from '../components';
import { useAppStore } from '../store/useAppStore';
import { getUserCredits, getUserGenerations } from '../services/api';
import { signOut } from '../services/supabase';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export function HomeScreen({ navigation }: Props) {
  const { user, credits, generations, setCredits, setGenerations, setUser } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [creditsData, generationsData] = await Promise.all([
        getUserCredits(),
        getUserGenerations(),
      ]);
      setCredits(creditsData);
      setGenerations(generationsData.generations);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  const handleStartGeneration = () => {
    if (!credits?.hasCredits) {
      navigation.navigate('Subscription');
      return;
    }
    navigation.navigate('Upload');
  };

  const completedGenerations = generations.filter(g => g.status === 'completed');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Credits */}
      <View style={styles.creditsContainer}>
        <CreditsDisplay credits={credits} />
      </View>

      {/* CTA */}
      <View style={styles.ctaCard}>
        <Text style={styles.ctaEmoji}>✨</Text>
        <Text style={styles.ctaTitle}>Create Your Professional Portrait</Text>
        <Text style={styles.ctaSubtitle}>
          Upload a photo and let AI transform it into a stunning headshot
        </Text>
        <Button
          title="Start New Portrait"
          onPress={handleStartGeneration}
          style={styles.ctaButton}
        />
      </View>

      {/* Previous Generations */}
      {completedGenerations.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Your Portraits</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyScroll}
          >
            {completedGenerations.map((gen) => (
              <TouchableOpacity
                key={gen.id}
                style={styles.historyCard}
                onPress={() => navigation.navigate('Result', { generation: gen })}
              >
                <Image
                  source={{ uri: gen.generated_image_url! }}
                  style={styles.historyImage}
                />
                <Text style={styles.historyStyle}>
                  {gen.style_key.charAt(0).toUpperCase() + gen.style_key.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Upload</Text>
            <Text style={styles.stepDescription}>
              Take or select a clear photo of yourself
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Choose Style</Text>
            <Text style={styles.stepDescription}>
              Pick from our professional styles
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Generate</Text>
            <Text style={styles.stepDescription}>
              AI creates your perfect headshot
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
  },
  creditsContainer: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  ctaCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 32,
  },
  ctaEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    width: '100%',
  },
  historySection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  historyScroll: {
    paddingRight: 20,
  },
  historyCard: {
    marginRight: 16,
    width: 140,
  },
  historyImage: {
    width: 140,
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyStyle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  howItWorks: {
    marginBottom: 40,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

