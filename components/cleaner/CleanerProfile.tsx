import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, Dialog, Portal, TextInput } from 'react-native-paper';
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';

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

const CleanerDetails: React.FC<CleanerDetailsProps> = ({
  cleaner = {
    id: "1",
    name: "Sarah Johnson",
    phone: "+1 (555) 123-4567",
    email: "sarah.johnson@email.com",
    rating: 4.8,
    totalJobs: 127,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    availability: "Available",
    specialties: ["Deep Cleaning", "Kitchen Specialist", "Pet-Friendly"],
    joinDate: "2023-03-15",
  },
  jobHistory = [],
}) => {
  const [visible, setVisible] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    date: '',
    time: '',
    address: '',
    client: '',
  });

  // const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);

  const getBadgeColor = () => {
    switch (cleaner.availability) {
      case 'Available':
        return '#4CAF50';
      case 'Busy':
        return '#FFC107';
      case 'Off Duty':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const handleAssign = () => {
    console.log("Assigning job:", newJob);
    hideDialog();
    setNewJob({ title: '', date: '', time: '', address: '', client: '' });
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Icon
        name="star"
        key={i}
        size={16}
        color={i < Math.floor(rating) ? '#FFD700' : '#E0E0E0'}
      />
    ));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cleaner Details</Text>
        {/* <Button mode="contained" icon="plus" onPress={showDialog}>
          Assign Job
        </Button> */}
      </View>

      <Card style={styles.card}>
        <Card.Title
          title={cleaner.name}
          subtitle={`${cleaner.totalJobs} jobs completed`}
          left={() => (
            <Avatar.Image
              size={48}
              source={{ uri: cleaner.avatar }}
            />
          )}
        />
        <Card.Content>
          <Badge style={{ backgroundColor: getBadgeColor(), marginTop: 6 }}>
            {cleaner.availability}
          </Badge>
          <View style={styles.row}>
            {renderStars(cleaner.rating)}
            <Text style={styles.rating}>({cleaner.rating})</Text>
          </View>
          
          <Text>Phone: {cleaner.phone}</Text>
          <Text>Email: {cleaner.email}</Text>
         
          <Text style={styles.specialties}>Specialties: {cleaner.specialties.join(', ')}</Text>
          <Text>Joined: {new Date(cleaner.joinDate).toLocaleDateString()}</Text>
        </Card.Content>
      </Card>

      <Text style={styles.section}>Job History</Text>
      {jobHistory.map((job) => (
        <Card key={job.id} style={styles.jobCard}>
          <Card.Title title={job.title} subtitle={job.client} />
          <Card.Content>
            <Text>Date: {job.date}</Text>
            <Text>Time: {job.time}</Text>
            <Text>Address: {job.address}</Text>
            <Text>Status: {job.status}</Text>
            {job.rating && (
              <View style={styles.row}>
                <Text>Rating:</Text>
                {renderStars(job.rating)}
              </View>
            )}
          </Card.Content>
        </Card>
      ))}

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog}>
          <Dialog.Title>Assign Job</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title"
              value={newJob.title}
              onChangeText={(text) => setNewJob({ ...newJob, title: text })}
              mode="outlined"
            />
            <TextInput
              label="Date"
              value={newJob.date}
              onChangeText={(text) => setNewJob({ ...newJob, date: text })}
              mode="outlined"
            />
            <TextInput
              label="Time"
              value={newJob.time}
              onChangeText={(text) => setNewJob({ ...newJob, time: text })}
              mode="outlined"
            />
            <TextInput
              label="Address"
              value={newJob.address}
              onChangeText={(text) => setNewJob({ ...newJob, address: text })}
              mode="outlined"
            />
            <TextInput
              label="Client"
              value={newJob.client}
              onChangeText={(text) => setNewJob({ ...newJob, client: text })}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleAssign}>Assign</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginVertical: 10,
  },
  jobCard: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  specialties: {
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default CleanerDetails;
