import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

export default function LoginScreen() {
  const { login } = useAuth();

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
        console.log("[LoginScreen] Logowanie w Firebase udane. Przekierowuję...");
      } else {
        alert('Nieprawidłowe dane logowania!');
      }
    } catch (error) {
      alert('Wystąpił błąd logowania.');
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0000ff" />
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
