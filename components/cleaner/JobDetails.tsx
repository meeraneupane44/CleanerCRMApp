import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle, Clock, FileText, MapPin } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { toggleTask as toggleTaskDb } from '@/lib/jobProgress';
import { fetchJobWithTasks } from '@/lib/jobs';
import { uploadJobPhoto } from '@/lib/uploadImage';

type TaskRow = { id: string; description: string; is_completed: boolean };
type JobRow = {
  id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  address: string | null;
  notes: string | null;
  client_name?: string | null;
};

export default function JobDetailScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [job, setJob] = useState<JobRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [notes, setNotes] = useState('');
  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string | null>(null);
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState<'before' | 'after' | null>(null);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        setLoading(true);
        const { job, tasks } = await fetchJobWithTasks(jobId);
        setJob(job as JobRow);
        setTasks((tasks as TaskRow[]) ?? []);
        setNotes((job?.notes as string) ?? '');
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Failed to load job');
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const onToggleTask = async (taskId: string, current: boolean) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, is_completed: !current } : t)));
    try {
      await toggleTaskDb(taskId, current);
    } catch (e: any) {
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, is_completed: current } : t)));
      Alert.alert('Task update failed', e.message ?? 'Please try again.');
    }
  };

  const openCamera = async (type: 'before' | 'after') => {
    if (!jobId) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (result.canceled || !result.assets?.length) return;

    try {
      setPhotoUploading(type);
      const uri = result.assets[0].uri;
      const { renderUrl } = await uploadJobPhoto({
        jobId,
        uri,
        kind: type,
        wantSignedUrl: false, // flip to true if bucket is private
      });
      if (type === 'before') setBeforePhotoUrl(renderUrl);
      else setAfterPhotoUrl(renderUrl);
    } catch (e: any) {
      console.error('Photo upload failed', e);
      Alert.alert('Upload failed', e.message ?? 'Could not upload photo, please try again.');
    } finally {
      setPhotoUploading(null);
    }
  };

  const completedCount = useMemo(() => tasks.filter(t => t.is_completed).length, [tasks]);
  const totalCount = tasks.length;
  const canComplete =
    completedCount === totalCount && !!beforePhotoUrl && !!afterPhotoUrl && !photoUploading;

  const fmtDate = (d?: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString() : '—');
  const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : '—');

  if (!jobId) return <View style={{ padding: 16 }}><Text>Missing jobId in route.</Text></View>;
  if (loading) return <View style={{ padding: 16 }}><Text>Loading job…</Text></View>;
  if (!job) return <View style={{ padding: 16 }}><Text>Job not found.</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/Home')}>
          <ArrowLeft size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Job Details</Text>
          <Text style={styles.subtitle}>{job.address ?? '—'}</Text>
        </View>
        <Text>{completedCount}/{totalCount}</Text>
      </View>

      {/* Job Info */}
      <View style={styles.card}>
        <View style={styles.row}>
          <MapPin size={16} />
          <Text style={styles.cardText}>{job.address ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Clock size={16} />
          <Text style={styles.cardText}>
            {fmtDate(job.date)} • {fmtTime(job.start_time)}–{fmtTime(job.end_time)}
          </Text>
        </View>
        {!!job.notes && (
          <View style={styles.instructionBox}>
            <FileText size={16} />
            <Text style={styles.instructionText}>{job.notes}</Text>
          </View>
        )}
      </View>

      {/* Tasks */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cleaning Tasks</Text>
        {tasks.length === 0 ? (
          <Text>No tasks for this job.</Text>
        ) : (
          tasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => onToggleTask(task.id, task.is_completed)}
            >
              <View style={[styles.checkbox, task.is_completed && styles.checkedBox]} />
              <Text style={[styles.taskText, task.is_completed && styles.completedText]}>
                {task.description}
              </Text>
              {task.is_completed && <CheckCircle size={16} color="green" />}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Photos */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity
            style={[styles.photoBtn, !!beforePhotoUrl && styles.photoUploaded]}
            onPress={() => openCamera('before')}
            disabled={photoUploading === 'before'}
          >
            <Camera size={16} />
            <Text>{photoUploading === 'before' ? 'Uploading…' : beforePhotoUrl ? 'Before ✓' : 'Before Photo'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoBtn, !!afterPhotoUrl && styles.photoUploaded]}
            onPress={() => openCamera('after')}
            disabled={photoUploading === 'after'}
          >
            <Camera size={16} />
            <Text>{photoUploading === 'after' ? 'Uploading…' : afterPhotoUrl ? 'After ✓' : 'After Photo'}</Text>
          </TouchableOpacity>
        </View>

        {beforePhotoUrl && <Image source={{ uri: beforePhotoUrl }} style={styles.photoPreview} />}
        {afterPhotoUrl && <Image source={{ uri: afterPhotoUrl }} style={styles.photoPreview} />}
      </View>

      {/* Notes */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          placeholder="Add any notes about this job..."
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          style={styles.textArea}
        />
      </View>

      {/* Complete -> type-safe navigation to dynamic route */}
      <TouchableOpacity
        style={[styles.completeBtn, !canComplete && styles.disabledBtn]}
        disabled={!canComplete}
        onPress={() =>
          router.push({
            pathname: '/job-confirmation/[jobId]',
            params: { jobId }, // ✅ TS-safe
          })
        }
      >
        <CheckCircle size={18} color="#fff" />
        <Text style={styles.completeText}>{photoUploading ? 'Uploading photos…' : 'Complete Job'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardText: { marginLeft: 8 },
  instructionBox: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  instructionText: { marginLeft: 8, color: '#1e3a8a' },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#999', marginRight: 8 },
  checkedBox: { backgroundColor: 'green' },
  taskText: { flex: 1 },
  completedText: { textDecorationLine: 'line-through', color: '#999' },
  photoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  photoBtn: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', width: '48%' },
  photoUploaded: { backgroundColor: '#d1fae5', borderColor: 'green' },
  photoPreview: { width: '100%', height: 150, borderRadius: 8, marginTop: 10 },
  textArea: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, textAlignVertical: 'top' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'green', padding: 14, borderRadius: 6 },
  completeText: { color: '#fff', marginLeft: 8 },
  disabledBtn: { backgroundColor: '#ccc' },
});
