import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, ActivityIndicator, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDb } from '@/context/DbContext';
import { getHashedPin, verifyPin, savePin, removePin } from '@/services/authService';

const STAGES = {
  LOADING: 'loading',
  VERIFY: 'verify',
  SET_NEW: 'set_new',
  SUCCESS: 'success',
};

export default function ChangePinModal() {
  const theme = useTheme();
  const router = useRouter();
  const { db } = useDb();

  const [stage, setStage] = useState(STAGES.LOADING);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPinInitially, setHasPinInitially] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkExistingPin = async () => {
      if (db) {
        const existingPin = await getHashedPin(db);
        if (existingPin) {
          setHasPinInitially(true);
          setStage(STAGES.VERIFY);
        } else {
          setHasPinInitially(false);
          setStage(STAGES.SET_NEW);
        }
      }
    };
    checkExistingPin();
  }, [db]);

  const handleVerify = async () => {
    if (pin.length !== 4) {
      setError('PIN musi mieć 4 cyfry.');
      return;
    }
    setIsProcessing(true);
    setError('');
    const isCorrect = await verifyPin(db, pin);
    if (isCorrect) {
      setStage(STAGES.SET_NEW);
      setPin('');
    } else {
      setError('Nieprawidłowy PIN. Spróbuj ponownie.');
      setPin('');
    }
    setIsProcessing(false);
  };

  const handleSave = async () => {
    if (pin.length !== 4) {
      setError('Nowy PIN musi mieć 4 cyfry.');
      return;
    }
    setIsProcessing(true);
    setError('');
    const success = await savePin(db, pin);
    if (success) {
      setSuccessMessage('PIN został pomyślnie zmieniony.');
      setStage(STAGES.SUCCESS);
      setTimeout(() => router.back(), 1500);
    } else {
      setError('Wystąpił błąd podczas zapisywania PINu.');
    }
    setIsProcessing(false);
  };

  const handleRemovePin = () => {
    Alert.alert(
      "Usunąć PIN?",
      "Aplikacja nie będzie już chroniona kodem PIN przy uruchamianiu. Czy na pewno chcesz kontynuować?",
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Usuń PIN", style: "destructive", onPress: async () => {
            setIsProcessing(true);
            const success = await removePin(db);
            if (success) {
              setSuccessMessage('PIN został pomyślnie usunięty.');
              setStage(STAGES.SUCCESS);
              setTimeout(() => router.back(), 1500);
            } else {
              setError('Wystąpił błąd podczas usuwania PINu.');
            }
            setIsProcessing(false);
        }}
      ]
    );
  };

  const getTitle = () => {
    switch (stage) {
      case STAGES.VERIFY: return 'Wprowadź aktualny PIN';
      case STAGES.SET_NEW: return hasPinInitially ? 'Ustaw nowy PIN' : 'Ustaw swój PIN';
      case STAGES.SUCCESS: return 'Sukces!';
      default: return '';
    }
  };

  const getButtonAction = () => stage === STAGES.VERIFY ? handleVerify : handleSave;

  return (
    <>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
        <View style={styles.contentContainer}>
          <Text variant="headlineMedium" style={styles.headerTitle}>{getTitle()}</Text>

          {stage === STAGES.LOADING && <ActivityIndicator animating={true} size="large" />}

          {stage === STAGES.SUCCESS && (
            <Text style={styles.successText}>{successMessage}</Text>
          )}

          {[STAGES.VERIFY, STAGES.SET_NEW].includes(stage) && (
            <>
              <TextInput
                mode="outlined"
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                autoFocus
                textAlign="center"
                onSubmitEditing={getButtonAction()}
              />
              <HelperText type="error" visible={!!error}>{error}</HelperText>
              <Button
                mode="contained"
                onPress={getButtonAction()}
                loading={isProcessing}
                disabled={isProcessing}
                style={styles.button}
              >
                {stage === STAGES.VERIFY ? 'Potwierdź' : 'Zapisz PIN'}
              </Button>

              {hasPinInitially && stage === STAGES.SET_NEW && (
                 <Button
                    mode="outlined"
                    onPress={handleRemovePin}
                    disabled={isProcessing}
                    style={styles.removeButton}
                  >
                    Usuń PIN i nie używaj
                  </Button>
              )}
            </>
          )}
        </View>
        <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton}>
          Anuluj
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '95%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', padding: 20 },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { textAlign: 'center', marginBottom: 24 },
  input: { width: 200, fontSize: 24, letterSpacing: 15 },
  button: { marginTop: 20, width: '80%' },
  removeButton: { marginTop: 12, width: '80%' },
  cancelButton: { marginBottom: 20, borderColor: 'transparent' },
  successText: { fontSize: 18, textAlign: 'center', color: 'green' },
});