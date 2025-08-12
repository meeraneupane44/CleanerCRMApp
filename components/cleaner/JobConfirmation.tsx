import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Clock, MapPin, Send } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { fetchJobWithTasks } from '@/lib/jobs';
import { supabase } from '@/lib/supabase';

const BUCKET = 'photos';          // your Storage bucket id
const USE_SIGNED_URLS = false;    // set true if bucket is private

type JobRow = {
  id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  date: string | null;
  start_time: string | null;  // 'HH:MM:SS'
  end_time: string | null;    // 'HH:MM:SS'
  address: string | null;
  notes: string | null;
  client_name?: string | null; // adjust if your schema uses a different field
};

type TaskRow = {
  id: string;
  description: string;
  is_completed: boolean;
};

function toDisplayTime(t?: string | null) {
  if (!t) return '—';
  const [hh, mm] = t.split(':');
  const d = new Date();
  d.setHours(Number(hh), Number(mm), 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function diffDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return '—';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const mins = Math.max(0, endMin - startMin);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

async function storageUrlFromPath(path: string, signed: boolean) {
  if (signed) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) throw error || new Error('Failed to create signed URL');
    return data.signedUrl;
  } else {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}

async function fetchBeforeAfterUrls(jobId: string, useSigned = false) {
  const [beforeRes, afterRes] = await Promise.all([
    supabase
      .from('photos')
      .select('image_url, created_at')
      .eq('job_id', jobId)
      .eq('type', 'before')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('photos')
      .select('image_url, created_at')
      .eq('job_id', jobId)
      .eq('type', 'after')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);
  if (beforeRes.error) throw beforeRes.error;
  if (afterRes.error) throw afterRes.error;

  const beforePath = beforeRes.data?.[0]?.image_url ?? null;
  const afterPath  = afterRes.data?.[0]?.image_url ?? null;

  const [beforeUrl, afterUrl] = await Promise.all([
    beforePath ? storageUrlFromPath(beforePath, useSigned) : Promise.resolve(null),
    afterPath  ? storageUrlFromPath(afterPath,  useSigned) : Promise.resolve(null),
  ]);

  return { beforeUrl, afterUrl };
}

export default function JobConfirmation() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [job, setJob] = useState<JobRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

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

        setLoadingPhotos(true);
        const { beforeUrl, afterUrl } = await fetchBeforeAfterUrls(jobId, USE_SIGNED_URLS);
        if (!cancelled) {
          setBeforeUrl(beforeUrl);
          setAfterUrl(afterUrl);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('[JobConfirmation] load error', e);
          setErrorText(e?.message ?? 'Failed to load job summary');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingPhotos(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  const tasksCompleted = useMemo(() => tasks.filter(t => t.is_completed).length, [tasks]);
  const totalTasks = tasks.length;

  const clientName = job?.client_name ?? '—';
  const address = job?.address ?? '—';
  const checkInTime  = toDisplayTime(job?.start_time);
  const checkOutTime = toDisplayTime(job?.end_time);
  const duration = diffDuration(job?.start_time, job?.end_time);
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

      {/* Photos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos</Text>

        {loadingPhotos && (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 6, color: '#666' }}>Loading photos…</Text>
          </View>
        )}

        {!loadingPhotos && (
          <View style={styles.grid}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text>Before</Text>
              {beforeUrl ? (
                <Image style={styles.photo} source={{ uri: beforeUrl }} />
              ) : (
                <Text style={{ color: '#888', marginTop: 8 }}>No before photo</Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text>After</Text>
              {afterUrl ? (
                <Image style={styles.photo} source={{ uri: afterUrl }} />
              ) : (
                <Text style={{ color: '#888', marginTop: 8 }}>No after photo</Text>
              )}
            </View>
          </View>
        )}
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
  photo: { width: '100%', height: 150, borderRadius: 8, marginTop: 8, backgroundColor: '#eee' },
  noteBox: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', padding: 12, borderRadius: 8, marginBottom: 12 },
  buttonText: { color: '#fff', marginLeft: 8 },
});
