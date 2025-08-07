import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Clock,
  FileText,
  MapPin
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const tasksSample = [
  { id: '1', name: 'Vacuum all carpets and rugs', completed: false },
  { id: '2', name: 'Mop kitchen and bathroom floors', completed: false },
  { id: '3', name: 'Clean and disinfect bathrooms', completed: false },
  { id: '4', name: 'Wipe down kitchen counters and appliances', completed: false },
  { id: '5', name: 'Dust furniture and surfaces', completed: false },
  { id: '6', name: 'Empty trash bins', completed: false },
  { id: '7', name: 'Clean mirrors and windows', completed: false },
  { id: '8', name: 'Make beds and tidy bedrooms', completed: false },
];

const JobDetailScreen = ({
  jobId = 'job1',
  clientName = 'Sarah Johnson',
  address = '123 Oak Street, Dallas, TX 75201',
  time = '10:00 AM - 12:00 PM',
  instructions = 'Please use eco-friendly products. Key under mat. Focus on kitchen and bathrooms. Pet-friendly home with one cat.',
}) => {
  const [tasks, setTasks] = useState(tasksSample);
  const [notes, setNotes] = useState('');
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const openCamera = async (type: 'before' | 'after') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      if (type === 'before') setBeforePhoto(uri);
      else setAfterPhoto(uri);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/Home')}>
          <ArrowLeft size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Job Details</Text>
          <Text style={styles.subtitle}>{clientName}</Text>
        </View>
        <Text>{completedCount}/{totalCount}</Text>
      </View>

      {/* Job Info */}
      <View style={styles.card}>
        <View style={styles.row}><MapPin size={16} /><Text style={styles.cardText}>{address}</Text></View>
        <View style={styles.row}><Clock size={16} /><Text style={styles.cardText}>{time}</Text></View>
        <View style={styles.instructionBox}>
          <FileText size={16} /><Text style={styles.instructionText}>{instructions}</Text>
        </View>
      </View>

      {/* Tasks */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cleaning Tasks</Text>
        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskItem}
            onPress={() => toggleTask(task.id)}
          >
            <View style={[styles.checkbox, task.completed && styles.checkedBox]} />
            <Text style={[styles.taskText, task.completed && styles.completedText]}>{task.name}</Text>
            {task.completed && <CheckCircle size={16} color="green" />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Photo Upload */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity
            style={[styles.photoBtn, beforePhoto && styles.photoUploaded]}
            onPress={() => openCamera('before')}
          >
            <Camera size={16} />
            <Text>{beforePhoto ? 'Before ✓' : 'Before Photo'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoBtn, afterPhoto && styles.photoUploaded]}
            onPress={() => openCamera('after')}
          >
            <Camera size={16} />
            <Text>{afterPhoto ? 'After ✓' : 'After Photo'}</Text>
          </TouchableOpacity>
        </View>

        {beforePhoto && (
          <Image source={{ uri: beforePhoto }} style={styles.photoPreview} />
        )}
        {afterPhoto && (
          <Image source={{ uri: afterPhoto }} style={styles.photoPreview} />
        )}
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

      {/* Complete Button */}
      <TouchableOpacity
        style={[styles.completeBtn, completedCount < totalCount && styles.disabledBtn]}
        disabled={completedCount < totalCount}
        onPress={() => router.push('/job-confirmation')}
      >
        <CheckCircle size={18} color="#fff" />
        <Text style={styles.completeText}>Complete Job</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default JobDetailScreen;

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
