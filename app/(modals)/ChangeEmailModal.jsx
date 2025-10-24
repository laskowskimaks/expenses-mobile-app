import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Keyboard } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, ActivityIndicator, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useNetworkStatus } from '@/context/NetworkContext';
import { updateLocalEmail } from '@/services/settingService';
import { performUpload } from '@/services/backupService';
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog';
import InformationDialog from '@/components/dialogs/InformationDialog';
import { useDialog } from '@/utils/useDialog';
import { validateEmail } from '@/utils/validation';

const STAGES = {
  FORM: 'form',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  SUCCESS: 'success',
};

export default function ChangeEmailModal() {
  const theme = useTheme();
  const router = useRouter();
  const { changeEmail, refreshUser, logoutAfterAction, user } = useAuth();
  const { db } = useDb();
  const { isConnected } = useNetworkStatus();
  const { dialog, showDialog, hideDialog, infoDialog, showInfoDialog, hideInfoDialog } = useDialog();

  const [stage, setStage] = useState(STAGES.FORM);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');

  useEffect(() => {
    if (user?.email) {
      setCurrentEmail(user.email);
    }
  }, [user]);

  const handleInitialSubmit = async () => {
    Keyboard.dismiss();
    setError('');

    if (!isConnected) {
      setError('Do zmiany adresu e-mail wymagane jest połączenie z internetem.');
      return;
    }
    if (!newEmail || !currentPassword) {
      setError('Wszystkie pola są wymagane.');
      return;
    }
    if (!validateEmail(newEmail)) {
      setError('Wprowadzono nieprawidłowy format adresu e-mail.');
      return;
    }
    if (currentPassword.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setError('Nowy adres e-mail musi być różny od aktualnego.');
      return;
    }
    if (!db) {
      setError('Baza danych nie jest dostępna. Spróbuj ponownie później.');
      return;
    }

    setIsProcessing(true);
    try {
      await performUpload();
    } catch (e) {
      console.error("Błąd backupu przed zmianą e-maila:", e);
      showInfoDialog({
        title: 'Błąd synchronizacji',
        content: 'Nie udało się zsynchronizować danych. Sprawdź połączenie z internetem i spróbuj ponownie.',
        type: 'error'
      });
      setIsProcessing(false);
      return;
    }

    try {
      const result = await changeEmail(newEmail, currentPassword);
      if (result.success) {
        setStage(STAGES.AWAITING_CONFIRMATION);
      } else {
        if (result.message && result.message.includes('auth/invalid-credential')) {
          setError('Podano nieprawidłowe hasło.');
          showInfoDialog({
            title: 'Podano nieprawidłowe hasło',
            content: 'Sprawdź podane hasło i spróbuj ponownie.',
            type: 'warning'
          });
        } else {
          setError(result.message || 'Wystąpił błąd podczas zmiany adresu e-mail.');
        }
      }
    } catch (e) {
      setError('Wystąpił nieoczekiwany błąd podczas zmiany adresu e-mail.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const result = await refreshUser();

      if (result.error && result.error.code === 'auth/user-token-expired') {
        try {
          await updateLocalEmail(db, newEmail);
          setStage(STAGES.SUCCESS);
          setTimeout(() => {
            logoutAfterAction();
          }, 4000);
        } catch (dbError) {
          console.error('Błąd aktualizacji lokalnego emaila:', dbError);
          setError('Nie udało się zaktualizować danych lokalnie. Spróbuj ponownie.');
        }
        return;
      }

      if (result.success && result.currentUser?.email === newEmail) {
        try {
          await updateLocalEmail(db, newEmail);
          setStage(STAGES.SUCCESS);
          setTimeout(() => {
            logoutAfterAction();
          }, 2000);
        } catch (dbError) {
          console.error('Błąd aktualizacji lokalnego emaila:', dbError);
          setError('Nie udało się zaktualizować danych lokalnie. Spróbuj ponownie.');
        }
        return;
      }

      showDialog({
        title: "Oczekiwanie na weryfikację",
        content: "Wygląda na to, że Twój nowy adres e-mail nie został jeszcze potwierdzony. Sprawdź swoją skrzynkę pocztową i kliknij w link, a następnie spróbuj ponownie.",
        confirmText: "OK",
        onConfirm: () => { },
        dangerous: false
      });
    } catch (error) {
      console.error('Błąd podczas sprawdzania weryfikacji:', error);
      setError('Wystąpił błąd podczas sprawdzania weryfikacji. Spróbuj ponownie.');
      showInfoDialog({
        title: 'Błąd weryfikacji',
        content: 'Nie udało się sprawdzić statusu weryfikacji. Sprawdź połączenie z internetem i spróbuj ponownie.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (stage) {
      case STAGES.FORM:
        return (
          <>
            <Text variant="headlineMedium" style={styles.headerTitle}>Zmień adres e-mail</Text>
            {currentEmail && (
              <Text style={styles.description}>
                Twój aktualny email to: {currentEmail}
              </Text>
            )}
            <Text style={styles.description}>
              Wprowadź nowy adres e-mail oraz swoje aktualne hasło, aby potwierdzić tożsamość.
            </Text>

            <View style={styles.warningContainer}>
              <Icon source="alert-circle-outline" size={20} color={theme.colors.onSurfaceVariant} style={styles.warningIcon} />
              <Text style={styles.warningText}>
                Uwaga: Po pomyślnej zmianie nastąpi automatyczne wylogowanie i konieczne będzie ponowne zalogowanie.
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Nowy adres e-mail"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Aktualne hasło"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.input}
            />
            <HelperText type="error" visible={!!error} style={styles.errorText}>{error}</HelperText>
            <Button mode="contained" onPress={handleInitialSubmit} loading={isProcessing} disabled={isProcessing} style={styles.button}>
              Wyślij e-mail weryfikacyjny
            </Button>
          </>
        );
      case STAGES.AWAITING_CONFIRMATION:
        return (
          <>
            <Text variant="headlineMedium" style={styles.headerTitle}>Sprawdź swoją pocztę</Text>
            <Text style={styles.description}>
              Wysłaliśmy link weryfikacyjny na adres <Text style={{ fontWeight: 'bold' }}>{newEmail}</Text>. Otwórz go, aby potwierdzić zmianę, a następnie wróć tutaj.
            </Text>
            {isProcessing && <ActivityIndicator animating={true} style={{ marginVertical: 20 }} />}
            <Button mode="contained" onPress={handleCheckVerification} loading={isProcessing} disabled={isProcessing} style={styles.button}>
              Potwierdziłem/am zmianę
            </Button>
          </>
        );
      case STAGES.SUCCESS:
        return (
          <>
            <Text variant="headlineMedium" style={styles.headerTitle}>Sukces!</Text>
            <Text style={styles.description}>
              Adres e-mail został pomyślnie zmieniony. Ze względów bezpieczeństwa zostaniesz teraz wylogowany/a. Zaloguj się ponownie używając nowego adresu.
            </Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Pressable style={styles.backdrop} onPress={() => !isProcessing && router.back()} />
      <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
        {stage === STAGES.FORM && (
          <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton}>
            Anuluj
          </Button>
        )}
      </View>
      <ConfirmationDialog {...dialog} onDismiss={hideDialog} />
      <InformationDialog {...infoDialog} onDismiss={hideInfoDialog} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '95%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    padding: 20
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 12
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    color: 'gray',
    paddingHorizontal: 16,
    lineHeight: 20
  },
  currentEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  currentEmailIcon: {
    marginRight: 12,
  },
  currentEmailContent: {
    flex: 1,
  },
  currentEmailLabel: {
    marginBottom: 2,
  },
  currentEmailText: {
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 23, 68, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    width: '100%',
    marginBottom: 12
  },
  errorText: {
    textAlign: 'center'
  },
  button: {
    marginTop: 10,
    width: '100%'
  },
  cancelButton: {
    marginBottom: 20,
    borderColor: 'transparent',
    position: 'absolute',
  },
});