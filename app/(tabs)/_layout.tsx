// /app/(tabs)/_layout.tsx
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: 'transparent',
          },
        }),
      }}
    >
     <Tabs.Screen
     name="cleaner-details"
     options={{
    title: 'cleaner-details',
    tabBarIcon: ({ color }) => (
      <IconSymbol name="house" color={color} /> // ✅ instead of "home"
    ),
  }}
/>

<Tabs.Screen
  name="profile"
  options={{
    title: 'Profile',
    tabBarIcon: ({ color }) => (
      <IconSymbol name="person" color={color} /> // ✅ instead of "user"
    ),
  }}
/>
    </Tabs>
  );
}
