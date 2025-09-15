import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, TextInput as RNTextInput } from 'react-native';
import { useDb } from '../context/DbContext';
import { useAuth } from '../context/AuthContext';
import { generateSalt, hashData } from '@/utils/hashUtils';
import { deleteSetting, upsertSetting } from '@/services/authService';
import { Text, Button, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { useDialog } from '@/utils/useDialog';

export default function PinSettingScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { db } = useDb();
  const { completeRegistration, unlockApp } = useAuth();
  const { dialog, showDialog, hideDialog } = useDialog();

  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const pinInputRef = useRef(null);

  const handleFinish = async (pinToSave) => {
    if (isSaving) return;

    if (pinToSave && (pinToSave.length !== 4 || isNaN(pinToSave))) {
      showDialog({
        title: 'Błąd',
        content: 'PIN musi składać się z 4 cyfr!',
        confirmText: 'OK',
        onConfirm: () => { },
        dangerous: false
      });
      return;
    }
    setIsSaving(true);
    try {
      if (pinToSave) {
        const pinSalt = generateSalt();
        const hashedPin = await hashData(pinToSave, pinSalt);
        await upsertSetting(db, 'pin', hashedPin);
        await upsertSetting(db, 'pinSalt', pinSalt);
      } else {
        await deleteSetting(db, 'pin');
        await deleteSetting(db, 'pinSalt');
      }
      completeRegistration();
      unlockApp();
    } catch (e) {
      console.error('[PinSetting] Błąd zapisu PINu:', e);
      showDialog({
        title: 'Błąd',
        content: 'Wystąpił błąd podczas zapisu PINu.',
        confirmText: 'OK',
        onConfirm: () => { },
        dangerous: false
      });
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pinDigits = Array.from({ length: 4 });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>Ustaw kod PIN</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Zabezpiecz dostęp do aplikacji (opcjonalne)</Text>

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
        />

        <Button mode="contained" onPress={() => handleFinish(pin)} disabled={pin.length !== 4} style={styles.button}>
          Zapisz i kontynuuj
        </Button>

        <Button mode="text" onPress={() => handleFinish(null)} style={styles.buttonSkip}>
          Pomiń
        </Button>
      </View>
      <ConfirmationDialog {...dialog} onDismiss={hideDialog} />
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  subtitle: {
    marginBottom: 40,
    color: theme.colors.onSurfaceVariant,
  },
  pinContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  pinBox: {
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
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
  button: {
    width: '80%',
    marginTop: 20,
  },
  buttonSkip: {
    marginTop: 12,
  },
});