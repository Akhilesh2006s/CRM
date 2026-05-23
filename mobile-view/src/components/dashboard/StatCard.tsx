import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PremiumIcon from '../ui/PremiumIcon';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  value: string | number;
  subtitle?: string;
  ion: IonName;
  color: string;
  bg: string;
};

export default function StatCard({ label, value, subtitle, ion, color, bg }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: color + '33' }]}>
      <PremiumIcon name={ion} color={color} bg="#FFFFFF" size={20} />
      <Text style={[styles.label, { color: color }]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  label: {
    ...typography.label.small,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '700',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171717',
  },
  subtitle: {
    fontSize: 11,
    color: '#737373',
    marginTop: 4,
  },
});
