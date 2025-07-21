import React, { useState } from 'react';
import { eq } from 'drizzle-orm';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useDb } from '../context/DbContext';
import { useAuth } from '../context/AuthContext';
import { generateSalt, hashData } from '@/utils/hashUtils';
import { deleteSetting, upsertSetting } from '@/services/authService';

export default function PinSettingScreen() {
  const { db } = useDb();
  const { completeRegistration, unlockApp } = useAuth();

  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async (pinToSave) => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    if (pinToSave && (pinToSave.length !== 4 || isNaN(pinToSave))) {
      Alert.alert('Błąd', 'PIN musi mieć dokładnie 4 cyfry!');
      setIsSaving(false);
      return;
    }

    try {
      if (pinToSave) {
        const pinSalt = generateSalt();
        const hashedPin = await hashData(pinToSave, pinSalt);
        await upsertSetting(db, 'pin', hashedPin);
        await upsertSetting(db, 'pinSalt', pinSalt);

        console.log('[PinSetting] PIN zapisany!');
      } else {
        await deleteSetting(db, 'pin');
        await deleteSetting(db, 'pinSalt');
        console.log('[PinSetting] Użytkownik pominął ustawianie PINu.');
      }

      completeRegistration();
      unlockApp();

    } catch (e) {
      console.log('[PinSetting] Błąd zapisu PINu:', e);
      Alert.alert('Błąd', 'Błąd zapisu PINu');
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ustaw PIN (4 cyfry):</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        maxLength={4}
        value={pin}
        onChangeText={setPin}
        autoFocus
        secureTextEntry
      />
      <Button title="Zapisz PIN" onPress={() => handleFinish(pin)} />
      <Button title="Pomiń" onPress={() => handleFinish(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', margin: 20 },
  text: { fontSize: 16, marginBottom: 10 },
  input: {
    height: 40, borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginBottom: 10,
    width: 100,
    textAlign: 'center'
  },
});