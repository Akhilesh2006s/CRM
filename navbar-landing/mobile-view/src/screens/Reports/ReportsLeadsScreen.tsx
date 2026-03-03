import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import { typography } from '../../theme/typography';
import LogoutButton from '../../components/LogoutButton';

const cards = [
  {
    title: 'Open Leads',
    description: 'View all pending and processing leads',
    route: 'ReportsLeadsOpen',
    emoji: '📂',
    colors: ['#3b82f6', '#2563eb'],
  },
  {
    title: 'Follow-up Leads',
    description: 'Track saved and follow-up leads',
    route: 'ReportsLeadsFollowup',
    emoji: '📞',
    colors: ['#f97316', '#ea580c'],
  },
  {
    title: 'Closed Leads',
    description: 'View successfully converted leads',
    route: 'ReportsLeadsClosed',
    emoji: '✅',
    colors: ['#22c55e', '#16a34a'],
  },
];

export default function ReportsLeadsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leads Reports</Text>
          <LogoutButton />
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        {cards.map((card) => (
          <TouchableOpacity key={card.title} style={styles.card} onPress={() => navigation.navigate(card.route)} activeOpacity={0.8}>
            <LinearGradient colors={card.colors} style={styles.cardGradient}>
              <View style={styles.cardEmojiContainer}>
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.textLight, fontWeight: 'bold' },
  headerTitle: { ...typography.heading.h1, color: colors.textLight, flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { padding: 20, gap: 16 },
  card: { borderRadius: 20, overflow: 'hidden', elevation: 3, shadowColor: colors.shadowDark, shadowOpacity: 0.2, shadowRadius: 8 },
  cardGradient: { padding: 20 },
  cardEmojiContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardEmoji: { fontSize: 24 },
  cardTitle: { ...typography.heading.h3, color: colors.textLight, marginBottom: 6 },
  cardDescription: { ...typography.body.medium, color: colors.textLight, opacity: 0.85 },
});


