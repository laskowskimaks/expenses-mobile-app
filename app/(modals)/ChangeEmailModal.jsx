import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert, Keyboard } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, ActivityIndicator, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useNetworkStatus } from '@/context/NetworkContext';
import { updateLocalEmail } from '@/services/authService';
import { performUpload } from '@/services/backupService';

const STAGES = {
  FORM: 'form',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  SUCCESS: 'success',
};

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export default function ChangeEmailModal() {
    const theme = useTheme();
    const router = useRouter();
    const { changeEmail, refreshUser, logoutAfterAction } = useAuth();
    const { db } = useDb();
    const { isConnected } = useNetworkStatus();

    const [stage, setStage] = useState(STAGES.FORM);
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

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

        setIsProcessing(true);
        try {
            await performUpload();
        } catch (e) {
            console.error("Błąd backupu przed zmianą e-maila:", e);
            setError("Nie udało się zsynchronizować danych. Spróbuj ponownie.");
            setIsProcessing(false);
            return;
        }

        const result = await changeEmail(newEmail, currentPassword);
        setIsProcessing(false);

        if (result.success) {
            setStage(STAGES.AWAITING_CONFIRMATION);
        } else {
            setError(result.message || 'Wystąpił nieoczekiwany błąd.');
        }
    };
    
    const handleCheckVerification = async () => {
      setIsProcessing(true);
      const result = await refreshUser();

      if (result.error && result.error.code === 'auth/user-token-expired') {
        await updateLocalEmail(db, newEmail);
        setStage(STAGES.SUCCESS);
        setTimeout(() => {
          logoutAfterAction();
        }, 4000); 
        return;
      }
      
      if (result.success && result.currentUser?.email === newEmail) {
        await updateLocalEmail(db, newEmail);
        setStage(STAGES.SUCCESS);
        setTimeout(() => router.back(), 2000); 
        return;
      }

      Alert.alert(
        "Oczekiwanie na weryfikację",
        "Wygląda na to, że Twój nowy adres e-mail nie został jeszcze potwierdzony. Sprawdź swoją skrzynkę pocztową i kliknij w link, a następnie spróbuj ponownie.",
        [{ text: "OK" }]
      );
      setIsProcessing(false);
    };

    const renderContent = () => {
      switch (stage) {
        case STAGES.FORM:
          return (
            <>
              <Text variant="headlineMedium" style={styles.headerTitle}>Zmień adres e-mail</Text>
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
                Wysłaliśmy link weryfikacyjny na adres <Text style={{fontWeight: 'bold'}}>{newEmail}</Text>. Otwórz go, aby potwierdzić zmianę, a następnie wróć tutaj.
              </Text>
              {isProcessing && <ActivityIndicator animating={true} style={{ marginVertical: 20 }}/>}
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
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '95%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', padding: 20 },
    contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
    headerTitle: { textAlign: 'center', marginBottom: 12 },
    description: { textAlign: 'center', marginBottom: 16, color: 'gray', paddingHorizontal: 16, lineHeight: 20 },
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
    input: { width: '100%', marginBottom: 12 },
    errorText: { textAlign: 'center' },
    button: { marginTop: 10, width: '100%' },
    cancelButton: { marginBottom: 20, borderColor: 'transparent' },
});