import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDb } from '@/context/DbContext';
// Załóżmy, że masz taką funkcję serwisową
// import { addTransaction } from '@/services/transactionService';

export default function AddTransactionModal() {
  const router = useRouter();
  const { db } = useDb();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = async () => {
    // Prosta walidacja
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Błąd', 'Tytuł i kwota są wymagane.');
      return;
    }
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount)) {
      Alert.alert('Błąd', 'Kwota musi być liczbą.');
      return;
    }

    console.log('Zapisywanie transakcji:', { title, amount: numericAmount, category });
    
    //
    // Tutaj umieść logika zapisu do bazy danych 
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dodaj nową transakcję</Text>
      
      <Text style={styles.label}>Tytuł</Text>
      <TextInput
        style={styles.input}
        placeholder="np. Zakupy spożywcze"
        value={title}
        onChangeText={setTitle}
      />
      
      <Text style={styles.label}>Kwota (PLN)</Text>
      <TextInput
        style={styles.input}
        placeholder="np. 150.99"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Kategoria (opcjonalnie)</Text>
      <TextInput
        style={styles.input}
        placeholder="np. Jedzenie"
        value={category}
        onChangeText={setCategory}
      />
      
      <View style={styles.buttonContainer}>
        <Button title="Zapisz transakcję" onPress={handleSave} />
      </View>

      <View style={styles.buttonContainer}>
         <Button title="Anuluj" onPress={() => router.back()} color="#c23616" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#2c3e50',
  },
  label: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
  }
});