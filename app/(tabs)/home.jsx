import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';
import { useDb } from '@/context/DbContext';
import { getAllSettingsAsObject } from '@/services/authService';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { db } = useDb();
  const [currentUserData, setCurrentUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (db) {
        console.log("[HomeScreen] Instancja bazy dostępna, pobieram dane...");
        const settingsObject = await getAllSettingsAsObject(db);
        setCurrentUserData(settingsObject);
      } else {
        setCurrentUserData(null);
      }
    };
    fetchUserData();
  }, [db]);


  if (!user) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    )
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        margin: 20,
      }}>
        <Text>Home</Text>
      </View>
      <View>
        <Text>Witaj, {user.email}!</Text>
        <Button title="Wyloguj" onPress={logout} />
      </View>
      <View style={{ marginTop: 30 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Lista użytkowników:</Text>
      </View>
    </ScrollView>
  );
}