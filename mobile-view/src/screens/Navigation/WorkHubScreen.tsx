import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getNavSections } from '../../config/navConfig';
import { navigateRoot } from '../../navigation/navigationRef';
import { iconForScreen, iconForSection } from '../../config/moduleIcons';
import PremiumIcon from '../../components/ui/PremiumIcon';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function WorkHubScreen() {
  const { user } = useAuth();
  const sections = getNavSections(user);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            s.title.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [sections, query]);

  const totalModules = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Work</Text>
      <Text style={styles.subtitle}>
        {totalModules} modules for {user?.role || 'your role'} — same as web sidebar
      </Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search modules…"
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {filtered.map((section) => {
        const sectionIon = iconForSection(section.title);
        return (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHead}>
              <PremiumIcon name={sectionIon} color={colors.primary} bg={colors.successLight} size={18} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.items.length}</Text>
            </View>
            <View style={styles.grid}>
              {section.items.map((item) => {
                const meta = iconForScreen(item.screen);
                return (
                  <TouchableOpacity
                    key={item.screen + item.label}
                    style={styles.tile}
                    onPress={() => navigateRoot(item.screen, item.params)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.tileTop}>
                      <PremiumIcon name={meta.name} color={meta.color} bg={meta.color + '18'} size={20} />
                      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.tileLabel} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}

      {filtered.length === 0 ? (
        <Text style={styles.empty}>No modules match “{query}”</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  title: { ...typography.heading.h1, color: colors.textPrimary },
  subtitle: {
    ...typography.body.medium,
    color: colors.textSecondary,
    marginBottom: 16,
    marginTop: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 4 },
  search: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  section: { marginBottom: 24 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    ...typography.label.medium,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '47%',
    minHeight: 96,
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 24,
    fontSize: 15,
  },
});
