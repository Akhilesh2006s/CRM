import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getNavSections } from '../../config/navConfig';
import { navigateRoot } from '../../navigation/navigationRef';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function WorkHubScreen() {
  const { user } = useAuth();
  const sections = getNavSections(user);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Work</Text>
      <Text style={styles.subtitle}>Modules for {user?.role || 'your role'}</Text>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <TouchableOpacity
              key={item.screen + item.label}
              style={styles.row}
              onPress={() => navigateRoot(item.screen, item.params)}
              activeOpacity={0.7}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  title: { ...typography.heading.h1, color: colors.textPrimary },
  subtitle: { ...typography.body.medium, color: colors.textSecondary, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { ...typography.label.medium, color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowLabel: { ...typography.body.medium, color: colors.textPrimary, fontWeight: '500' },
  chevron: { fontSize: 22, color: colors.textSecondary },
});
