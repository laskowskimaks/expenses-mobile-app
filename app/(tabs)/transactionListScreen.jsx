import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  SectionList,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Searchbar, Chip, IconButton, Menu } from 'react-native-paper';
import RNModal from 'react-native-modal';

import { useDb } from '@/context/DbContext';
import TransactionItem from '@/components/TransactionItem';
import { TransactionSkeletonList } from '@/components/TransactionSkeleton';
import DateSeparator from '@/components/DateSeparator';
import { getAllTransactionsSorted } from '@/services/transactionService';
import { eventEmitter } from '@/utils/eventEmitter';
import useDebounce from '@/utils/useDebounce';

import FilterModal, { getActiveFiltersCount, createDefaultFilters } from '@/components/FilterModal';
import { getAllCategories } from '@/services/categoryService';
import { getAllTags } from '@/services/tagService';

// zwraca klucz daty YYYY-MM-DD (bazuje na transaction.transactionDate w sekundach)
function getDateKey(tx) {
  const ts = typeof tx.transactionDate === 'number' ? tx.transactionDate * 1000 : Date.now();
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// formatuje datę transakcji na czytelny format 
function formatDateEuropean(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Porównaj daty (bez godzin)
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();

  if (dateStr === todayStr) {
    return 'Dzisiaj';
  } else if (dateStr === yesterdayStr) {
    return 'Wczoraj';
  } else {
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

// grupowanie po dacie zachowując kolejność (używane przy sortowaniu po dacie)
function groupByDatePreserveOrder(transactions = []) {
  const sectionsMap = new Map();
  const sectionsOrder = [];

  transactions.forEach(tx => {
    const key = getDateKey(tx);
    if (!sectionsMap.has(key)) {
      const ts = typeof tx.transactionDate === 'number' ? tx.transactionDate : null;
      const title = ts ? formatDateEuropean(ts) : '';
      const section = { title, data: [tx] };
      sectionsMap.set(key, section);
      sectionsOrder.push(key);
    } else {
      sectionsMap.get(key).data.push(tx);
    }
  });

  return sectionsOrder.map(key => sectionsMap.get(key));
}

// sortowanie globalne po kwocie, ale z zachowaniem separatorów dat
function createGlobalAmountSortWithDateSeparators(transactions = [], sortOption = 'amount_desc') {
  if (transactions.length === 0) return [];

  // Sortuj wszystkie transakcje globalnie po kwocie
  const sorted = [...transactions].sort((a, b) => {
    const aa = Math.abs(Number(a.amount || 0));
    const ab = Math.abs(Number(b.amount || 0));

    if (sortOption === 'amount_desc') {
      if (ab === aa) {
        // Jeśli kwoty równe, sortuj po dacie (najnowsze pierwsze)
        const ta = typeof a.transactionDate === 'number' ? a.transactionDate : 0;
        const tb = typeof b.transactionDate === 'number' ? b.transactionDate : 0;
        return tb - ta;
      }
      return ab - aa;
    } else {
      if (ab === aa) {
        // Jeśli kwoty równe, sortuj po dacie (najnowsze pierwsze)  
        const ta = typeof a.transactionDate === 'number' ? a.transactionDate : 0;
        const tb = typeof b.transactionDate === 'number' ? b.transactionDate : 0;
        return tb - ta;
      }
      return aa - ab;
    }
  });

  // Przygotuj flat data z flagami dla separatorów
  const flatData = [];
  let lastDateKey = null;
  const usedSeparatorKeys = new Set();

  sorted.forEach((tx, index) => {
    const currentDateKey = getDateKey(tx);

    if (currentDateKey !== lastDateKey && !usedSeparatorKeys.has(currentDateKey)) {
      flatData.push({
        type: 'separator',
        id: `sep-${currentDateKey}`,
        dateKey: currentDateKey,
        title: formatDateEuropean(tx.transactionDate),
      });
      usedSeparatorKeys.add(currentDateKey);
      lastDateKey = currentDateKey;
    }

    flatData.push({
      type: 'transaction',
      ...tx,
      id: tx.id ?? tx._id ?? `tx-${currentDateKey}-${index}`,
    });
  });

  return flatData;
}

export default function TransactionListScreen() {
  const { db } = useDb();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchQuery = useDebounce(searchInput, 100);

  const [allTransactions, setAllTransactions] = useState([]);
  const [sections, setSections] = useState([]);
  const [flatData, setFlatData] = useState([]); // sortowanie po kwocie -> używamy FlatList
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // filter modal
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterInitialScreen, setFilterInitialScreen] = useState(null);
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);

  const [appliedFilters, setAppliedFilters] = useState(() => createDefaultFilters());

  // sortowanie: date_desc, date_asc, amount_desc, amount_asc
  const [sortOption, setSortOption] = useState('date_desc');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

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

    let filteredTransactions = allTransactions.filter(transaction => {
      const titleMatch = transaction.title ? transaction.title.toLowerCase().includes(lowercasedQuery) : false;
      const locationMatch = transaction.location ? transaction.location.toLowerCase().includes(lowercasedQuery) : false;
      const notesMatch = transaction.notes ? transaction.notes.toLowerCase().includes(lowercasedQuery) : false;

      if (lowercasedQuery !== '' && !(titleMatch || locationMatch || notesMatch)) return false;
      return transactionPassesFilters(transaction, appliedFilters);
    });

    if (sortOption === 'date_desc') {
      filteredTransactions.sort((a, b) => {
        const ta = typeof a.transactionDate === 'number' ? a.transactionDate : 0;
        const tb = typeof b.transactionDate === 'number' ? b.transactionDate : 0;
        return tb - ta;
      });
      const grouped = groupByDatePreserveOrder(filteredTransactions);
      setSections(grouped);
      setFlatData([]);

    } else if (sortOption === 'date_asc') {
      filteredTransactions.sort((a, b) => {
        const ta = typeof a.transactionDate === 'number' ? a.transactionDate : 0;
        const tb = typeof b.transactionDate === 'number' ? b.transactionDate : 0;
        return ta - tb;
      });
      const grouped = groupByDatePreserveOrder(filteredTransactions);
      setSections(grouped);
      setFlatData([]);

    } else if (sortOption === 'amount_desc' || sortOption === 'amount_asc') {
      const globalSorted = createGlobalAmountSortWithDateSeparators(filteredTransactions, sortOption);
      setFlatData(globalSorted);
      setSections([]);

    }
  }, [debouncedSearchQuery, allTransactions, appliedFilters, isLoadingTransactions, sortOption]);

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
      color: tag.color ?? '#cccccc',
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

  const getDisplayedTransactionCount = () => {
    if (flatData && flatData.length > 0) {
      return flatData.filter(item => item.type === 'transaction').length;
    }
    return sections.reduce((acc, s) => acc + s.data.length, 0);
  };

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

  const openFilter = useCallback((targetScreen = 'main') => {
    setFilterInitialScreen(targetScreen || 'main');
    setFilterVisible(true);
  }, []);
  const closeFilter = useCallback(() => {
    setFilterVisible(false);
    setFilterInitialScreen(null);
  }, []);

  const applyFilterChanges = useCallback((newFilters) => {
    setAppliedFilters(newFilters);
    setFilterVisible(false);
    setFilterInitialScreen(null);
  }, []);

  const resetAndApplyFilters = useCallback(() => {
    const defaults = createDefaultFilters();
    setAppliedFilters(defaults);
    setFilterVisible(false);
  }, []);

  const defaults = useMemo(() => createDefaultFilters(), []);

  const removeCategoriesGroup = () => {
    setAppliedFilters(prev => ({ ...prev, categoryIds: [] }));
  };
  const removeTagsGroup = () => {
    setAppliedFilters(prev => ({ ...prev, tagIds: [] }));
  };
  const removeDateGroup = () => {
    setAppliedFilters(prev => ({ ...prev, dateFrom: defaults.dateFrom, dateTo: defaults.dateTo }));
  };
  const removeAmountGroup = () => {
    setAppliedFilters(prev => ({ ...prev, amountMin: null, amountMax: null }));
  };
  const removeTypeGroup = () => {
    setAppliedFilters(prev => ({ ...prev, transactionType: 'all' }));
  };
  const removeRecurringGroup = () => {
    setAppliedFilters(prev => ({ ...prev, recurring: 'all' }));
  };
  const clearAllFilters = () => {
    setAppliedFilters(createDefaultFilters());
  };

  const activeFilterCount = getActiveFiltersCount(appliedFilters);

  const groupedChips = useMemo(() => {
    const out = [];

    if (appliedFilters.categoryIds && appliedFilters.categoryIds.length > 0) {
      out.push({
        key: 'categories',
        label: `Kategorie (${appliedFilters.categoryIds.length})`,
        onClose: removeCategoriesGroup,
      });
    }

    if (appliedFilters.tagIds && appliedFilters.tagIds.length > 0) {
      out.push({
        key: 'tags',
        label: `Tagi (${appliedFilters.tagIds.length})`,
        onClose: removeTagsGroup,
      });
    }

    if (appliedFilters.dateFrom !== defaults.dateFrom || appliedFilters.dateTo !== defaults.dateTo) {
      const from = appliedFilters.dateFrom ? formatDateEuropean(appliedFilters.dateFrom) : null;
      const to = appliedFilters.dateTo ? formatDateEuropean(appliedFilters.dateTo) : null;
      const label = from && to ? `${from} — ${to}` : (from ? `od ${from}` : (to ? `do ${to}` : 'Zakres dat'));
      out.push({
        key: 'date',
        label,
        onClose: removeDateGroup,
      });
    }

    if (appliedFilters.amountMin != null || appliedFilters.amountMax != null) {
      const min = appliedFilters.amountMin != null ? `${appliedFilters.amountMin} zł` : null;
      const max = appliedFilters.amountMax != null ? `${appliedFilters.amountMax} zł` : null;
      const label = min && max ? `${min} — ${max}` : (min ? `>= ${min}` : `<= ${max}`);
      out.push({
        key: 'amount',
        label,
        onClose: removeAmountGroup,
      });
    }

    if (appliedFilters.transactionType && appliedFilters.transactionType !== 'all') {
      const label = appliedFilters.transactionType === 'income' ? 'Wpływy' : 'Wydatki';
      out.push({
        key: 'type',
        label,
        onClose: removeTypeGroup,
      });
    }

    if (appliedFilters.recurring && appliedFilters.recurring !== 'all') {
      const label = appliedFilters.recurring === 'yes' ? 'Tylko cykliczne' : 'Bez cyklicznych';
      out.push({
        key: 'recurring',
        label,
        onClose: removeRecurringGroup,
      });
    }

    return out;
  }, [appliedFilters, defaults]);

  const mapChipKeyToScreen = (key) => {
    switch (key) {
      case 'categories': return 'categories';
      case 'tags': return 'tags';
      case 'date': return 'date';
      case 'amount': return 'price';
      case 'type': return 'type';
      case 'recurring': return 'type';
      default: return 'main';
    }
  };

  // menu
  const openSortMenu = () => setSortMenuVisible(true);
  const closeSortMenu = () => setSortMenuVisible(false);
  const selectSort = (option) => {
    setSortOption(option);
    closeSortMenu();
  };

  const currentSortLabel = useMemo(() => {
    switch (sortOption) {
      case 'date_desc': return 'Data (najnowsze)';
      case 'date_asc': return 'Data (najstarsze)';
      case 'amount_desc': return 'Kwota (największe)';
      case 'amount_asc': return 'Kwota (najmniejsze)';
      default: return '';
    }
  }, [sortOption]);

  const renderFlatItem = ({ item, index }) => {
    if (item.type === 'separator') {
      return <DateSeparator title={item.title} />;
    }

    if (item.type === 'transaction') {
      return <TransactionItem transaction={item} />;
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Szukaj"
          onChangeText={setSearchInput}
          value={searchInput}
          style={styles.searchbar}
          elevation={1}
        />

        <View style={styles.sortMenuWrapper}>
          <Menu
            visible={sortMenuVisible}
            onDismiss={closeSortMenu}
            anchor={
              <IconButton
                icon="sort"
                size={26}
                onPress={openSortMenu}
                accessibilityLabel="Sortuj"
              />
            }
          >
            <Menu.Item
              onPress={() => selectSort('date_desc')}
              title="Data (najnowsze)"
              leadingIcon={sortOption === "arrow-down"}
              titleStyle={sortOption === 'date_desc' ? { fontWeight: 'bold', color: '#2196F3' } : {}}
            />
            <Menu.Item
              onPress={() => selectSort('date_asc')}
              title="Data (najstarsze)"
              leadingIcon={sortOption === "arrow-up"}
              titleStyle={sortOption === 'date_asc' ? { fontWeight: 'bold', color: '#2196F3' } : {}}
            />
            <Menu.Item
              onPress={() => selectSort('amount_desc')}
              title="Kwota (największe pierwsze)"
              leadingIcon={sortOption === "arrow-down"}
              titleStyle={sortOption === 'amount_desc' ? { fontWeight: 'bold', color: '#2196F3' } : {}}
            />
            <Menu.Item
              onPress={() => selectSort('amount_asc')}
              title="Kwota (najmniejsze pierwsze)"
              leadingIcon={sortOption === "arrow-up"}
              titleStyle={sortOption === 'amount_asc' ? { fontWeight: 'bold', color: '#2196F3' } : {}}
            />
          </Menu>
        </View>
      </View>

      <View style={styles.chipsRowWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <Chip
            icon="filter-variant"
            mode="outlined"
            onPress={() => openFilter('main')}
            onClose={activeFilterCount > 0 ? clearAllFilters : undefined}
            closeIcon="close"
            style={styles.chip}
            compact
          >
            <Text style={styles.chipText}>Filtruj{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
          </Chip>

          {groupedChips.length === 0 ? (
            <View style={styles.noChipsPlaceholder}>
              <Text style={styles.noChipsText}>Brak aktywnych filtrów</Text>
            </View>
          ) : (
            groupedChips.map(ch => (
              <Chip
                key={ch.key}
                mode="outlined"
                onPress={() => openFilter(mapChipKeyToScreen(ch.key))}
                onClose={ch.onClose}
                closeIcon="close"
                style={styles.chip}
                compact
              >
                <Text style={styles.chipText}>{ch.label}</Text>
              </Chip>
            ))
          )}

          <View style={{ width: 8 }} />
        </ScrollView>
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>
          {searchInput ? 'Wyniki wyszukiwania' : 'Wszystkie transakcje'} ({getDisplayedTransactionCount()})
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.sortLabel}>{currentSortLabel}</Text>
          <Button
            title={isLoadingTransactions ? "Ładowanie..." : "Odśwież"}
            onPress={handleRefresh}
            disabled={isLoadingTransactions || refreshing}
          />
        </View>
      </View>

      {isLoadingTransactions ? (
        <TransactionSkeletonList count={6} />
      ) : (
        <>
          {flatData && flatData.length > 0 ? (
            <FlatList
              data={flatData}
              keyExtractor={(item, index) => `${item.id ?? item._id ?? index}`}
              renderItem={renderFlatItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={renderEmptyComponent}
              showsVerticalScrollIndicator={false}
              stickyHeaderIndices={flatData.map((item, index) => item.type === 'separator' ? index : null).filter(index => index !== null)}
            />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item, index) => `${item.id ?? item._id ?? index}`}
              renderItem={({ item }) => <TransactionItem transaction={item} />}
              renderSectionHeader={({ section: { title } }) => <DateSeparator title={title} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              stickySectionHeadersEnabled={true}
              ListEmptyComponent={renderEmptyComponent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          )}
        </>
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
            initialFilters={appliedFilters}
            initialScreen={filterInitialScreen || 'main'}
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
    const txRecurring = Boolean(transaction.isFromPeriodic);
    if (filters.recurring === 'yes' && !txRecurring) return false;
    if (filters.recurring === 'no' && txRecurring) return false;
  }

  return true;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  searchbar: { flex: 1, marginVertical: 8, borderRadius: 12 },
  sortMenuWrapper: { marginLeft: 4, marginRight: 6 },
  chipsRowWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipsScroll: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  chip: {
    marginRight: 8,
    height: 34,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    color: '#111',
  },
  noChipsPlaceholder: {
    justifyContent: 'center',
    height: 34,
  },
  noChipsText: {
    color: '#7f8c8d',
    fontSize: 13,
  },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, backgroundColor: '#f8f9fa' },
  transactionsTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
  sortLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginBottom: 10 },
  listContainer: { paddingBottom: 75 },
});
