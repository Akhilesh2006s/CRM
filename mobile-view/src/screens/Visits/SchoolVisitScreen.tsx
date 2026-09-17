import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { apiService } from '../../services/api';
import { getCurrentLocation } from '../../services/location';
import ScreenShell from '../../ui/ScreenShell';
import { WebInput, WebButton, WebSelect } from '../../ui/WebPrimitives';
import MessageBanner from '../../components/MessageBanner';

type Visit = {
  _id: string;
  schoolName?: string;
  schoolCode?: string;
  category?: string;
  outcome?: string;
  remarks?: string;
  visitDate?: string;
  nextVisitDate?: string;
  trainingDate?: string;
  latitude?: number;
  longitude?: number;
};

const emptyForm = {
  schoolName: '',
  category: '',
  remarks: '',
  nextVisitDate: '',
  trainingDate: '',
  outcome: '',
};

export default function SchoolVisitScreen({ navigation, route }: any) {
  const leadId: string | undefined = route?.params?.leadId;
  const schoolNameHint: string | undefined = route?.params?.schoolName;

  const [visits, setVisits] = useState<Visit[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ...emptyForm,
    schoolName: schoolNameHint || '',
  });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const loadVisits = useCallback(async () => {
    try {
      const data = await apiService.get('/visits/my');
      setVisits(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setVisits([]);
      setErrorMessage(err?.message || 'Failed to load visits');
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const data = await apiService.get('/visits/categories');
      setCategories(Array.isArray(data?.categories) ? data.categories : []);
      setOutcomes(Array.isArray(data?.outcomes) ? data.outcomes : []);
    } catch {
      setCategories([]);
      setOutcomes([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    clearMessages();
    await Promise.all([loadVisits(), loadMeta()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadVisits, loadMeta]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const captureGps = async () => {
    setCapturingGps(true);
    clearMessages();
    try {
      const loc = await getCurrentLocation();
      setCoords({ latitude: loc.latitude, longitude: loc.longitude });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Location permission denied or unavailable');
    } finally {
      setCapturingGps(false);
    }
  };

  const handleSubmit = async () => {
    clearMessages();
    if (!form.schoolName?.trim()) {
      setErrorMessage('School name is required');
      return;
    }
    if (!form.category?.trim()) {
      setErrorMessage('Visit category is required');
      return;
    }

    setSubmitting(true);
    try {
      let lat = coords?.latitude;
      let lng = coords?.longitude;
      if (lat == null || lng == null) {
        try {
          const loc = await getCurrentLocation();
          lat = loc.latitude;
          lng = loc.longitude;
          setCoords({ latitude: lat, longitude: lng });
        } catch {
          // GPS optional if denied — still allow create with school name
        }
      }

      const payload: Record<string, unknown> = {
        schoolName: form.schoolName.trim(),
        category: form.category,
        remarks: form.remarks?.trim() || '',
      };
      if (form.outcome) payload.outcome = form.outcome;
      if (form.nextVisitDate.trim()) payload.nextVisitDate = form.nextVisitDate.trim();
      if (form.trainingDate.trim()) payload.trainingDate = form.trainingDate.trim();
      if (leadId) payload.leadId = leadId;
      if (typeof lat === 'number' && typeof lng === 'number') {
        payload.latitude = lat;
        payload.longitude = lng;
      }

      await apiService.post('/visits', payload);
      setSuccessMessage('Visit recorded successfully.');
      setForm({ ...emptyForm });
      setCoords(null);
      setShowForm(false);
      await loadVisits();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create visit');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString('en-IN');
    } catch {
      return '—';
    }
  };

  return (
    <ScreenShell
      noScroll
      title="School Visits"
      subtitle={leadId ? 'Linked to lead' : 'Log field visits with GPS'}
      loading={loading && !refreshing}
      headerRight={
        <TouchableOpacity onPress={() => { clearMessages(); setShowForm((v) => !v); }}>
          <Text style={styles.headerLink}>{showForm ? 'List' : '+ New'}</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {successMessage ? (
          <MessageBanner type="success" message={successMessage} onDismiss={clearMessages} />
        ) : null}
        {errorMessage ? (
          <MessageBanner type="error" message={errorMessage} onDismiss={clearMessages} />
        ) : null}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>New visit</Text>

            <WebInput
              style={styles.input}
              value={form.schoolName}
              onChangeText={(t) => setForm((f) => ({ ...f, schoolName: t }))}
              placeholder="School name *"
            />

            <WebSelect
              label="Category *"
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              items={categories.map((c) => ({ label: c, value: c }))}
              placeholder="Select category"
            />

            <WebSelect
              label="Outcome"
              value={form.outcome}
              onValueChange={(v) => setForm((f) => ({ ...f, outcome: v }))}
              items={[
                { label: '— None —', value: '' },
                ...outcomes.map((o) => ({ label: o, value: o })),
              ]}
              placeholder="Select outcome"
            />

            <WebInput
              style={[styles.input, styles.textArea]}
              value={form.remarks}
              onChangeText={(t) => setForm((f) => ({ ...f, remarks: t }))}
              placeholder="Remarks"
              multiline
              numberOfLines={3}
            />

            <WebInput
              style={styles.input}
              value={form.nextVisitDate}
              onChangeText={(t) => setForm((f) => ({ ...f, nextVisitDate: t }))}
              placeholder="Next visit date (YYYY-MM-DD)"
            />

            <WebInput
              style={styles.input}
              value={form.trainingDate}
              onChangeText={(t) => setForm((f) => ({ ...f, trainingDate: t }))}
              placeholder="Training date (YYYY-MM-DD)"
            />

            <View style={styles.gpsRow}>
              <TouchableOpacity
                style={styles.gpsBtn}
                onPress={captureGps}
                disabled={capturingGps}
              >
                {capturingGps ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={styles.gpsBtnText}>
                    {coords ? 'Refresh GPS' : 'Capture GPS'}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={styles.gpsMeta}>
                {coords
                  ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                  : 'Location not captured yet'}
              </Text>
            </View>

            <WebButton
              title={submitting ? 'Saving…' : 'Save visit'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
            />
            <WebButton
              title="Cancel"
              onPress={() => setShowForm(false)}
              variant="outline"
            />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>My visits ({visits.length})</Text>
            {visits.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No visits yet. Tap + New to log one.</Text>
              </View>
            ) : (
              visits.map((v) => (
                <View key={v._id} style={styles.card}>
                  <Text style={styles.cardTitle}>{v.schoolName || '—'}</Text>
                  <Text style={styles.cardMeta}>
                    {v.category || '—'}
                    {v.outcome ? ` · ${v.outcome}` : ''}
                  </Text>
                  <Text style={styles.cardMeta}>Visited {formatDate(v.visitDate)}</Text>
                  {v.nextVisitDate ? (
                    <Text style={styles.cardMeta}>Next: {formatDate(v.nextVisitDate)}</Text>
                  ) : null}
                  {v.remarks ? <Text style={styles.remarks} numberOfLines={2}>{v.remarks}</Text> : null}
                  {typeof v.latitude === 'number' && typeof v.longitude === 'number' ? (
                    <Text style={styles.gpsTag}>GPS ✓</Text>
                  ) : null}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.heading.h3,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  formCard: {
    gap: 4,
  },
  input: {
    marginBottom: 10,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  gpsRow: {
    marginVertical: 12,
    gap: 8,
  },
  gpsBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.accent,
    minWidth: 120,
    alignItems: 'center',
  },
  gpsBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  gpsMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  remarks: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 6,
  },
  gpsTag: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
});
