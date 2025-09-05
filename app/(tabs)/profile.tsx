// /app/(tabs)/profile.tsx
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import CleanerProfile from '@/components/cleaner/CleanerProfile';

export default function ProfileScreen() {
  const onSignOut = async () => {
    try {
      // local: clears the session on this device; omit arg to revoke everywhere
      await supabase.auth.signOut({ scope: 'local' as any });
    } catch {
      // ignore; we'll still route to sign-in
    } finally {
      router.replace('/cleaner-sign-in');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={onSignOut} style={styles.logoutBtn} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={18} color="#fff" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Your existing profile UI */}
      <CleanerProfile />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontWeight: '600' },
});
