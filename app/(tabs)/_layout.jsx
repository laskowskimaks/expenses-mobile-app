import { Tabs, useRouter } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar'; // Upewnij się, że ścieżka jest poprawna

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name='home' />
      <Tabs.Screen name='transactionListScreen' />
      <Tabs.Screen
        name='add'
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/AddTransactionModal');
          },
        }}
      />
      <Tabs.Screen name='cards' />
      <Tabs.Screen name='settings' />
    </Tabs>
  );
}