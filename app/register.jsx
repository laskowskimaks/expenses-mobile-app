import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { useNetworkStatus } from '../context/NetworkContext';
import { validateCredentials } from '@/utils/validation';
import { Text, TextInput, Button, useTheme, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import InformationDialog from '@/components/dialogs/InformationDialog';
import { useDialog } from '@/utils/useDialog';

export default function RegisterScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { register } = useAuth();
  const { handleNewRegistration } = useDb();
  const { isConnected } = useNetworkStatus();
  const router = useRouter();
  const { infoDialog, showInfoDialog, hideInfoDialog } = useDialog();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
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

    setIsRegistering(true);
    try {
      const firebaseResult = await register(email, password);
      if (firebaseResult.success && firebaseResult.user) {
        const userId = firebaseResult.user.uid;
        await handleNewRegistration(userId, email, password);
      } else {
        const errorMessage = firebaseResult.error?.code === 'auth/email-already-in-use'
          ? 'Ten adres e-mail jest już używany!'
          : 'Wystąpił błąd rejestracji. Spróbuj ponownie.';
        showInfoDialog({
          title: 'Błąd rejestracji',
          content: errorMessage,
          type: 'error'
        });
        setIsRegistering(false);
      }
    } catch (error) {
      setIsRegistering(false);
      showInfoDialog({
        title: 'Błąd krytyczny',
        content: 'Wystąpił błąd krytyczny podczas rejestracji.',
        type: 'error'
      });
      console.error('[RegisterScreen] Błąd krytyczny podczas rejestracji:', error);
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
          <Card.Title title="Rejestracja" titleVariant="headlineMedium" />
          <Card.Content>
            <TextInput
              label="Adres e-mail"
              mode="outlined"
              autoCapitalize='none'
              keyboardType='email-address'
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              label="Hasło"
              mode="outlined"
              secureTextEntry
              onChangeText={setPassword}
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleRegister}
              disabled={isRegistering || !isConnected}
              loading={isRegistering}
              style={styles.button}>
              Zarejestruj i zaloguj
            </Button>
            {!isConnected && <Text style={styles.offlineText}>Rejestracja niemożliwa w trybie offline.</Text>}
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
  }
});