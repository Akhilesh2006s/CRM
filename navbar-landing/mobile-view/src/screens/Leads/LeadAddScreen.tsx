import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../theme/colors';
import LogoutButton from '../../components/LogoutButton';
import { typography } from '../../theme/typography';

export default function LeadAddScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Lead</Text>
          <LogoutButton />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.subtitle}>Select the type of lead you want to add</Text>

        {/* New School Card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LeadAddNewSchool')}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>🏫</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>New School</Text>
                <Text style={styles.cardSubtitle}>Add a new school lead</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Renewal Cross Sale Card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LeadAddRenewal')}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>🔄</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Renewal Cross Sale</Text>
                <Text style={styles.cardSubtitle}>Add renewal or cross-sale lead for existing schools</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Followup Leads Card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LeadFollowup')}
        >
          <LinearGradient
            colors={['#f97316', '#ea580c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>📞</Text>
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Followup Leads</Text>
                <Text style={styles.cardSubtitle}>View your followup leads</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.heading.h1,
    color: colors.textLight,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 24,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    ...typography.heading.h3,
    color: colors.textLight,
    marginBottom: 6,
  },
  cardSubtitle: {
    ...typography.body.medium,
    color: colors.textLight,
    opacity: 0.9,
  },
  cardArrow: {
    fontSize: 24,
    color: colors.textLight,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});


