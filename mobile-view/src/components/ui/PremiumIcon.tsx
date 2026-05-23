import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IonName;
  color?: string;
  size?: number;
  bg?: string;
  style?: ViewStyle;
};

export default function PremiumIcon({ name, color = '#16A34A', size = 22, bg = '#DCFCE7', style }: Props) {
  const box = size + 14;
  return (
    <View style={[styles.wrap, { width: box, height: box, borderRadius: box / 3, backgroundColor: bg }, style]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
