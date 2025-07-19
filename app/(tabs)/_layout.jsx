import { Tabs } from 'expo-router';

export default function TabsLayout() {

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