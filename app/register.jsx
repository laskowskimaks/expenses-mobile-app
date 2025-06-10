import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { handleNewRegistration } = useDb();

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

      if (result.success) {
        console.log("[RegisterScreen] Rejestracja w Firebase udana. Tworzenie nowej lokalnej bazy...");
        await handleNewRegistration(email, password);

        alert('Zarejestrowano pomyślnie!');

      } else {
        if (result.error.code === 'auth/email-already-in-use') {
          alert('Ten adres e-mail jest już używany!');
        } else {
          alert('Wystąpił błąd rejestracji.');
        }
      }
    } catch (error) {
      alert('Wystąpił błąd krytyczny podczas rejestracji.');
      console.error('[RegisterScreen] Błąd krytyczny podczas rejestracji:', error);
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
