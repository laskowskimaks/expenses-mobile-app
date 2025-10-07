import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validateCredentials } from '@/utils/validation';
import { useNetworkStatus } from '../context/NetworkContext';
import { useRouter } from 'expo-router';
import { Text, TextInput, Button, useTheme, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import InformationDialog from '@/components/dialogs/InformationDialog';
import { useDialog } from '@/utils/useDialog';

export default function LoginScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { login } = useAuth();
  const { isConnected } = useNetworkStatus();
  const router = useRouter();
  const { infoDialog, showInfoDialog, hideInfoDialog } = useDialog();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!isConnected) {
      showInfoDialog({
        title: 'Brak połączenia',
        content: 'Brak połączenia z internetem. Sprawdź ustawienia sieci i spróbuj ponownie.',
        type: 'error'
      });
      return;
    }

    const validationResult = validateCredentials(email, password);
    if (!validationResult.isValid) {
      showInfoDialog({
        title: 'Błąd walidacji',
        content: validationResult.message,
        type: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        showInfoDialog({
          title: 'Błąd logowania',
          content: result.message || 'Nieprawidłowe dane logowania!',
          type: 'error'
        });
      }
    } catch (error) {
      showInfoDialog({
        title: 'Błąd logowania',
        content: 'Nieprawidłowe dane logowania.',
        type: 'error'
      });
      console.log("[LoginScreen] Błąd logowania:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="Logowanie" titleVariant="headlineMedium" />
          <Card.Content>
            <TextInput
              label="E-mail"
              mode="outlined"
              onChangeText={setEmail}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              label="Hasło"
              mode="outlined"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleLogin}
              disabled={isLoading || !isConnected}
              loading={isLoading}
              style={styles.button}>
              Zaloguj
            </Button>
            <Button
              mode="text"
              onPress={() => router.push('/forgotPassword')}
              style={styles.forgotPasswordButton}>
              Zapomniałem hasła
            </Button>
            {!isConnected && <Text style={styles.offlineText}>Logowanie niemożliwe w trybie offline.</Text>}
          </Card.Content>
        </Card>
      </View>
      <InformationDialog {...infoDialog} onDismiss={hideInfoDialog} />
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  backButton: {
    margin: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  offlineText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  forgotPasswordButton: {
    marginTop: 12,
  }
});