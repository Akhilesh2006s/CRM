import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  type TextInputProps,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, radii, spacing } from '../theme/colors';

export function WebLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function WebInput(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, props.style]}
    />
  );
}

export function WebButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}) {
  const v =
    variant === 'outline'
      ? styles.btnOutline
      : variant === 'destructive'
        ? styles.btnDestructive
        : styles.btnPrimary;
  const t =
    variant === 'outline'
      ? styles.btnTextOutline
      : variant === 'destructive'
        ? styles.btnTextDestructive
        : styles.btnTextPrimary;
  return (
    <TouchableOpacity
      style={[styles.btn, v, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? <ActivityIndicator color={variant === 'outline' ? colors.primary : '#fff'} size="small" /> : <Text style={t}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function WebSelect({
  label,
  value,
  onValueChange,
  items,
  placeholder,
}: {
  label?: string;
  value: string;
  onValueChange: (v: string) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <View style={styles.selectWrap}>
      {label ? <WebLabel>{label}</WebLabel> : null}
      <View style={styles.pickerBox}>
        <Picker selectedValue={value} onValueChange={onValueChange}>
          {placeholder ? <Picker.Item label={placeholder} value="" /> : null}
          {items.map((i) => (
            <Picker.Item key={i.value} label={i.label} value={i.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead}>
        {columns.map((c, i) => (
          <Text key={c} style={[styles.th, i === columns.length - 1 && styles.thRight]}>
            {c}
          </Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <Text style={styles.emptyRow}>No records.</Text>
      ) : (
        rows.map((row, ri) => (
          <View key={ri} style={styles.tr}>
            {row.map((cell, ci) => (
              <View key={ci} style={[styles.td, ci === row.length - 1 && styles.tdRight]}>
                {typeof cell === 'string' ? <Text style={styles.tdText}>{cell}</Text> : cell}
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
  btnDestructive: { backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.error },
  btnDisabled: { opacity: 0.5 },
  btnTextPrimary: { color: colors.primaryForeground, fontWeight: '600', fontSize: 14 },
  btnTextOutline: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  btnTextDestructive: { color: colors.error, fontWeight: '600', fontSize: 14 },
  selectWrap: { marginBottom: 12 },
  pickerBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundLight,
    overflow: 'hidden',
  },
  table: {
    backgroundColor: colors.backgroundLight,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHead: { flexDirection: 'row', backgroundColor: colors.tableHeader, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { flex: 1, padding: 10, fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  thRight: { textAlign: 'right' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  td: { flex: 1, padding: 10, justifyContent: 'center' },
  tdRight: { alignItems: 'flex-end' },
  tdText: { fontSize: 14, color: colors.textPrimary },
  emptyRow: { padding: 16, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
