// app/(tabs)/index.tsx (or home.tsx)
import CleanerHome from "@/components/cleaner/CleanerHome";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <CleanerHome />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9fafb", // Match this to your CleanerHome background color
  },
});
