// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* index.tsx decides where to go */}
        <Stack.Screen name="index" />
        {/* your sign-in screen */}
        <Stack.Screen name="cleaner-sign-in" />
        {/* your tabs group ( /app/(tabs) ) */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}
