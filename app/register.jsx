import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { useNetworkStatus } from '../context/NetworkContext';
import { validateCredentials } from '@/utils/validation';


export default function RegisterScreen() {
  const { register } = useAuth();
  const { handleNewRegistration } = useDb();
  const { isConnected } = useNetworkStatus();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    if (!isConnected) {
      alert('Brak połączenia z internetem. Sprawdź ustawienia sieci i spróbuj ponownie.');
      return;
    }

    const validationResult = validateCredentials(email, password);
    if (!validationResult.isValid) {
      Alert.alert('Błąd walidacji', validationResult.message);
      return;
    }

    setIsRegistering(true);
    try {
      const firebaseResult  = await register(email, password);

      if (firebaseResult.success) {
        console.log("[RegisterScreen] Rejestracja w Firebase udana. Tworzenie nowej lokalnej bazy...");
            try {
            await handleNewRegistration(email, password);
            } catch (err) {
            setIsRegistering(false);
            alert('Błąd podczas inicjalizacji lokalnej bazy.');
            console.error('[RegisterScreen] Błąd podczas handleNewRegistration:', err);
            return;
            }

        console.log("[RegisterScreen] Rejestracja i inicjalizacja bazy zakończona. _layout.jsx przejmuje nawigację.");
      } else {
        if (firebaseResult.error.code === 'auth/email-already-in-use') {
          alert('Ten adres e-mail jest już używany!');
        } else {
          alert('Wystąpił błąd rejestracji.');
        }
        setIsRegistering(false);
      }
    } catch (error) {
      setIsRegistering(false);
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
        <Button style={styles.button} title='Zarejestruj i zaloguj' onPress={handleRegister} disabled={isRegistering || !isConnected} />
        {!isConnected && <Text style={styles.offlineText}>Rejestracja niemożliwa w trybie offline.</Text>}
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
  offlineText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 10
  }
});
