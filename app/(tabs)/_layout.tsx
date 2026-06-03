import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

type TabIconName = keyof typeof Ionicons.glyphMap;

function renderTabIcon(name: TabIconName, activeName: TabIconName) {
  return function TabIcon({ color, focused, size }: { color: string; focused: boolean; size: number }) {
    return <Ionicons name={focused ? activeName : name} color={color} size={size} />;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: renderTabIcon('home-outline', 'home') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: renderTabIcon('map-outline', 'map') }} />
      <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: renderTabIcon('add-circle-outline', 'add-circle') }} />
      <Tabs.Screen name="buddies" options={{ title: 'Buddies', tabBarIcon: renderTabIcon('people-outline', 'people') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: renderTabIcon('person-outline', 'person') }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="saved" options={{ href: null }} />
    </Tabs>
  );
}
