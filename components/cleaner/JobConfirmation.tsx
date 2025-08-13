import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Clock, MapPin, Send } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchJobWithTasks } from '@/lib/jobs';
import JobPhotoGallery from './JobPhotoGallery';

type JobRow = {
  id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  date: string | null;
  start_time: string | null;   // planned HH:MM:SS
  end_time: string | null;     // planned HH:MM:SS
  address: string | null;
  notes: string | null;
  client_name?: string | null;
  check_in_at?: string | null;   // actual timestamptz (ISO)
  check_out_at?: string | null;  // actual timestamptz (ISO)
};

type TaskRow = { id: string; description: string; is_completed: boolean };

function toDisplayTime(t?: string | null) {
  if (!t) return '—';
  const [hh, mm] = t.split(':');
  const d = new Date();
  d.setHours(Number(hh), Number(mm), 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function fmtTimestamptz(ts?: string | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function durationFromTimestamps(checkIn?: string | null, checkOut?: string | null) {
  if (!checkIn || !checkOut) return '—';
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  const diffMs = b - a;
  if (!isFinite(diffMs) || diffMs <= 0) return '—';
  const totalMin = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function durationFromPlanned(start?: string | null, end?: string | null) {
  if (!start || !end) return '—';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function JobConfirmation() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [job, setJob] = useState<JobRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErrorText(null);
        const { job, tasks } = await fetchJobWithTasks(jobId);
        if (cancelled) return;
        setJob(job as JobRow);
        setTasks((tasks as TaskRow[]) ?? []);
      } catch (e: any) {
        if (!cancelled) {
          console.error('[JobConfirmation] load error', e);
          setErrorText(e?.message ?? 'Failed to load job summary');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  const tasksCompleted = useMemo(() => tasks.filter(t => t.is_completed).length, [tasks]);
  const totalTasks = tasks.length;

  // Prefer actual timestamps; fall back to planned times for display only
  const clientName = job?.client_name ?? '—';
  const address = job?.address ?? '—';
  const checkInTime  = job?.check_in_at  ? fmtTimestamptz(job.check_in_at)   : toDisplayTime(job?.start_time);
  const checkOutTime = job?.check_out_at ? fmtTimestamptz(job.check_out_at) : toDisplayTime(job?.end_time);
  const actualDuration  = durationFromTimestamps(job?.check_in_at, job?.check_out_at);
  const plannedDuration = durationFromPlanned(job?.start_time, job?.end_time);
  const duration = actualDuration !== '—' ? actualDuration : plannedDuration;
  const notes = job?.notes ?? '';

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading job…</Text>
      </View>
    );
  }
  if (errorText || !job) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: 'tomato', marginBottom: 8 }}>{errorText ?? 'Job not found.'}</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/Home')} style={styles.submitButton}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isComplete = tasksCompleted === totalTasks;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.checkIconWrapper}>
          <CheckCircle size={32} color="#16a34a" />
        </View>
        <Text style={styles.headerTitle}>Job Completed!</Text>
        <Text style={styles.headerSubtitle}>Review your work summary below</Text>
      </View>

      {/* Job Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Job Summary</Text>
          <Text style={[styles.badge, isComplete && styles.badgeGreen]}>
            {tasksCompleted}/{totalTasks} Tasks
          </Text>
        </View>

        <View style={styles.row}>
          <MapPin size={16} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.bold}>{clientName}</Text>
            <Text>{address}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.statBox}>
            <Clock size={16} color="green" />
            <Text style={styles.statLabel}>Check In</Text>
            <Text style={styles.statValue}>{checkInTime}</Text>
          </View>
          <View style={styles.statBox}>
            <Clock size={16} color="red" />
            <Text style={styles.statLabel}>Check Out</Text>
            <Text style={styles.statValue}>{checkOutTime}</Text>
          </View>
          <View style={styles.statBox}>
            <CheckCircle size={16} color="blue" />
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{duration}</Text>
          </View>
        </View>
      </View>

      {/* Photos (gallery) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos</Text>
        <View style={{ marginTop: 12 }}>
          <JobPhotoGallery
            jobId={jobId}
            bucket="photos"
            useSignedUrls={false}
            columns={3}
          />
        </View>
      </View>

      {/* Notes */}
      {!!notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <View style={styles.noteBox}>
            <Text>{notes}</Text>
          </View>
        </View>
      )}

      {/* Submit Job Button */}
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)/Home')}
        style={styles.submitButton}
      >
        <Send size={18} color="#fff" />
        <Text style={styles.buttonText}>Submit Job Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9' },
  header: { alignItems: 'center', marginBottom: 16 },
  checkIconWrapper: { backgroundColor: '#dcfce7', padding: 16, borderRadius: 999 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { fontSize: 12, color: '#555' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  badge: { backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#16a34a', color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bold: { fontWeight: 'bold' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: '#888' },
  statValue: { fontSize: 12, fontWeight: 'bold' },
  noteBox: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', padding: 12, borderRadius: 8, marginBottom: 12 },
  buttonText: { color: '#fff', marginLeft: 8 },
});
