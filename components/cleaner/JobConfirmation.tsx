import { CheckCircle, Clock, MapPin, Send } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const JobConfirmationScreen = ({
  jobSummary = {
    jobId: 'job1',
    clientName: 'Sarah Johnson',
    address: '123 Oak Street, Dallas, TX 75201',
    checkInTime: '10:05 AM',
    checkOutTime: '12:15 PM',
    duration: '2h 10m',
    tasksCompleted: 8,
    totalTasks: 8,
    notes: 'Completed all tasks. Kitchen required extra attention due to grease buildup. Client was very satisfied with the results.',
    beforePhoto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    afterPhoto: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
  },
  onSubmit = () => {},
  onEdit = () => {},
}) => {
  const isComplete = jobSummary.tasksCompleted === jobSummary.totalTasks;

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
            {jobSummary.tasksCompleted}/{jobSummary.totalTasks} Tasks
          </Text>
        </View>

        <View style={styles.row}>
          <MapPin size={16} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.bold}>{jobSummary.clientName}</Text>
            <Text>{jobSummary.address}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.statBox}>
            <Clock size={16} color="green" />
            <Text style={styles.statLabel}>Check In</Text>
            <Text style={styles.statValue}>{jobSummary.checkInTime}</Text>
          </View>
          <View style={styles.statBox}>
            <Clock size={16} color="red" />
            <Text style={styles.statLabel}>Check Out</Text>
            <Text style={styles.statValue}>{jobSummary.checkOutTime}</Text>
          </View>
          <View style={styles.statBox}>
            <CheckCircle size={16} color="blue" />
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{jobSummary.duration}</Text>
          </View>
        </View>
      </View>

      {/* Photos */}
      {(jobSummary.beforePhoto || jobSummary.afterPhoto) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <View style={styles.grid}>
            {jobSummary.beforePhoto && (
              <View>
                <Text>Before</Text>
                <Image style={styles.photo} source={{ uri: jobSummary.beforePhoto }} />
              </View>
            )}
            {jobSummary.afterPhoto && (
              <View>
                <Text>After</Text>
                <Image style={styles.photo} source={{ uri: jobSummary.afterPhoto }} />
              </View>
            )}
          </View>
        </View>
      )}

      {/* Notes */}
      {jobSummary.notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <View style={styles.noteBox}>
            <Text>{jobSummary.notes}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <TouchableOpacity
        onPress={onSubmit}
        style={styles.submitButton}
      >
        <Send size={18} color="#fff" />
        <Text style={styles.buttonText}>Submit Job Report</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onEdit}
        style={styles.editButton}
      >
        <Text>Edit Details</Text>
      </TouchableOpacity>

      {/* Success Message */}
      <View style={styles.successBox}>
        <CheckCircle size={24} color="#16a34a" />
        <Text style={{ marginTop: 8, color: '#166534' }}>Great work! Your job report is ready to submit.</Text>
      </View>
    </ScrollView>
  );
};

export default JobConfirmationScreen;

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
  photo: { width: 150, height: 150, borderRadius: 8, marginTop: 8 },
  noteBox: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', padding: 12, borderRadius: 8, marginBottom: 12 },
  editButton: { alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 20 },
  buttonText: { color: '#fff', marginLeft: 8 },
  successBox: { backgroundColor: '#dcfce7', padding: 16, borderRadius: 8, alignItems: 'center' },
});
