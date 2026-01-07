import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import posthog from '../services/posthog';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

export function FeedbackModal({ visible, onClose, userId }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Empty Feedback', 'Please enter your feedback before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData = {
        $feedback: feedback.trim(), // Using $ prefix for custom properties
        feedback: feedback.trim(), // Regular property
        feedback_text: feedback.trim(), // Alternative name
        source: 'profile_contact_us',
        user_id: userId,
        timestamp: new Date().toISOString(),
        feedback_length: feedback.trim().length,
      };

      console.log('📝 Submitting feedback to PostHog:', feedbackData);

      // Send feedback to PostHog
      posthog.capture('feedback_submitted', feedbackData);

      console.log('✅ Feedback submitted successfully');

      // Success
      Alert.alert(
        'Thank You! 🎉',
        'Your feedback has been received. We\'ll review it shortly and get back to you if needed.',
        [
          {
            text: 'OK',
            onPress: () => {
              setFeedback('');
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert(
        'Error',
        'Failed to submit feedback. Please try again or email us at support@aiportrait.app'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedback('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView intensity={90} style={styles.blurContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#6366F1" />
                <Text style={styles.title}>Send Feedback</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              How can we help? Tell us about your experience, report issues, or suggest improvements.
            </Text>

            {/* Feedback Input */}
            <TextInput
              style={styles.textInput}
              placeholder="Type your message here..."
              placeholderTextColor="#64748B"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={1000}
              autoFocus
            />

            <Text style={styles.charCount}>{feedback.length}/1000</Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (!feedback.trim() || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!feedback.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Ionicons name="hourglass" size={18} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Sending...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#334155',
  },
  charCount: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#6366F1',
  },
  submitButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

