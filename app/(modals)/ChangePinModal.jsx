import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput as RNTextInput } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, HelperText, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDb } from '@/context/DbContext';
import { getHashedPin, verifyPin, savePin, removePin } from '@/services/authService';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { useDialog } from '@/utils/useDialog';

const STAGES = {
  LOADING: 'loading',
  VERIFY: 'verify',
  SET_NEW: 'set_new',
  SUCCESS: 'success',
};

export default function ChangePinModal() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { db } = useDb();
  const { dialog, showDialog, hideDialog } = useDialog();

  const [stage, setStage] = useState(STAGES.LOADING);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPinInitially, setHasPinInitially] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const pinInputRef = useRef(null);

  useEffect(() => {
    const checkExistingPin = async () => {
      if (db) {
        try {
          const existingPin = await getHashedPin(db);
          if (existingPin) {
            setHasPinInitially(true);
            setStage(STAGES.VERIFY);
          } else {
            setHasPinInitially(false);
            setStage(STAGES.SET_NEW);
          }
        } catch (e) {
          setError('Błąd wczytywania ustawień PIN.');
          setStage(STAGES.SET_NEW);
        }
      }
    };
    checkExistingPin();
  }, [db]);

  useEffect(() => {
    if (stage === STAGES.VERIFY || stage === STAGES.SET_NEW) {
      pinInputRef.current?.focus();
    }
  }, [stage]);

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
      setTimeout(() => router.back(), 2000);
    } else {
      setError('Wystąpił błąd podczas zapisywania PINu.');
    }
    setIsProcessing(false);
  };

  const handleRemovePin = () => {
    showDialog({
      title: "Usunąć PIN?",
      content: "Aplikacja nie będzie już chroniona kodem PIN przy uruchamianiu. Czy na pewno chcesz kontynuować?",
      confirmText: "Usuń PIN",
      onConfirm: async () => {
        setIsProcessing(true);
        const success = await removePin(db);
        if (success) {
          setSuccessMessage('PIN został pomyślnie usunięty.');
          setStage(STAGES.SUCCESS);
          setTimeout(() => router.back(), 2000);
        } else {
          setError('Wystąpił błąd podczas usuwania PINu.');
        }
        setIsProcessing(false);
      },
      dangerous: true
    });
  };

  const getTitle = () => {
    switch (stage) {
      case STAGES.VERIFY: return 'Wprowadź aktualny PIN';
      case STAGES.SET_NEW: return hasPinInitially ? 'Ustaw nowy PIN' : 'Ustaw swój PIN';
      case STAGES.SUCCESS: return 'Sukces!';
      default: return 'Zmień PIN';
    }
  };

  const getButtonAction = () => {
    if (pin.length === 4) {
      return stage === STAGES.VERIFY ? handleVerify : handleSave;
    }
    return () => { };
  };

  const renderContent = () => {
    if (stage === STAGES.LOADING) {
      return <ActivityIndicator animating={true} size="large" />;
    }
    if (stage === STAGES.SUCCESS) {
      return <Text variant="titleMedium" style={styles.successText}>{successMessage}</Text>;
    }
    if ([STAGES.VERIFY, STAGES.SET_NEW].includes(stage)) {
      const pinDigits = Array.from({ length: 4 });
      return (
        <>
          <Pressable onPress={() => pinInputRef.current?.focus()}>
            <View style={styles.pinContainer}>
              {pinDigits.map((_, index) => (
                <Surface key={index} style={[styles.pinBox, pin.length === index && styles.pinBoxFocused]} elevation={2}>
                  {pin[index] ? <View style={styles.pinDot} /> : null}
                </Surface>
              ))}
            </View>
          </Pressable>
          <RNTextInput
            ref={pinInputRef}
            style={styles.hiddenInput}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={4}
            caretHidden
            autoFocus
            onSubmitEditing={getButtonAction()}
          />
          <HelperText type="error" visible={!!error} style={styles.helperText}>{error}</HelperText>
          <Button
            mode="contained"
            onPress={getButtonAction()}
            loading={isProcessing}
            disabled={isProcessing || pin.length !== 4}
            style={styles.button}
          >
            {stage === STAGES.VERIFY ? 'Potwierdź' : 'Zapisz PIN'}
          </Button>

          {hasPinInitially && stage === STAGES.SET_NEW && (
            <Button
              mode="text"
              onPress={handleRemovePin}
              disabled={isProcessing}
              style={styles.removeButton}
              textColor={theme.colors.error}
            >
              Usuń i nie używaj PINu
            </Button>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <>
      <Pressable style={styles.backdrop} onPress={() => !isProcessing && router.back()} />
      <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.contentContainer}>
          <Text variant="headlineMedium" style={styles.headerTitle}>{getTitle()}</Text>
          {renderContent()}
        </View>
        <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton} disabled={isProcessing}>
          Anuluj
        </Button>
      </View>
      <ConfirmationDialog {...dialog} onDismiss={hideDialog} />
    </>
  );
}

const createStyles = (theme) => StyleSheet.create({
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
    alignItems: 'center'
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 40
  },
  pinContainer: {
    flexDirection: 'row',
  },
  pinBox: {
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  pinBoxFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.onSurface,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  helperText: {
    marginTop: 10,
    minHeight: 20,
  },
  button: {
    marginTop: 20,
    width: '80%'
  },
  removeButton: {
    marginTop: 12
  },
  cancelButton: {
    marginBottom: 20,
    alignSelf: 'center',
    width: '80%'
  },
  successText: {
    fontSize: 18,
    textAlign: 'center',
    color: theme.colors.primary,
  },
});