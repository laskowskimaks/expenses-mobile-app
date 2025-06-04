import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { performUpload } from '../services/backupService';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const handleRegister = async () => {
    if (!email && !password) {
      alert('Podaj e-mail i hasło!');
      return;
    } else if (!email) {
      alert('Wprowadź adres e-mail!');
      return;
    } else if (!validateEmail(email)) {
      alert('Niepoprawny adres e-mail!');
      return;
    } else if (!password) {
      alert('Wprowadź hasło!');
      return;
    } else if (password.length < 6) {
      alert('Hasło musi mieć co najmniej 6 znaków!');
      return;
    }

    try {
      const result = await register(email, password);

      if (result === true) {
        alert('Zarejestrowano pomyślnie!');
        performUpload();
        router.replace('/(tabs)/home');
      } else if (result.code === 'auth/email-already-in-use') {
        alert('Ten adres e-mail jest już używany!');
      } else if (result.code === 'auth/invalid-email') {
        alert('Niepoprawny adres e-mail!');
      } else if (result.code === 'auth/weak-password') {
        alert('Hasło jest zbyt słabe!');
      } else {
        alert('Wystąpił błąd. Spróbuj ponownie.');
      }
    } catch (error) {
      alert('Wystąpił błąd podczas rejestracji.');
      console.log('[Registration] Firebase error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.text}>Rejestracja i logowanie</Text>
        <TextInput
          placeholder='Adres e-mail'
          autoCapitalize='none'
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder='Hasło'
          secureTextEntry
          onChangeText={setPassword}
          style={styles.input}
        />
        <Button style={styles.button} title='Zarejestruj i zaloguj' onPress={handleRegister} />
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
