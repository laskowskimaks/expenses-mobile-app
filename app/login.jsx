import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email && !password) {
      alert('Podaj login i hasło!');
      return;
    } else if (!email) {
      alert('Wprowadź adres e-mail!');
      return; 
    } else if (!password) { 
      alert('Wprowadź hasło!');
      return; 
    }

    const success = await login(email, password);
    if (success) {
      //alert('Zalogowano!');
      router.dismissAll();
      router.replace('/(tabs)/home');
    } else {
      alert('Nieprawidłowe dane!');
    }
  };

  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      margin: 20,
    }}>
      <View style={{ width: "80%", marginBottom: 20 }}>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>Wprowadź dane logowania:</Text>
        <TextInput
          placeholder="Email" onChangeText={setEmail}
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#fff',
            marginBottom: 10,
          }}
        />
        <TextInput
          placeholder="Hasło"
          secureTextEntry
          onChangeText={setPassword}
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#fff',
            marginBottom: 10,
          }}
        />
        <Button title="Zaloguj" onPress={handleLogin} />
      </View>
    </View>
  );
}
