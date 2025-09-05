// app/components/cleaner/CleanerHome.tsx
import { checkInJob, fetchMyUpcomingJobs } from '@/lib/jobs';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from 'react-native-paper';

type Job = {
  id: string;
  address: string | null;
  date: string | null;        // YYYY-MM-DD
  start_time: string | null;  // HH:MM:SS
  end_time: string | null;    // HH:MM:SS
  notes: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
};

export default function CleanerHome() {
  const [cleanerName, setCleanerName] = useState('Cleaner');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Load profile name once
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();
      const pretty =
        data?.name ||
        data?.email?.split('@')[0] ||
        user.email?.split('@')[0] ||
        'Cleaner';
      setCleanerName(pretty);
    })();
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      setError(null);
      const data = (await fetchMyUpcomingJobs()) as Job[];
      setJobs(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load jobs');
      setJobs([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadJobs();
      setLoading(false);
    })();
  }, [loadJobs]);

  // Refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        if (!mounted) return;
        await loadJobs();
      })();
      return () => {
        mounted = false;
      };
    }, [loadJobs]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  }, [loadJobs]);

  const formatDate = (d?: string | null) =>
    d ? new Date(`${d}T00:00:00`).toLocaleDateString() : '—';
  const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : '—');

  const onCheckIn = async (job: Job) => {
    try {
      setCheckingInId(job.id);
      await checkInJob(job.id); // writes check_in_at + sets status in_progress
      // Optimistic local update
      setJobs(prev =>
        prev.map(j => (j.id === job.id ? { ...j, status: 'in_progress' } : j)),
      );
      router.push({
        pathname: '/job-details/[jobId]',
        params: { jobId: job.id },
      });
    } catch (e: any) {
      Alert.alert('Check-in failed', e?.message ?? 'Please try again.');
    } finally {
      setCheckingInId(null);
    }
  };

  const StatusBadge = ({ status }: { status: Job['status'] }) => {
    const map = {
      scheduled: { bg: '#dbeafe', fg: '#1d4ed8', label: 'Scheduled' },
      in_progress: { bg: '#fef9c3', fg: '#a16207', label: 'In Progress' },
      completed: { bg: '#dcfce7', fg: '#166534', label: 'Completed' },
      cancelled: { bg: '#fee2e2', fg: '#991b1b', label: 'Cancelled' },
    } as const;
    const s = map[status];
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Text
          size={48}
          label={cleanerName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.greeting}>Hello, {cleanerName.split(' ')[0]}!</Text>
          <Text style={styles.sub}>Ready for today’s jobs?</Text>
        </View>
      </View>

      {/* Loading / Error / Empty */}
      {loading && (
        <View style={[styles.card, { alignItems: 'center' }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Loading your jobs…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.card}>
          <Text style={{ color: 'crimson', fontWeight: '600' }}>{error}</Text>
        </View>
      )}

      {!loading && !error && jobs.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next Jobs</Text>
          <Text>No upcoming jobs found.</Text>
        </View>
      )}

      {/* Jobs */}
      {!loading &&
        !error &&
        jobs.map(job => {
          const isChecking = checkingInId === job.id;
          return (
            <View key={job.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Job</Text>
                <StatusBadge status={job.status} />
              </View>

              <Text style={styles.address}>{job.address ?? '—'}</Text>
              <Text style={styles.date}>{formatDate(job.date)}</Text>
              <Text style={styles.time}>
                {formatTime(job.start_time)}
                {job.end_time ? ` — ${formatTime(job.end_time)}` : ''}
              </Text>
              {!!job.notes && <Text style={styles.notes}>Notes: {job.notes}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.checkInButton, isChecking && { opacity: 0.7 }]}
                  onPress={() => onCheckIn(job)}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="login" size={18} color="white" />
                      <Text style={styles.buttonText}>
                        {job.status === 'in_progress' ? 'Resume' : 'Check In'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() =>
                    router.push({
                      pathname: '/job-details/[jobId]',
                      params: { jobId: job.id },
                    })
                  }
                >
                  <MaterialIcons name="check-circle" size={18} color="#22c55e" />
                  <Text style={[styles.buttonText, { color: '#22c55e' }]}>
                    Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sub: {
    color: '#6b7280',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  address: {
    color: '#4b5563',
  },
  date: {
    color: '#4b5563',
  },
  time: {
    color: '#6b7280',
    marginVertical: 4,
  },
  notes: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  checkInButton: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  completeButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#22c55e',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
  },
});
