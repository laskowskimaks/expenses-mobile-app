import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useDb } from '@/context/DbContext';
import TransactionItem from '@/components/TransactionItem';
import { TransactionSkeletonList } from '@/components/TransactionSkeleton';
import { getAllTransactionsSorted } from '@/services/transactionService';
import { eventEmitter } from '@/utils/eventEmitter';

export default function TransactionListScreen() {
  const { db } = useDb();
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (db) {
      fetchTransactions(true);
    }
  }, [db]);

  const handleTransactionAdded = useCallback((data) => {
    console.log('[TransactionListScreen] Otrzymano event transactionAdded:', data);
    fetchTransactions(false);
  }, []);

  useEffect(() => {
    eventEmitter.on('transactionAdded', handleTransactionAdded);
    eventEmitter.on('periodicTransactionAdded', handleTransactionAdded);

    return () => {
      eventEmitter.off('transactionAdded', handleTransactionAdded);
      eventEmitter.off('periodicTransactionAdded', handleTransactionAdded);
    };
  }, [handleTransactionAdded]);

  const fetchTransactions = async (showLoading = true) => {
    if (!db) return;

    if (showLoading) {
      setIsLoadingTransactions(true);
    }

    try {
      console.log("[TransactionListScreen] Pobieranie transakcji...");
      const allTransactions = await getAllTransactionsSorted(db);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('[TransactionListScreen] Błąd podczas pobierania transakcji:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać transakcji');
    } finally {
      if (showLoading) {
        setIsLoadingTransactions(false);
      }
    }
  };

  const handleRefresh = async () => {
    console.log("[TransactionListScreen] Ręczne odświeżanie danych...");
    await fetchTransactions(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log("[TransactionListScreen] Pull-to-refresh aktywne...");
    await fetchTransactions(false);
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header listy transakcji */}
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
        <TransactionSkeletonList count={6} />
      ) : transactions.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak transakcji do wyświetlenia</Text>
        </View>
      ) : (
        /* Lista */
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
              colors={['#007BFF']}
              tintColor={'#007BFF'}
              title="Odświeżanie..."
              titleColor={'#007BFF'}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
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
  listContainer: {
    paddingBottom: 75,
  },
});
