import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "react-native-paper";

import { fetchMyUpcomingJobs } from "@/lib/jobs";

type Job = {
  id: string;
  address: string | null;
  date: string | null;        // DATE in DB (YYYY-MM-DD)
  start_time: string | null;  // TIME in DB (HH:MM:SS)
  end_time: string | null;    // optional
  notes: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  // client_id: string | null; // (we can join to users later if you want the name)
};

export default function CleanerHome() {
  const cleanerName = "John Doe";

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = (await fetchMyUpcomingJobs()) as Job[];
        setJobs(data ?? []);
      } catch (e: any) {
        setError(e.message ?? "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (d?: string | null) =>
    d ? new Date(d + "T00:00:00").toLocaleDateString() : "—";
  const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : "—");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Text size={48} label={cleanerName.split(" ").map(n => n[0]).join("")} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.greeting}>Hello, {cleanerName.split(" ")[0]}!</Text>
          <Text style={styles.sub}>Ready for today’s jobs?</Text>
        </View>
      </View>

      {/* Loading / Error */}
      {loading && (
        <View style={[styles.card, { alignItems: "center" }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Loading your jobs…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.card}>
          <Text style={{ color: "crimson", fontWeight: "600" }}>
            {error}
          </Text>
        </View>
      )}

      {/* Jobs list */}
      {!loading && !error && jobs.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next Jobs</Text>
          <Text>No upcoming jobs found.</Text>
        </View>
      )}

      {!loading && !error && jobs.map((job) => (
        <View key={job.id} style={styles.card}>
          <Text style={styles.cardTitle}>Job</Text>

          {/* If you want client name, we can join with users later */}
          <Text style={styles.address}>{job.address ?? "—"}</Text>
          <Text style={styles.date}>{formatDate(job.date)}</Text>
          <Text style={styles.time}>
            {formatTime(job.start_time)}{job.end_time ? ` — ${formatTime(job.end_time)}` : ""}
          </Text>
          {!!job.notes && (
            <Text style={styles.notes}>Notes: {job.notes}</Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.checkInButton}
              onPress={() =>
                router.push({ pathname: "/job-details/[jobId]", params: { jobId: job.id } })
              }
            >
              <MaterialIcons name="login" size={18} color="white" />
              <Text style={styles.buttonText}>Open</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={() =>
                router.push({ pathname: "/job-details/[jobId]", params: { jobId: job.id } })
              }
            >
              <MaterialIcons name="check-circle" size={18} color="#22c55e" />
              <Text style={[styles.buttonText, { color: "#22c55e" }]}>
                Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
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
