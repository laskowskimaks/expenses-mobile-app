import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  SectionList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Searchbar, IconButton, Portal, Modal, Badge } from 'react-native-paper';

import { useDb } from '@/context/DbContext';
import TransactionItem from '@/components/TransactionItem';
import { TransactionSkeletonList } from '@/components/TransactionSkeleton';
import DateSeparator from '@/components/DateSeparator';
import { getAllTransactionsSorted } from '@/services/transactionService';
import { groupTransactionsByDate } from '@/utils/transactionUtils';
import { eventEmitter } from '@/utils/eventEmitter';
import useDebounce from '@/utils/useDebounce';

import FilterModal from '@/components/FilterModal';
import { getAllCategories } from '@/services/categoryService';
import { getAllTags } from '@/services/tagService';
import RNModal from 'react-native-modal';

const DEFAULT_DAYS_BACK = 45;

export default function TransactionListScreen() {
  const { db } = useDb();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchQuery = useDebounce(searchInput, 100);

  const [allTransactions, setAllTransactions] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // filter modal
  const [filterVisible, setFilterVisible] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);

  const [appliedFilters, setAppliedFilters] = useState(() => createDefaultFilters());

  useEffect(() => {
    if (db) {
      fetchTransactions(true);
      loadFilterOptions();
    }
  }, [db]);

  useEffect(() => {
    const reload = () => loadFilterOptions();
    eventEmitter.on('tagAdded', reload);
    eventEmitter.on('tagsChanged', reload);
    eventEmitter.on('categoryAdded', reload);
    eventEmitter.on('categoriesChanged', reload);
    return () => {
      eventEmitter.off('tagAdded', reload);
      eventEmitter.off('tagsChanged', reload);
      eventEmitter.off('categoryAdded', reload);
      eventEmitter.off('categoriesChanged', reload);
    };
  }, []);

  const handleTransactionAdded = useCallback(() => { fetchTransactions(false); }, []);
  useEffect(() => {
    eventEmitter.on('transactionAdded', handleTransactionAdded);
    eventEmitter.on('periodicTransactionAdded', handleTransactionAdded);
    return () => {
      eventEmitter.off('transactionAdded', handleTransactionAdded);
      eventEmitter.off('periodicTransactionAdded', handleTransactionAdded);
    };
  }, [handleTransactionAdded]);

  useEffect(() => {
    if (isLoadingTransactions) return;

    const lowercasedQuery = debouncedSearchQuery.trim().toLowerCase();

    const filteredTransactions = allTransactions.filter(transaction => {
      const titleMatch = transaction.title ? transaction.title.toLowerCase().includes(lowercasedQuery) : false;
      const locationMatch = transaction.location ? transaction.location.toLowerCase().includes(lowercasedQuery) : false;
      const notesMatch = transaction.notes ? transaction.notes.toLowerCase().includes(lowercasedQuery) : false;

      if (lowercasedQuery !== '' && !(titleMatch || locationMatch || notesMatch)) return false;

      return transactionPassesFilters(transaction, appliedFilters);
    });

    setSections(groupTransactionsByDate(filteredTransactions));
  }, [debouncedSearchQuery, allTransactions, appliedFilters, isLoadingTransactions]);

  const fetchTransactions = async (showLoading = true) => {
    if (!db) return;
    if (showLoading) setIsLoadingTransactions(true);

    try {
      const transactionsFromDb = await getAllTransactionsSorted(db);
      setAllTransactions(transactionsFromDb);
    } catch (error) {
      console.error('[TransactionListScreen] Błąd podczas pobierania transakcji:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać transakcji');
    } finally {
      if (showLoading) setIsLoadingTransactions(false);
    }
  };

  const normalizeCategory = (cat) => {
    if (!cat) return null;
    return {
      id: cat.id ?? cat.categoryId ?? cat._id ?? null,
      name: cat.name ?? cat.label ?? cat.categoryName ?? '',
      iconName: cat.iconName ?? cat.icon ?? cat.categoryIcon ?? null,
      color: cat.color ?? cat.backgroundColor ?? cat.categoryColor ?? '#cccccc',
    };
  };

  const normalizeTag = (tag) => {
    if (!tag) return null;
    return {
      id: tag.id ?? tag.tagId ?? tag._id ?? null,
      name: tag.name ?? tag.label ?? tag.tagName ?? '',
    };
  };

  const loadFilterOptions = async () => {
    try {
      const [catsRaw, tagsRaw] = await Promise.all([getAllCategories(db), getAllTags(db)]);
      const cats = (catsRaw || []).map(normalizeCategory).filter(Boolean);
      const tags = (tagsRaw || []).map(normalizeTag).filter(Boolean);
      setCategoriesOptions(cats);
      setTagsOptions(tags);
    } catch (error) {
      console.error('[TransactionListScreen] Błąd podczas wczytywania opcji filtrów:', error);
    }
  };

  const handleRefresh = async () => {
    setSearchInput('');
    await fetchTransactions(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchInput('');
    await fetchTransactions(false);
    setRefreshing(false);
  };

  const getDisplayedTransactionCount = () => sections.reduce((acc, s) => acc + s.data.length, 0);

  const renderEmptyComponent = () => {
    if (allTransactions.length > 0 && debouncedSearchQuery !== '') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak wyników dla frazy "{debouncedSearchQuery}"</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Brak transakcji do wyświetlenia</Text>
      </View>
    );
  };

  const openFilter = useCallback(() => { setFilterVisible(true); }, []);
  const closeFilter = useCallback(() => { setFilterVisible(false); }, []);

  const applyFilterChanges = useCallback((newFilters) => {
    setAppliedFilters(newFilters);
    setFilterVisible(false);
  }, []);

  const resetAndApplyFilters = useCallback(() => {
    const defaults = createDefaultFilters();
    setAppliedFilters(defaults);
    setFilterVisible(false);
  }, []);

  const initialFiltersMemo = useMemo(() => appliedFilters, [appliedFilters]);

  const activeFilterCount = countActiveFilters(appliedFilters);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Szukaj po tytule, lokalizacji lub opisie"
          onChangeText={setSearchInput}
          value={searchInput}
          style={styles.searchbar}
          elevation={1}
        />

        <View style={styles.filterButtonWrapper}>
          <IconButton
            icon="filter-variant"
            size={28}
            onPress={openFilter}
            accessibilityLabel="Filtruj"
          />
          {activeFilterCount > 0 && (
            <Badge style={styles.filterBadge}>
              {activeFilterCount > 99 ? '99+' : String(activeFilterCount)}
            </Badge>
          )}
        </View>
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>
          {searchInput ? 'Wyniki wyszukiwania' : 'Wszystkie transakcje'} ({getDisplayedTransactionCount()})
        </Text>
        <Button
          title={isLoadingTransactions ? "Ładowanie..." : "Odśwież"}
          onPress={handleRefresh}
          disabled={isLoadingTransactions || refreshing}
        />
      </View>

      {isLoadingTransactions ? (
        <TransactionSkeletonList count={6} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          renderSectionHeader={({ section: { title } }) => <DateSeparator title={title} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <RNModal
        isVisible={filterVisible}
        onBackdropPress={closeFilter}
        onBackButtonPress={closeFilter}
        style={{ margin: 0, justifyContent: 'flex-end' }}
        avoidKeyboard={true}
        useNativeDriver={true}
        propagateSwipe={true}
      >
        <View style={{ height: '90%', backgroundColor: 'white', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' }}>
          <FilterModal
            visible={filterVisible}
            initialFilters={initialFiltersMemo}
            categoriesOptions={categoriesOptions}
            tagsOptions={tagsOptions}
            allTransactions={allTransactions}
            onApply={applyFilterChanges}
            onResetAndApply={resetAndApplyFilters}
            onClose={closeFilter}
          />
        </View>
      </RNModal>
    </View>
  );
}

const createDefaultFilters = () => {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - DEFAULT_DAYS_BACK);

  return {
    categoryIds: [],
    tagIds: [],
    dateFrom: Math.floor(fromDate.getTime() / 1000),
    dateTo: Math.floor(to.getTime() / 1000),
    amountMin: null,
    amountMax: null,
    transactionType: 'all',
    recurring: 'all',
  };
};

function transactionPassesFilters(transaction, filters) {
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    if (!transaction.categoryId) return false;
    if (!filters.categoryIds.includes(transaction.categoryId)) return false;
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    const txTagIds = (transaction.tags || []).map(t => t.id);
    if (!filters.tagIds.every(tid => txTagIds.includes(tid))) return false;
  }

  if (typeof transaction.transactionDate === 'number') {
    if (filters.dateFrom && transaction.transactionDate < filters.dateFrom) return false;
    if (filters.dateTo && transaction.transactionDate > filters.dateTo) return false;
  }

  if (filters.transactionType === 'income' && !(transaction.amount > 0)) return false;
  if (filters.transactionType === 'expenditure' && !(transaction.amount < 0)) return false;

  const absAmount = Math.abs(Number(transaction.amount || 0));
  if (filters.amountMin != null && !isNaN(filters.amountMin)) {
    if (absAmount < Number(filters.amountMin)) return false;
  }
  if (filters.amountMax != null && !isNaN(filters.amountMax)) {
    if (absAmount > Number(filters.amountMax)) return false;
  }

  if (filters.recurring && filters.recurring !== 'all') {
    const txRecurring = Boolean(transaction.recurring || transaction.isRecurring || false);
    if (filters.recurring === 'yes' && !txRecurring) return false;
    if (filters.recurring === 'no' && txRecurring) return false;
  }

  return true;
}

function countActiveFilters(filters) {
  const defaultFilters = createDefaultFilters();
  let count = 0;
  if (filters.categoryIds && filters.categoryIds.length > 0) count++;
  if (filters.tagIds && filters.tagIds.length > 0) count++;
  if (filters.dateFrom !== defaultFilters.dateFrom || filters.dateTo !== defaultFilters.dateTo) count++;
  if ((filters.amountMin != null && filters.amountMin !== '') || (filters.amountMax != null && filters.amountMax !== '')) count++;
  if (filters.transactionType && filters.transactionType !== 'all') count++;
  if (filters.recurring && filters.recurring !== 'all') count++;
  return count;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  searchbar: { flex: 1, marginVertical: 8, borderRadius: 12 },
  filterButtonWrapper: { justifyContent: 'center', alignItems: 'center', marginLeft: 6, position: 'relative' },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#d32f2f',
    color: 'white',
    fontSize: 12,
    minWidth: 20,
    height: 20,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, backgroundColor: '#f8f9fa' },
  transactionsTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginBottom: 10 },
  listContainer: { paddingBottom: 75 },
  filterModalContainer: { margin: 12, backgroundColor: 'white', borderRadius: 12, padding: 0, maxHeight: '90%', overflow: 'hidden' },
});
