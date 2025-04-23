import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Wprowadź dane logowania:</Text>
        <TextInput
          placeholder="Email"
          onChangeText={setEmail}
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