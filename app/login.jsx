import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native'; // Dodano ActivityIndicator
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { checkAndRestoreBackup, uploadBackupIfOlderThan } from '../services/backupService';

const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
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

    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        console.log("[LoginScreen] Pomyślnie zalogowano. Rozpoczynam operacje na bazie danych...");

        //sprawdź i przywróć backup (krytyczne, więc await)
        try {
          console.log("[LoginScreen] Sprawdzanie i przywracanie backupu...");
          const restored = await checkAndRestoreBackup();
          if (restored) {
            console.log("[LoginScreen] Baza danych została przywrócona z chmury.");
            // w przyszłości tutaj ustawić jakiś stan globalny lub przekazać informację,
            // że baza została zmieniona, aby inne części aplikacji mogły na to zareagować - odświeżyć dane
          } else {
            console.log("[LoginScreen] Lokalna baza danych jest aktualna lub nie było backupu do przywrócenia.");
          }
        } catch (restoreError) {
          console.error("[LoginScreen] Błąd podczas sprawdzania/przywracania backupu:", restoreError);
        }

        console.log("[LoginScreen] Nawigacja do /tabs/home");
        router.dismissAll();
        router.replace('/(tabs)/home');

        // czy trzeba wysłać nowy backup
        const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
        uploadBackupIfOlderThan(SEVEN_DAYS_IN_MS)
          .then(uploadStatus => {
            if (uploadStatus.uploaded) {
              console.log("[LoginScreen] Nowy backup został wysłany do chmury (w tle).", uploadStatus.reason);
            } else {
              console.log("[LoginScreen] Nie było potrzeby wysyłania nowego backupu (w tle).", uploadStatus.reason);
            }
          })
          .catch(uploadError => {
            console.error("[LoginScreen] Błąd podczas próby warunkowego uploadu backupu (w tle):", uploadError);
          });

      } else {
        alert('Nieprawidłowe dane logowania!');
      }
    } catch (error) {
      console.log('[Login] Login error:', error);
      alert('Niepoprawne dane.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Logowanie i synchronizacja danych...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Wprowadź dane logowania:</Text>
        <TextInput
          placeholder="E-mail"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Hasło"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          style={styles.input}
        />
        <Button title="Zaloguj" onPress={handleLogin} disabled={isLoading} />
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
