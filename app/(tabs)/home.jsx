import { useAuth } from '@/context/AuthContext';
import { View, Text, Button } from 'react-native';

export default function HomeScreen() {

  const { user, logout } = useAuth();

  return (
    <View>
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        margin: 20,
      }}>
        <Text>Home</Text>
      </View>
      <View>
        <Text>Witaj asdas, {user.email}!</Text>
        <Button title="Wyloguj" onPress={logout} />
      </View>
    </View>
  );
}
