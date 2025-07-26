import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useDb } from '@/context/DbContext';
import { getAllSettingsAsObject } from '@/services/authService';
import { insertTestData } from '@/database/insertTestData';
import TransactionItem from '@/components/TransactionItem';
import { getAllTransactionsSorted } from '@/services/transactionService';
import { getLastCheckInfo } from '@/utils/periodicChecker';
import { processPeriodicTransactions } from '@/services/periodicTransactionService';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { db } = useDb();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isAddingTestData, setIsAddingTestData] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessingPeriodic, setIsProcessingPeriodic] = useState(false);
  const [lastCheckInfo, setLastCheckInfo] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (db) {
        console.log("[HomeScreen] Instancja bazy dostępna, pobieram dane...");
        const settingsObject = await getAllSettingsAsObject(db);
        setCurrentUserData(settingsObject);
      } else {
        setCurrentUserData(null);
      }
    };
    fetchUserData();
  }, [db]);

  // Pobieranie info o ostatnim sprawdzeniu transakcji okresowych
  useEffect(() => {
    const fetchLastCheckInfo = async () => {
      if (__DEV__) {
        const info = await getLastCheckInfo();
        setLastCheckInfo(info);
      }
    };
    fetchLastCheckInfo();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [db]);

  const fetchTransactions = async (showLoading = true) => {
    if (!db) return;

    if (showLoading) {
      setIsLoadingTransactions(true);
    }

    try {
      console.log("[HomeScreen] Pobieranie transakcji...");
      const allTransactions = await getAllTransactionsSorted(db);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('[HomeScreen] Błąd podczas pobierania transakcji:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać transakcji');
    } finally {
      if (showLoading) {
        setIsLoadingTransactions(false);
      }
    }
  };

  const handleRefresh = async () => {
    console.log("[HomeScreen] Ręczne odświeżanie danych...");
    await fetchTransactions(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log("[HomeScreen] Pull-to-refresh aktywne...");
    await fetchTransactions(false);
    setRefreshing(false);
  };

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

        if (result.addedCount > 0) {
          await fetchTransactions(false); // Odświeżanie listy bez spinnera
        }

        // Odświeżanie info o ostatnim sprawdzeniu
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
        await fetchTransactions(false);
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

      {/* Przyciski deweloperskie */}
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

      {/* Lista transakcji */}
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>
            Wszystkie transakcje ({transactions.length})
          </Text>
          <Button
            title={isLoadingTransactions ? "Ładowanie..." : "Odśwież"}
            onPress={handleRefresh}
            disabled={isLoadingTransactions || refreshing}
          />
        </View>

        {/* Loading state */}
        {isLoadingTransactions ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Ładowanie transakcji...</Text>
          </View>
        ) : transactions.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak transakcji do wyświetlenia</Text>
            {__DEV__ && (
              <Text style={styles.emptySubtext}>
                Użyj przycisków powyżej aby dodać testowe dane
              </Text>
            )}
          </View>
        ) : (
          /* Lista z pull-to-refresh */
          <FlatList
            data={transactions}
            keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
            renderItem={({ item }) => <TransactionItem transaction={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#007BFF']} // Android
                tintColor={'#007BFF'} // iOS
                title="Odświeżanie..." // iOS
                titleColor={'#007BFF'} // iOS
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
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
  transactionsContainer: {
    flex: 1,
    marginTop: 10,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  listContainer: {
    paddingBottom: 20,
  },
});