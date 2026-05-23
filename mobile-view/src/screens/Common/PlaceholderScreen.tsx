import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenShell, { PageSection } from '../../ui/ScreenShell';
import { colors } from '../../theme/colors';

export default function PlaceholderScreen({ route }: any) {
  const screenName = route?.name || 'Screen';

  return (
    <ScreenShell title={screenName}>
      <PageSection title="Coming soon">
        <View style={styles.content}>
          <Text style={styles.icon}>🚧</Text>
          <Text style={styles.title}>Coming Soon</Text>
          <Text style={styles.subtitle}>
            This screen is under development and will be available soon.
          </Text>
        </View>
      </PageSection>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
