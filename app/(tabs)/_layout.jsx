import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar'; // Upewnij się, że ścieżka jest poprawna

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name='home' />
      <Tabs.Screen name='details' />
      <Tabs.Screen name='add' />
      <Tabs.Screen name='cards' />
      <Tabs.Screen name='settings' />
    </Tabs>
  );
}