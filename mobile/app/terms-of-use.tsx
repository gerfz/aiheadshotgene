import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';

export default function TermsOfUseScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Terms of Use',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: December 26, 2024</Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using this AI Portrait Generator app, you accept and agree to be bound by these Terms of Use. If you do not agree, please do not use the app.
          </Text>

          <Text style={styles.sectionTitle}>2. Service Description</Text>
          <Text style={styles.paragraph}>
            Our app provides AI-powered portrait generation services. We use artificial intelligence to create professional portraits based on photos you upload.
          </Text>

          <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.paragraph}>
            You agree to:
          </Text>
          <Text style={styles.bullet}>• Only upload photos you have the right to use</Text>
          <Text style={styles.bullet}>• Not upload inappropriate, offensive, or illegal content</Text>
          <Text style={styles.bullet}>• Not use the service for commercial purposes without permission</Text>
          <Text style={styles.bullet}>• Not attempt to reverse engineer or copy our AI models</Text>
          <Text style={styles.bullet}>• Not share your account with others</Text>

          <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            You retain ownership of photos you upload. Generated portraits are licensed to you for personal use. You may not resell or redistribute generated portraits without permission.
          </Text>

          <Text style={styles.sectionTitle}>5. Free Credits and Subscriptions</Text>
          <Text style={styles.paragraph}>
            • New users receive free credits for portrait generation
          </Text>
          <Text style={styles.paragraph}>
            • Credits are non-transferable and have no cash value
          </Text>
          <Text style={styles.paragraph}>
            • Subscriptions provide unlimited portrait generation
          </Text>
          <Text style={styles.paragraph}>
            • Subscriptions auto-renew unless cancelled
          </Text>
          <Text style={styles.paragraph}>
            • Refunds are subject to Google Play's refund policy
          </Text>

          <Text style={styles.sectionTitle}>6. AI-Generated Content</Text>
          <Text style={styles.paragraph}>
            AI-generated portraits are created using machine learning models. While we strive for accuracy and quality:
          </Text>
          <Text style={styles.bullet}>• Results may vary and are not guaranteed</Text>
          <Text style={styles.bullet}>• We are not responsible for unexpected or undesired results</Text>
          <Text style={styles.bullet}>• Generated portraits should not be used for identity verification</Text>

          <Text style={styles.sectionTitle}>7. Prohibited Uses</Text>
          <Text style={styles.paragraph}>
            You may not use the app to:
          </Text>
          <Text style={styles.bullet}>• Create deepfakes or misleading content</Text>
          <Text style={styles.bullet}>• Impersonate others</Text>
          <Text style={styles.bullet}>• Generate content for illegal purposes</Text>
          <Text style={styles.bullet}>• Harass, abuse, or harm others</Text>
          <Text style={styles.bullet}>• Violate any laws or regulations</Text>

          <Text style={styles.sectionTitle}>8. Service Availability</Text>
          <Text style={styles.paragraph}>
            We strive to provide continuous service but do not guarantee uninterrupted access. We may suspend or terminate service for maintenance, updates, or violations of these terms.
          </Text>

          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            We are not liable for any damages arising from your use of the app, including but not limited to data loss, service interruptions, or unsatisfactory results.
          </Text>

          <Text style={styles.sectionTitle}>10. Privacy</Text>
          <Text style={styles.paragraph}>
            Your use of the app is also governed by our Privacy Policy. Please review it to understand how we collect and use your data.
          </Text>

          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.
          </Text>

          <Text style={styles.sectionTitle}>12. Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend your access to the app at any time for violations of these terms or for any other reason at our discretion.
          </Text>

          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          <Text style={styles.paragraph}>
            These terms are governed by applicable laws. Any disputes shall be resolved in accordance with local jurisdiction.
          </Text>

          <Text style={styles.sectionTitle}>14. Contact</Text>
          <Text style={styles.paragraph}>
            For questions about these terms, please contact us through the app's Contact Us page.
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

