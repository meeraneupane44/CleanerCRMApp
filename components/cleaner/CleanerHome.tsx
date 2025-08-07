// /app/(tabs)/index.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "react-native-paper";

export default function CleanerHome() {
  const cleanerName = "John Doe";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={48} label={cleanerName.split(" ").map(n => n[0]).join("")} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.greeting}>Hello, {cleanerName.split(" ")[0]}!</Text>
          <Text style={styles.sub}>Ready for today’s jobs?</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next Job</Text>
        <Text style={styles.client}>Sarah Johnson</Text>
        <Text style={styles.address}>123 Oak Street, Dallas, TX</Text>
        <Text style={styles.date}>01/02/2025</Text>
        <Text style={styles.time}>10:00 AM</Text>
        <Text style={styles.notes}>Notes: Use eco-friendly products. Key under mat.</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => router.push('/job-details')}
          >
            <MaterialIcons name="login" size={18} color="white" />
            <Text style={styles.buttonText}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeButton}>
            <MaterialIcons name="check-circle" size={18} color="#22c55e" />
            <Text style={[styles.buttonText, { color: "#22c55e" }]}>Complete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sub: {
    color: "#6b7280",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  client: {
    fontSize: 14,
    fontWeight: "600",
  },
  address: {
    color: "#4b5563",
  },
  date: {
    color: "#4b5563",
  },
  time: {
    color: "#6b7280",
    marginVertical: 4,
  },
  notes: {
    backgroundColor: "#fef3c7",
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  checkInButton: {
    flexDirection: "row",
    backgroundColor: "#22c55e",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  completeButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#22c55e",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    marginLeft: 6,
    fontWeight: "bold",
    color: "white",
  },
});
