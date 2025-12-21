import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, StyleCard } from '../components';
import { useAppStore } from '../store/useAppStore';
import { STYLE_LIST } from '../constants/styles';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export function StyleSelectScreen({ navigation }: Props) {
  const { selectedStyle, setSelectedStyle } = useAppStore();

  const handleContinue = () => {
    if (selectedStyle) {
      navigation.navigate('Generating');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 3</Text>
        <Text style={styles.title}>Choose Your Style</Text>
        <Text style={styles.subtitle}>
          Select the professional look that fits your needs
        </Text>
      </View>

      <ScrollView
        style={styles.stylesList}
        contentContainerStyle={styles.stylesContent}
        showsVerticalScrollIndicator={false}
      >
        {STYLE_LIST.map((style) => (
          <StyleCard
            key={style.key}
            style={style}
            selected={selectedStyle === style.key}
            onSelect={() => setSelectedStyle(style.key)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Generate Portrait"
          onPress={handleContinue}
          disabled={!selectedStyle}
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
  header: {
    padding: 20,
    paddingBottom: 8,
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
  },
  stylesList: {
    flex: 1,
  },
  stylesContent: {
    padding: 20,
    paddingTop: 12,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
  },
});

