import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { useTheme, Text, Button, IconButton, Badge } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import RNModal from 'react-native-modal';
import { useDb } from '@/context/DbContext';
import { getAllPeriodicTransactions } from '@/services/periodicTransactionService';
import { getAllCategories } from '@/services/categoryService';
import { getAllTags } from '@/services/tagService';
import PeriodicTransactionItem from './components/PeriodicTransactionItem';
import SearchBar from '@/components/SearchBar'; 
import useDebounce from '@/utils/useDebounce'; 
import PeriodicFilterModal, { createDefaultPeriodicFilters } from './PeriodicFilterModal';
import { getCurrentTimestamp } from '@/utils/dateUtils';

const getActiveFiltersCount = (filters) => {
    const defaults = createDefaultPeriodicFilters();
    let count = 0;
    if (filters.sort !== defaults.sort) count++;
    if (filters.status !== defaults.status) count++;
    if (filters.categoryIds?.length > 0) count++;
    if (filters.tagIds?.length > 0) count++;
    if (filters.transactionType !== 'all') count++;
    if (filters.amountMin != null || filters.amountMax != null) count++;
    if (filters.dateFrom != null || filters.dateTo != null) count++;
    return count;
};

export default function ManagePeriodicTransactionsModal() {
    const theme = useTheme();
    const router = useRouter();
    const { db } = useDb();
    
    const [allTransactions, setAllTransactions] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearchQuery = useDebounce(searchInput, 300);

    const [filterVisible, setFilterVisible] = useState(false);
    const [categoriesOptions, setCategoriesOptions] = useState([]);
    const [tagsOptions, setTagsOptions] = useState([]);
    const [appliedFilters, setAppliedFilters] = useState(() => createDefaultPeriodicFilters());

    const loadOptions = useCallback(async () => {
        if(db) {
            const [cats, tags] = await Promise.all([getAllCategories(db), getAllTags(db)]);
            setCategoriesOptions(cats);
            setTagsOptions(tags);
        }
    }, [db]);

    useFocusEffect(
        useCallback(() => {
            const fetchTransactions = async () => {
                if (db) {
                    const data = await getAllPeriodicTransactions(db);
                    setAllTransactions(data);
                }
            };
            fetchTransactions();
            loadOptions();
        }, [db, loadOptions])
    );

    const filteredAndSortedTransactions = useMemo(() => {
        const currentTimestamp = getCurrentTimestamp();
        let filtered = [...allTransactions];
        
        // Wyszukiwanie
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter(tx => 
                tx.title.toLowerCase().includes(query) ||
                (tx.notes && tx.notes.toLowerCase().includes(query))
            );
        }

        // Filtrowanie
        const { status, categoryIds, tagIds, transactionType, amountMin, amountMax, dateFrom, dateTo } = appliedFilters;
        if (status !== 'all') {
            filtered = filtered.filter(tx => (status === 'active' ? !tx.endDate || tx.endDate >= currentTimestamp : tx.endDate && tx.endDate < currentTimestamp));
        }
        if (categoryIds?.length > 0) {
            filtered = filtered.filter(tx => tx.categoryId && categoryIds.includes(tx.categoryId));
        }
        if (tagIds?.length > 0) {
            filtered = filtered.filter(tx => tx.tags.some(tag => tagIds.includes(tag.id)));
        }
        if (transactionType !== 'all') {
             filtered = filtered.filter(tx => transactionType === 'income' ? tx.amount > 0 : tx.amount < 0);
        }
        if (amountMin) {
            filtered = filtered.filter(tx => Math.abs(tx.amount) >= parseFloat(amountMin));
        }
        if (amountMax) {
            filtered = filtered.filter(tx => Math.abs(tx.amount) <= parseFloat(amountMax));
        }
        if(dateFrom) {
            filtered = filtered.filter(tx => tx.startDate >= dateFrom);
        }
        if(dateTo) {
             filtered = filtered.filter(tx => tx.startDate <= dateTo);
        }

        // Sortowanie
        const { sort } = appliedFilters;
        filtered.sort((a, b) => {
            switch(sort) {
                case 'next_occurrence_asc': return a.nextOccurrenceDate - b.nextOccurrenceDate;
                case 'next_occurrence_desc': return b.nextOccurrenceDate - a.nextOccurrenceDate;
                case 'start_date_desc': return b.startDate - a.startDate;
                case 'start_date_asc': return a.startDate - b.startDate;
                case 'amount_desc': return Math.abs(b.amount) - Math.abs(a.amount);
                case 'amount_asc': return Math.abs(a.amount) - Math.abs(b.amount);
                case 'occurrences_desc': return (b.pastOccurrences || 0) - (a.pastOccurrences || 0);
                case 'occurrences_asc': return (a.pastOccurrences || 0) - (b.pastOccurrences || 0);
                case 'title_asc': return a.title.localeCompare(b.title);
                default: return 0;
            }
        });

        return filtered;
    }, [allTransactions, debouncedSearchQuery, appliedFilters]);

    const activeFiltersCount = useMemo(() => getActiveFiltersCount(appliedFilters), [appliedFilters]);

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {allTransactions.length > 0 ? 'Brak wyników dla wybranych filtrów' : 'Brak transakcji cyklicznych'}
            </Text>
        </View>
    );

    return (
        <>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.headerTitle}>Transakcje cykliczne</Text>
                     <IconButton icon="close" onPress={() => router.back()} style={styles.closeButton} />
                </View>
                
                <View style={styles.controlsContainer}>
                    <View style={{flex: 1}}>
                         <SearchBar 
                            value={searchInput}
                            onChangeText={setSearchInput}
                            placeholder="Szukaj..."
                        />
                    </View>
                    <View>
                        <IconButton
                            icon="filter-variant"
                            size={28}
                            onPress={() => setFilterVisible(true)}
                        />
                        {activeFiltersCount > 0 && (
                            <Badge style={styles.badge} size={16}>{activeFiltersCount}</Badge>
                        )}
                    </View>
                </View>

                <FlatList
                    data={filteredAndSortedTransactions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <PeriodicTransactionItem transaction={item} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyComponent}
                />

                <RNModal isVisible={filterVisible} onBackdropPress={() => setFilterVisible(false)} onBackButtonPress={() => setFilterVisible(false)} style={{ margin: 0 }} avoidKeyboard>
                    <PeriodicFilterModal 
                        initialFilters={appliedFilters}
                        onApply={filters => { setAppliedFilters(filters); setFilterVisible(false); }}
                        onClose={() => setFilterVisible(false)}
                        categoriesOptions={categoriesOptions}
                        tagsOptions={tagsOptions}
                    />
                </RNModal>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '95%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: 8,
        top: 8,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        paddingHorizontal: 16,
    },
});