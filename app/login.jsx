import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validateCredentials } from '@/utils/validation';
import { useNetworkStatus } from '../context/NetworkContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { login } = useAuth();
  const { isConnected } = useNetworkStatus();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!isConnected) {
      alert('Brak połączenia z internetem. Sprawdź ustawienia sieci i spróbuj ponownie.');
      return;
    }

    const validationResult = validateCredentials(email, password);
    if (!validationResult.isValid) {
      Alert.alert('Błąd walidacji: ', validationResult.message);
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        console.log("[LoginScreen] Logowanie udane. Czekam na przekierowanie z _layout...");
      } else {
        alert(result.message || 'Nieprawidłowe dane logowania!');
      }
    } catch (error) {
      alert('Nieprawidłowe dane logowania.');
      console.log("[LoginScreen] Błąd logowania:", error);
    } finally {
      setIsLoading(false);
    }

  };

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
        <Button title="Zaloguj" onPress={handleLogin} disabled={isLoading || !isConnected} />
        <Pressable onPress={() => router.push('/forgotPassword')} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Zapomniałem hasła</Text>
        </Pressable>
        {!isConnected && <Text style={styles.offlineText}>Logowanie niemożliwe w trybie offline.</Text>}
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
  offlineText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 10
  },
  forgotPasswordContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  }
});