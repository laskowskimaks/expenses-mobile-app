import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { View, Text, Button, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useDb } from '@/context/DbContext';
import { getAllSettingsAsObject } from '@/services/authService';
import { insertTestData } from '@/database/insertTestData';
import { getLastCheckInfo, resetPeriodicCheckTime } from '@/utils/periodicChecker';
import { processPeriodicTransactions } from '@/services/periodicTransactionService';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { db } = useDb();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isAddingTestData, setIsAddingTestData] = useState(false);
  const [isProcessingPeriodic, setIsProcessingPeriodic] = useState(false);
  const [lastCheckInfo, setLastCheckInfo] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (db) {
        console.log("[HomeScreen] Instancja bazy dostępna, pobieram dane...");
        try {
          const settingsObject = await getAllSettingsAsObject(db);
          setCurrentUserData(settingsObject);
        } catch (error) {
          console.error("[HomeScreen] Błąd podczas pobierania danych użytkownika:", error);
          setCurrentUserData(null);
        }
      } else {
        setCurrentUserData(null);
      }
    };
    fetchUserData();
  }, [db]);

  useEffect(() => {
    const fetchLastCheckInfo = async () => {
      if (__DEV__) {
        try {
          const info = await getLastCheckInfo();
          setLastCheckInfo(info);
        } catch (error) {
          console.error("[HomeScreen] Błąd podczas pobierania info o sprawdzeniu:", error);
        }
      }
    };
    fetchLastCheckInfo();
  }, []);

  const handleProcessPeriodicTransactions = async () => {
    if (!db) {
      Alert.alert('Błąd', 'Baza danych nie jest dostępna.');
      return;
    }

    setIsProcessingPeriodic(true);
    try {
      console.log("[HomeScreen] Ręczne sprawdzenie transakcji okresowych...");
      const result = await processPeriodicTransactions(db);

      if (result.success) {
        const message = result.addedCount > 0
          ? `Dodano ${result.addedCount} nowych transakcji automatycznych:\n\n${result.addedTransactions.map(t => `• ${t.title} (${t.amount} PLN)`).join('\n')}`
          : 'Brak zaległych transakcji okresowych do dodania';

        Alert.alert('Transakcje okresowe', message);

        const info = await getLastCheckInfo();
        setLastCheckInfo(info);

      } else {
        Alert.alert('Błąd', result.message);
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas przetwarzania transakcji okresowych.');
      console.error('[HomeScreen] Błąd transakcji okresowych:', error);
    } finally {
      setIsProcessingPeriodic(false);
    }
  };

  const handleAddTestData = async () => {
    if (!db) {
      Alert.alert('Błąd', 'Baza danych nie jest dostępna.');
      return;
    }

    setIsAddingTestData(true);
    try {
      const result = await insertTestData(db);
      if (result.success) {
        Alert.alert('Sukces', result.message);
      } else {
        Alert.alert('Błąd', result.message);
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas dodawania testowych danych.');
      console.error('[HomeScreen] Błąd dodawania testowych danych:', error);
    } finally {
      setIsAddingTestData(false);
    }
  };

  const handleResetCheckTime = async () => {
      await resetPeriodicCheckTime();
      Alert.alert('Reset', 'Czas ostatniego sprawdzania został zresetowany');
      const info = await getLastCheckInfo();
      setLastCheckInfo(info);
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    )
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Witaj, {user.email}!</Text>
        <Button title="Wyloguj" onPress={logout} />
      </View>

      {/* Przyciski dev */}
      {__DEV__ && (
        <View style={styles.devContainer}>
          <View style={styles.testDataContainer}>
            <Button
              title={isAddingTestData ? "Dodaję dane..." : "Dodaj testowe dane"}
              onPress={handleAddTestData}
              disabled={isAddingTestData}
            />
          </View>

          <View style={styles.periodicContainer}>
            <Button
              title={isProcessingPeriodic ? "Sprawdzam..." : "Sprawdź transakcje okresowe"}
              onPress={handleProcessPeriodicTransactions}
              disabled={isProcessingPeriodic}
            />
            {lastCheckInfo && (
              <Text style={styles.lastCheckText}>
                Ostatnie sprawdzenie: {lastCheckInfo.date ?
                  `${lastCheckInfo.minutesAgo} min temu` : 'nigdy'}
              </Text>
            )}
            <Button
              title="Reset czasu sprawdzania"
              onPress={handleResetCheckTime}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  devContainer: {
    padding: 15,
    backgroundColor: '#fff3cd',
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
  },
  testDataContainer: {
    margin: 15,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  periodicContainer: {
    marginTop: 8,
  },
  lastCheckText: {
    marginTop: 8,
    fontSize: 13,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});