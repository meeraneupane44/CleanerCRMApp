import {
    Calendar as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Clock as ClockIcon,
    MapPin as MapPinIcon,
    Phone as PhoneIcon,
    Plus as PlusIcon,
    Star as StarIcon
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface JobHistory {
  id: string;
  title: string;
  date: string;
  time: string;
  address: string;
  client: string;
  status: 'Completed' | 'Cancelled';
  rating?: number;
}

interface CleanerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  totalJobs: number;
  avatar?: string;
  availability: 'Available' | 'Busy' | 'Off Duty';
  specialties: string[];
  joinDate: string;
}

interface CleanerDetailsProps {
  cleaner?: CleanerProfile;
  jobHistory?: JobHistory[];
}

const CleanerDetails = ({
  cleaner = {
    id: '1',
    name: 'Sarah Johnson',
    phone: '+1 (555) 123-4567',
    email: 'sarah.johnson@email.com',
    rating: 4.8,
    totalJobs: 127,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    availability: 'Available',
    specialties: ['Deep Cleaning', 'Kitchen Specialist', 'Pet-Friendly'],
    joinDate: '2023-03-15',
  },
  jobHistory = [],
}: CleanerDetailsProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    date: '',
    time: '',
    address: '',
    client: '',
  });

  const getAvailabilityColor = () => {
    switch (cleaner.availability) {
      case 'Available': return '#d1fae5';
      case 'Busy': return '#fef9c3';
      case 'Off Duty': return '#fecaca';
      default: return '#e5e7eb';
    }
  };

  const handleAssignJob = () => {
    console.log('Assigned:', newJob);
    setNewJob({ title: '', date: '', time: '', address: '', client: '' });
    setModalVisible(false);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <StarIcon
        key={i}
        size={16}
        color={i < Math.floor(rating) ? '#facc15' : '#d1d5db'}
      />
    ));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cleaner Details</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.assignBtn}
        >
          <PlusIcon size={18} />
          <Text style={styles.assignText}>Assign Job</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Assign Job</Text>
          {['title', 'date', 'time', 'address', 'client'].map((field) => (
            <TextInput
              key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={(newJob as any)[field]}
              onChangeText={(text) => setNewJob({ ...newJob, [field]: text })}
              style={styles.input}
            />
          ))}
          <TouchableOpacity onPress={handleAssignJob} style={styles.modalBtn}>
            <Text style={styles.modalBtnText}>Confirm Assignment</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={{ textAlign: 'center', color: 'red' }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* Profile */}
      <View style={styles.card}>
        <Image source={{ uri: cleaner.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{cleaner.name}</Text>
        <View style={styles.ratingRow}>
          {renderStars(cleaner.rating)}
          <Text style={styles.ratingText}>{cleaner.rating} | {cleaner.totalJobs} jobs</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getAvailabilityColor() }]}>
          <Text style={styles.badgeText}>{cleaner.availability}</Text>
        </View>
        <Text style={styles.phone}><PhoneIcon size={14} /> {cleaner.phone}</Text>
        <Text style={styles.joinDate}>Joined: {new Date(cleaner.joinDate).toDateString()}</Text>
        <Text style={styles.sectionTitle}>Specialties:</Text>
        <View style={styles.specialtyList}>
          {cleaner.specialties.map((s, i) => (
            <View key={i} style={styles.specialtyItem}>
              <Text style={styles.specialtyText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Job History */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Job History</Text>
        {jobHistory.length === 0 ? (
          <Text style={styles.emptyText}>No job history available.</Text>
        ) : (
          jobHistory.map((job) => (
            <View key={job.id} style={styles.jobItem}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={styles.statusRow}>
                  {job.status === 'Completed' && (
                    <CheckCircleIcon size={14} color="green" />
                  )}
                  <Text>{job.status}</Text>
                </View>
              </View>
              <Text style={styles.jobText}><CalendarIcon size={14} /> {job.date}</Text>
              <Text style={styles.jobText}><ClockIcon size={14} /> {job.time}</Text>
              <Text style={styles.jobText}><MapPinIcon size={14} /> {job.address}</Text>
              {job.rating && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {renderStars(job.rating)}
                  <Text style={{ marginLeft: 4 }}>{job.rating}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default CleanerDetails;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
  assignBtn: { flexDirection: 'row', backgroundColor: '#e0f2fe', padding: 8, borderRadius: 8, alignItems: 'center' },
  assignText: { marginLeft: 6 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginVertical: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 10 },
  name: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  ratingText: { marginLeft: 6, color: '#666' },
  badge: { padding: 6, borderRadius: 6, alignSelf: 'center', marginVertical: 4 },
  badgeText: { fontSize: 12 },
  phone: { textAlign: 'center', color: '#333', marginVertical: 4 },
  joinDate: { textAlign: 'center', fontSize: 12, color: '#666' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  specialtyList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  specialtyItem: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
  specialtyText: { fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 12 },
  jobItem: { borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 12, marginTop: 12 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  jobTitle: { fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobText: { fontSize: 13, color: '#444', marginTop: 2 },
  modalContainer: { padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 6 },
  modalBtn: { backgroundColor: '#22c55e', padding: 12, borderRadius: 8, marginTop: 10 },
  modalBtnText: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },
});
