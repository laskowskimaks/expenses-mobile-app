import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Searchbar, Chip, IconButton, Menu } from 'react-native-paper';
import RNModal from 'react-native-modal';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

import { useDb } from '@/context/DbContext';
import TransactionItem from '@/components/TransactionItem';
import TransactionSkeleton from '@/components/TransactionSkeleton';
import { TransactionSkeletonList } from '@/components/TransactionSkeleton';
import DateSeparator from '@/components/DateSeparator';
import { getAllTransactionsSorted, deleteTransaction, formatCurrency } from '@/services/transactionService';
import { eventEmitter } from '@/utils/eventEmitter';
import useDebounce from '@/utils/useDebounce';

import FilterModal, { getActiveFiltersCount, createDefaultFilters } from '@/components/FilterModal';
import PeriodicActionChoiceModal from '@/components/PeriodicActionChoiceModal';
import { getAllCategories } from '@/services/categoryService';
import { getAllTags } from '@/services/tagService';

function getDateKey(tx) {
  const ts = typeof tx.transactionDate === 'number' ? tx.transactionDate * 1000 : Date.now();
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatDateEuropean(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  if (dateStr === todayStr) return 'Dzisiaj';
  if (dateStr === yesterdayStr) return 'Wczoraj';
  return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function flattenTransactionsForDateSort(transactions = []) {
  if (transactions.length === 0) return { data: [], stickyHeaderIndices: [] };
  const flatData = [];
  const stickyHeaderIndices = [];
  let lastDateKey = null;
  transactions.forEach(tx => {
    const currentDateKey = getDateKey(tx);
    if (currentDateKey !== lastDateKey) {
      stickyHeaderIndices.push(flatData.length);
      flatData.push({ type: 'separator', id: `sep-${currentDateKey}`, title: formatDateEuropean(tx.transactionDate) });
      lastDateKey = currentDateKey;
    }
    flatData.push({ type: 'transaction', ...tx });
  });
  return { data: flatData, stickyHeaderIndices };
}

function flattenTransactionsForAmountSort(transactions = []) {
  if (transactions.length === 0) return { data: [], stickyHeaderIndices: [] };

  const flatData = [];
  const stickyHeaderIndices = [];
  let lastDateKey = null;

  transactions.forEach(tx => {
    const currentDateKey = getDateKey(tx);
    if (currentDateKey !== lastDateKey) {
      stickyHeaderIndices.push(flatData.length);
      flatData.push({ type: 'separator', id: `sep-${currentDateKey}-${tx.id}`, title: formatDateEuropean(tx.transactionDate), });
      lastDateKey = currentDateKey;
    }
    flatData.push({ type: 'transaction', ...tx, });
  });

  return { data: flatData, stickyHeaderIndices };
}


export default function TransactionListScreen() {
  const { db } = useDb();
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchQuery = useDebounce(searchInput, 100);

  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);
  const [filterInitialScreen, setFilterInitialScreen] = useState(null);
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);

  const [appliedFilters, setAppliedFilters] = useState(() => createDefaultFilters());
  const [sortOption, setSortOption] = useState('date_desc');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [periodicModalVisible, setPeriodicModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentActionType, setCurrentActionType] = useState(null);

  const openSwipeableRef = useRef(null);

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

  const handleDataChange = useCallback(() => { fetchTransactions(false); }, []);
  useEffect(() => {
    eventEmitter.on('transactionAdded', handleDataChange);
    eventEmitter.on('periodicTransactionAdded', handleDataChange);
    eventEmitter.on('transactionEdited', handleDataChange);
    eventEmitter.on('transactionDeleted', handleDataChange);
    return () => {
      eventEmitter.off('transactionAdded', handleDataChange);
      eventEmitter.off('periodicTransactionAdded', handleDataChange);
      eventEmitter.off('transactionEdited', handleDataChange);
      eventEmitter.off('transactionDeleted', handleDataChange);
    };
  }, [handleDataChange]);

  const { listData, stickyHeaderIndices } = useMemo(() => {
    if (isLoadingTransactions) return { listData: [], stickyHeaderIndices: [] };

    const lowercasedQuery = debouncedSearchQuery.trim().toLowerCase();
    const filteredTransactions = allTransactions.filter(transaction => {
      const titleMatch = transaction.title?.toLowerCase().includes(lowercasedQuery) ?? false;
      const locationMatch = transaction.location?.toLowerCase().includes(lowercasedQuery) ?? false;
      const notesMatch = transaction.notes?.toLowerCase().includes(lowercasedQuery) ?? false;
      if (lowercasedQuery !== '' && !(titleMatch || locationMatch || notesMatch)) return false;
      return transactionPassesFilters(transaction, appliedFilters);
    });

    let sortedTransactions;
    let finalData;

    if (sortOption === 'date_desc') {
      sortedTransactions = [...filteredTransactions].sort((a, b) => (b.transactionDate || 0) - (a.transactionDate || 0));
      finalData = flattenTransactionsForDateSort(sortedTransactions);
    } else if (sortOption === 'date_asc') {
      sortedTransactions = [...filteredTransactions].sort((a, b) => (a.transactionDate || 0) - (b.transactionDate || 0));
      finalData = flattenTransactionsForDateSort(sortedTransactions);
    } else {
      sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const aa = Math.abs(Number(a.amount || 0));
        const ab = Math.abs(Number(b.amount || 0));
        if (sortOption === 'amount_desc') {
          if (ab === aa) return (b.transactionDate || 0) - (a.transactionDate || 0);
          return ab - aa;
        } else {
          if (ab === aa) return (b.transactionDate || 0) - (a.transactionDate || 0);
          return aa - ab;
        }
      });
      finalData = flattenTransactionsForAmountSort(sortedTransactions);
    }

    const preComputedTransactions = finalData.data.map(item => {
      if (item.type === 'transaction') {
        return {
          ...item,
          amountFormatted: formatCurrency(item.amount),
        };
      }
      return item;
    });

    return { listData: preComputedTransactions, stickyHeaderIndices: finalData.stickyHeaderIndices };

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

  const normalizeCategory = (cat) => { if (!cat) return null; return { id: cat.id ?? cat.categoryId ?? cat._id ?? null, name: cat.name ?? cat.label ?? cat.categoryName ?? '', iconName: cat.iconName ?? cat.icon ?? cat.categoryIcon ?? null, color: cat.color ?? cat.backgroundColor ?? cat.categoryColor ?? '#cccccc' }; };
  const normalizeTag = (tag) => { if (!tag) return null; return { id: tag.id ?? tag.tagId ?? tag._id ?? null, name: tag.name ?? tag.label ?? tag.tagName ?? '', color: tag.color ?? '#cccccc' }; };
  const loadFilterOptions = async () => { try { const [catsRaw, tagsRaw] = await Promise.all([getAllCategories(db), getAllTags(db)]); const cats = (catsRaw || []).map(normalizeCategory).filter(Boolean); const tags = (tagsRaw || []).map(normalizeTag).filter(Boolean); setCategoriesOptions(cats); setTagsOptions(tags); } catch (error) { console.error('[TransactionListScreen] Błąd podczas wczytywania opcji filtrów:', error); } };
  const handleRefresh = async () => { setSearchInput(''); await fetchTransactions(true); };
  const onRefresh = async () => { setRefreshing(true); setSearchInput(''); await fetchTransactions(false); setRefreshing(false); };

  const handleEdit = useCallback((transaction) => {
    if (transaction.periodicTransactionId) {
      setSelectedTransaction(transaction);
      setCurrentActionType('edit');
      setPeriodicModalVisible(true);
    } else {
      router.push({ pathname: '/(modals)/AddTransactionModal', params: { transactionId: transaction.id, editMode: 'single' } });
    }
  }, [router]);

  const handleDelete = useCallback((transaction) => {
    if (transaction.periodicTransactionId) {
      setSelectedTransaction(transaction);
      setCurrentActionType('delete');
      setPeriodicModalVisible(true);
    } else {
      Alert.alert('Potwierdź usunięcie', 'Czy na pewno chcesz trwale usunąć tę transakcję?', [{ text: 'Anuluj', style: 'cancel' }, { text: 'Usuń', style: 'destructive', onPress: async () => { const result = await deleteTransaction(db, transaction.id, { mode: 'single' }); if (result.success) { eventEmitter.emit('transactionDeleted', { id: transaction.id }); } else { Alert.alert('Błąd', result.message || 'Nie udało się usunąć transakcji.'); } } }]);
    }
  }, [db]);

  const handlePeriodicActionSelect = async (mode) => { setPeriodicModalVisible(false); if (!selectedTransaction || !currentActionType) return; if (currentActionType === 'edit') { router.push({ pathname: '/(modals)/AddTransactionModal', params: { transactionId: selectedTransaction.id, editMode: mode }, }); } else if (currentActionType === 'delete') { const result = await deleteTransaction(db, selectedTransaction.id, { mode }); if (result.success) { eventEmitter.emit('transactionDeleted', { id: selectedTransaction.id, mode }); } else { Alert.alert('Błąd', result.message || 'Nie udało się usunąć transakcji.'); } } setSelectedTransaction(null); setCurrentActionType(null); };
  const getDisplayedTransactionCount = () => listData.filter(item => item.type === 'transaction').length;
  const renderEmptyComponent = () => { if (allTransactions.length > 0 && debouncedSearchQuery !== '') { return (<View style={styles.emptyContainer}><Text style={styles.emptyText}>Brak wyników dla frazy "{debouncedSearchQuery}"</Text></View>); } return (<View style={styles.emptyContainer}><Text style={styles.emptyText}>Brak transakcji do wyświetlenia</Text></View>); };
  const openFilter = useCallback((targetScreen = 'main') => { setFilterInitialScreen(targetScreen || 'main'); setFilterVisible(true); }, []);
  const closeFilter = useCallback(() => { setFilterVisible(false); setFilterInitialScreen(null); }, []);
  const applyFilterChanges = useCallback((newFilters) => { setAppliedFilters(newFilters); setFilterVisible(false); setFilterInitialScreen(null); }, []);
  const resetAndApplyFilters = useCallback(() => { const defaults = createDefaultFilters(); setAppliedFilters(defaults); setFilterVisible(false); }, []);
  const defaults = useMemo(() => createDefaultFilters(), []);
  const removeCategoriesGroup = () => setAppliedFilters(prev => ({ ...prev, categoryIds: [] })); const removeTagsGroup = () => setAppliedFilters(prev => ({ ...prev, tagIds: [] })); const removeDateGroup = () => setAppliedFilters(prev => ({ ...prev, dateFrom: defaults.dateFrom, dateTo: defaults.dateTo })); const removeAmountGroup = () => setAppliedFilters(prev => ({ ...prev, amountMin: null, amountMax: null })); const removeTypeGroup = () => setAppliedFilters(prev => ({ ...prev, transactionType: 'all' })); const removePeriodicGroup = () => setAppliedFilters(prev => ({ ...prev, periodic: 'all' })); const clearAllFilters = () => setAppliedFilters(createDefaultFilters()); const activeFilterCount = getActiveFiltersCount(appliedFilters);
  const groupedChips = useMemo(() => { const out = []; if (appliedFilters.categoryIds?.length > 0) out.push({ key: 'categories', label: `Kategorie (${appliedFilters.categoryIds.length})`, onClose: removeCategoriesGroup }); if (appliedFilters.tagIds?.length > 0) out.push({ key: 'tags', label: `Tagi (${appliedFilters.tagIds.length})`, onClose: removeTagsGroup }); if (appliedFilters.dateFrom !== defaults.dateFrom || appliedFilters.dateTo !== defaults.dateTo) { const from = appliedFilters.dateFrom ? formatDateEuropean(appliedFilters.dateFrom) : null; const to = appliedFilters.dateTo ? formatDateEuropean(appliedFilters.dateTo) : null; const label = from && to ? `${from} — ${to}` : (from ? `od ${from}` : (to ? `do ${to}` : 'Zakres dat')); out.push({ key: 'date', label, onClose: removeDateGroup }); } if (appliedFilters.amountMin != null || appliedFilters.amountMax != null) { const min = appliedFilters.amountMin != null ? `${appliedFilters.amountMin} zł` : null; const max = appliedFilters.amountMax != null ? `${appliedFilters.amountMax} zł` : null; const label = min && max ? `${min} — ${max}` : (min ? `>= ${min}` : `<= ${max}`); out.push({ key: 'amount', label, onClose: removeAmountGroup }); } if (appliedFilters.transactionType && appliedFilters.transactionType !== 'all') { const label = appliedFilters.transactionType === 'income' ? 'Wpływy' : 'Wydatki'; out.push({ key: 'type', label, onClose: removeTypeGroup }); } if (appliedFilters.periodic && appliedFilters.periodic !== 'all') { const label = appliedFilters.periodic === 'yes' ? 'Tylko cykliczne' : 'Bez cyklicznych'; out.push({ key: 'periodic', label, onClose: removePeriodicGroup }); } return out; }, [appliedFilters, defaults]);
  const mapChipKeyToScreen = (key) => { switch (key) { case 'categories': return 'categories'; case 'tags': return 'tags'; case 'date': return 'date'; case 'amount': return 'price'; case 'type': return 'type'; case 'periodic': return 'type'; default: return 'main'; } };
  const openSortMenu = () => setSortMenuVisible(true); const closeSortMenu = () => setSortMenuVisible(false); const selectSort = (option) => { setSortOption(option); closeSortMenu(); };
  const currentSortLabel = useMemo(() => { switch (sortOption) { case 'date_desc': return 'Data (najnowsze)'; case 'date_asc': return 'Data (najstarsze)'; case 'amount_desc': return 'Kwota (największe)'; case 'amount_asc': return 'Kwota (najmniejsze)'; default: return ''; } }, [sortOption]);

  const renderItem = useCallback(({ item }) => {
    if (item.type === 'separator') {
      return <DateSeparator title={item.title} />;
    }
    return (
      <TransactionItem
        transaction={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        openSwipeableRef={openSwipeableRef}
      />
    );
  }, [handleEdit, handleDelete]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);
  const getItemType = useCallback((item) => item.type, []);
  const renderPlaceholder = useCallback(() => <TransactionSkeleton variant="compact" />, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Searchbar placeholder="Szukaj" onChangeText={setSearchInput} value={searchInput} style={styles.searchbar} elevation={1} />
        <View style={styles.sortMenuWrapper}>
          <Menu visible={sortMenuVisible} onDismiss={closeSortMenu} anchor={<IconButton icon="sort" size={26} onPress={openSortMenu} accessibilityLabel="Sortuj" />}>
            <Menu.Item onPress={() => selectSort('date_desc')} title="Data (najnowsze)" leadingIcon="arrow-down" titleStyle={sortOption === 'date_desc' ? { fontWeight: 'bold', color: '#2196F3' } : {}} />
            <Menu.Item onPress={() => selectSort('date_asc')} title="Data (najstarsze)" leadingIcon="arrow-up" titleStyle={sortOption === 'date_asc' ? { fontWeight: 'bold', color: '#2196F3' } : {}} />
            <Menu.Item onPress={() => selectSort('amount_desc')} title="Kwota (największe pierwsze)" leadingIcon="arrow-down" titleStyle={sortOption === 'amount_desc' ? { fontWeight: 'bold', color: '#2196F3' } : {}} />
            <Menu.Item onPress={() => selectSort('amount_asc')} title="Kwota (najmniejsze pierwsze)" leadingIcon="arrow-up" titleStyle={sortOption === 'amount_asc' ? { fontWeight: 'bold', color: '#2196F3' } : {}} />
          </Menu>
        </View>
      </View>

      <View style={styles.filterActionsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <Chip icon="filter-variant" mode="outlined" onPress={() => openFilter('main')} onClose={activeFilterCount > 0 ? clearAllFilters : undefined} closeIcon="close" style={styles.chip} compact>
            <Text style={styles.chipText}>Filtruj{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
          </Chip>
          {groupedChips.length === 0 ? (<View style={styles.noChipsPlaceholder}><Text style={styles.noChipsText}>Brak aktywnych filtrów</Text></View>) : (
            groupedChips.map(ch => (<Chip key={ch.key} mode="outlined" onPress={() => openFilter(mapChipKeyToScreen(ch.key))} onClose={ch.onClose} closeIcon="close" style={styles.chip} compact><Text style={styles.chipText}>{ch.label}</Text></Chip>))
          )}
        </ScrollView>
        <IconButton
          icon="refresh"
          size={26}
          onPress={handleRefresh}
          disabled={isLoadingTransactions || refreshing}
          style={styles.refreshButton}
        />
      </View>
      {isLoadingTransactions ? (<TransactionSkeletonList count={6} />) : (
        <FlashList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={110}
          stickyHeaderIndices={stickyHeaderIndices}
          renderPlaceholder={renderPlaceholder}
          getItemType={getItemType}
        />
      )}
      <RNModal isVisible={filterVisible} onBackdropPress={closeFilter} onBackButtonPress={closeFilter} style={{ margin: 0, justifyContent: 'flex-end' }} avoidKeyboard={true} useNativeDriver={true} propagateSwipe={true}>
        <View style={{ height: '90%', backgroundColor: 'white', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' }}>
          <FilterModal visible={filterVisible} initialFilters={appliedFilters} initialScreen={filterInitialScreen || 'main'} categoriesOptions={categoriesOptions} tagsOptions={tagsOptions} allTransactions={allTransactions} onApply={applyFilterChanges} onResetAndApply={resetAndApplyFilters} onClose={closeFilter} />
        </View>
      </RNModal>
      <PeriodicActionChoiceModal visible={periodicModalVisible} onDismiss={() => setPeriodicModalVisible(false)} onSelect={handlePeriodicActionSelect} actionType={currentActionType} />
    </View>
  );
}

function transactionPassesFilters(transaction, filters) {
  if (filters.categoryIds?.length > 0) { if (!transaction.categoryId || !filters.categoryIds.includes(transaction.categoryId)) return false; }
  if (filters.tagIds?.length > 0) { const txTagIds = (transaction.tags || []).map(t => t.id); if (!filters.tagIds.every(tid => txTagIds.includes(tid))) return false; }
  if (typeof transaction.transactionDate === 'number') { if (filters.dateFrom && transaction.transactionDate < filters.dateFrom) return false; if (filters.dateTo && transaction.transactionDate > filters.dateTo) return false; }
  if (filters.transactionType === 'income' && !(transaction.amount > 0)) return false;
  if (filters.transactionType === 'expenditure' && !(transaction.amount < 0)) return false;
  const absAmount = Math.abs(Number(transaction.amount || 0));
  if (filters.amountMin != null && !isNaN(filters.amountMin) && absAmount < Number(filters.amountMin)) return false;
  if (filters.amountMax != null && !isNaN(filters.amountMax) && absAmount > Number(filters.amountMax)) return false;
  if (filters.periodic && filters.periodic !== 'all') { const txPeriodic = Boolean(transaction.periodicTransactionId); if (filters.periodic === 'yes' && !txPeriodic) return false; if (filters.periodic === 'no' && txPeriodic) return false; }
  return true;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  searchbar: { flex: 1, marginVertical: 8, borderRadius: 12 },
  sortMenuWrapper: { marginLeft: 4, marginRight: 6 },

  filterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingVertical: 4,
  },
  chipsScroll: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 16,
  },
  refreshButton: {
    marginLeft: 'auto',
    marginRight: 6,
  },

  chip: { marginRight: 8, height: 34, justifyContent: 'center' },
  chipText: { fontSize: 13, color: '#111' },
  noChipsPlaceholder: { justifyContent: 'center', height: 34 },
  noChipsText: { color: '#7f8c8d', fontSize: 13 },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, backgroundColor: '#f8f9fa' },
  transactionsTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
  sortLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 },
  emptyText: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginBottom: 10 },
  listContainer: { paddingBottom: 75 },
});