import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleRegister = async () => {
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
      const success = await register(username, password);
      if (success) {
        alert('Zarejestrowano!');
        router.replace('/login');
      }
    } catch (error) {
      alert('Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
      console.log('[Registration] Registration error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.text}>Rejestracja</Text>
        <TextInput
          placeholder='Nazwa użytkownika'
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          placeholder='Hasło'
          secureTextEntry
          onChangeText={setPassword}
          style={styles.input}
        />
        <Button style={styles.button} title='Zarejestruj' onPress={handleRegister} />
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
  text: {
    fontSize: 16,
    marginBottom: 10
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
