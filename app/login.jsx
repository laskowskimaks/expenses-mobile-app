import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const handleLogin = async () => {
    if (!username && !password) {
      alert('Podaj login i hasło!');
      return;
    } else if (!username) {
      alert('Wprowadź nazwę użytkownika!');
      return;
    } else if (!password) {
      alert('Wprowadź hasło!');
      return;
    }

    try {
      const success = await login(username, password);
      if (success) {
        router.dismissAll();
        router.replace('/(tabs)/home');
      } else {
        alert('Nieprawidłowe dane!');
      }
    } catch (error) {
      console.log('[Login] Login error:', error);
      alert('Wystąpił błąd podczas logowania. Spróbuj ponownie później.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Wprowadź dane logowania:</Text>
        <TextInput
          placeholder="Nazwa użytkownika"
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          placeholder="Hasło"
          secureTextEntry
          onChangeText={setPassword}
          style={styles.input}
        />
        <Button style={styles.button} title="Zaloguj" onPress={handleLogin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  formContainer: {
    width: '80%',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
});