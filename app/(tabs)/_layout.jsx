import { useAuth } from '@/context/AuthContext';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function TabsLayout() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      console.log('[TabsLayout] User not logged in. Redirecting to login.');
      router.replace('/login');
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="details" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="cards" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
