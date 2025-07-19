import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';
import { getAllUsers } from '@/services/authService';
import { useDb } from '@/context/DbContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const { db } = useDb();

  useEffect(() => {
    const fetchUsers = async () => {
      if (db) {
        console.log("[HomeScreen] Instancja bazy dostępna, pobieram dane...");
        const allUsers = await getAllUsers(db);
        setUsers(allUsers);
      } else {
        setUsers([]);
      }
    };
    fetchUsers();
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
        {users.map(u => (
          <View key={u.id}>
            <Text>{u.email}</Text>
            <Text>{u.pin ? `PIN: ${u.pin}` : 'Brak PIN'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}