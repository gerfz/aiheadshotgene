import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function PrivacyPolicyScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: February 3, 2026</Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect minimal information necessary to provide our AI portrait generation service:
          </Text>
          <Text style={styles.bullet}>• Photos you upload for portrait generation</Text>
          <Text style={styles.bullet}>• Generated AI portraits</Text>
          <Text style={styles.bullet}>• Device identifier for app functionality</Text>
          <Text style={styles.bullet}>• Usage data (which styles you use)</Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            Your information is used solely to:
          </Text>
          <Text style={styles.bullet}>• Generate AI portraits based on your photos</Text>
          <Text style={styles.bullet}>• Store your generated portraits for your access</Text>
          <Text style={styles.bullet}>• Improve our AI models and service quality</Text>
          <Text style={styles.bullet}>• Manage your subscription and credits</Text>

          <Text style={styles.sectionTitle}>3. Data Storage</Text>
          <Text style={styles.paragraph}>
            Your photos and generated portraits are securely stored on Supabase servers. We do not share, sell, or distribute your images to third parties.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Retention</Text>
          <Text style={styles.paragraph}>
            You can delete your portraits at any time from the app. Deleted portraits are permanently removed from our servers.
          </Text>

          <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We use the following third-party services:
          </Text>
          <Text style={styles.bullet}>• Supabase (database and storage)</Text>
          <Text style={styles.bullet}>• Replicate (AI model processing)</Text>
          <Text style={styles.bullet}>• RevenueCat (subscription management)</Text>
          <Text style={styles.bullet}>• Google Play (payment processing)</Text>

          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <Text style={styles.bullet}>• Access your data</Text>
          <Text style={styles.bullet}>• Delete your data</Text>
          <Text style={styles.bullet}>• Request data export</Text>
          <Text style={styles.bullet}>• Opt-out of data collection</Text>

          <Text style={styles.sectionTitle}>7. Security</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard security measures to protect your data. All data transmission is encrypted using HTTPS.
          </Text>

          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our service is not intended for users under 13 years of age. We do not knowingly collect information from children.
          </Text>

          <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this privacy policy from time to time. We will notify you of any changes by updating the "Last Updated" date.
          </Text>

          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this privacy policy, please contact us at support@aigen.com or through the app's Contact Us page.
          </Text>
        </ScrollView>
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
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 24,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
  },
});

