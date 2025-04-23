import { useAuth } from '@/context/AuthContext';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function TabsLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      alert('Podaj login i hasło!');
      console.log('[TabsLayout] User not logged in. Redirecting to login.');
      router.replace('/login');
    }
    setIsLoading(false);
  }, [user]);

  if (isLoading) {
    console.log('[TabsLayout] Loading user data...');
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
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

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
});