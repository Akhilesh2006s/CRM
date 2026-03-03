import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography } from '../theme/typography';

interface MessageBannerProps {
  type: 'success' | 'error';
  message: string;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export default function MessageBanner({
  type,
  message,
  onDismiss,
  actionLabel,
  onAction,
}: MessageBannerProps) {
  const isSuccess = type === 'success';

  return (
    <View style={[styles.banner, isSuccess ? styles.successBanner : styles.errorBanner]}>
      <Text style={[styles.icon, isSuccess ? styles.successIcon : styles.errorIcon]}>
        {isSuccess ? '✓' : '!'}
      </Text>
      <Text style={[styles.text, isSuccess ? styles.successText : styles.errorText]}>{message}</Text>
      {isSuccess && actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {!isSuccess && onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  successBanner: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  successIcon: { color: '#10B981' },
  errorIcon: { color: '#EF4444' },
  text: {
    ...typography.body.medium,
    marginBottom: 12,
  },
  successText: { color: '#065F46', fontWeight: '600' },
  errorText: { color: '#991B1B' },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  dismissButton: { alignSelf: 'flex-start' },
  dismissText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
});
