import { Tabs, useRouter } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: 'Główna',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='transactionList'
        options={{
          title: 'Transakcje',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='add'
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/(modals)/AddTransactionModal');
          },
        }}
      />
      <Tabs.Screen
        name='cards'
        options={{
          title: 'Karty',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="credit-card-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: 'Ustawienia',

          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}