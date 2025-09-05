import { Stack } from 'expo-router';

export default function JobConfirmationLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'Job Complete' }}>
      <Stack.Screen name="[jobId]" options={{ title: 'Job Complete' }} />
    </Stack>
  );
}
