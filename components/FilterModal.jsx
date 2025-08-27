import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    TextInput,
    ScrollView,
    Platform,
    SafeAreaView,
} from 'react-native';
import {
    Avatar,
    Checkbox,
    Chip,
    Button as PaperButton,
    IconButton,
    List,
    SegmentedButtons,
    Divider,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const DEFAULT_MIN_AMOUNT = 0;
const DEFAULT_MAX_AMOUNT = 20000;

const lightenColor = (color, percent) => {
    if (!color) return '#e0e0e0';
    let f = parseInt(color.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = f >> 8 & 0x00FF,
        B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
};

const formatDateEuropean = (timestamp) => {
    if (timestamp === null || typeof timestamp === 'undefined') return '';
    return new Date(timestamp * 1000).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Widok główny z listą filtrów
const MainView = ({ localFilters, dynamicMaxAmount, setScreen, onClose }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 180 }} keyboardShouldPersistTaps="always">
        <View style={styles.innerContent}>
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Filtry</Text>
                <IconButton icon="close" onPress={onClose} />
            </View>
            <Divider />

            <Pressable style={styles.row} onPress={() => setScreen('categories')}>
                <Text style={styles.rowTitle}>Kategorie</Text>
                <Text style={styles.rowSubtitle}>{(localFilters.categoryIds || []).length > 0 ? `${(localFilters.categoryIds || []).length} wybr.` : 'Wszystkie'}</Text>
            </Pressable>

            <Pressable style={styles.row} onPress={() => setScreen('tags')}>
                <Text style={styles.rowTitle}>Tagi</Text>
                <Text style={styles.rowSubtitle}>{(localFilters.tagIds || []).length > 0 ? `${(localFilters.tagIds || []).length} wybr.` : 'Wszystkie'}</Text>
            </Pressable>

            <Pressable style={styles.row} onPress={() => setScreen('date')}>
                <Text style={styles.rowTitle}>Zakres dat</Text>
                <Text style={styles.rowSubtitle}>
                    {localFilters.dateFrom === null && localFilters.dateTo === null
                        ? 'Wszystkie daty'
                        : `od ${formatDateEuropean(localFilters.dateFrom)} do ${formatDateEuropean(localFilters.dateTo)}`
                    }
                </Text>
            </Pressable>

            <Pressable style={styles.row} onPress={() => setScreen('price')}>
                <Text style={styles.rowTitle}>Zakres kwot</Text>
                <Text style={styles.rowSubtitle}>
                    {(localFilters.amountMin != null || localFilters.amountMax != null)
                        ? `${localFilters.amountMin ?? 0} zł - ${localFilters.amountMax ?? dynamicMaxAmount} zł`
                        : 'Dowolnie'}
                </Text>
            </Pressable>

            <Pressable style={styles.row} onPress={() => setScreen('type')}>
                <Text style={styles.rowTitle}>Typ / Cykliczna</Text>
                <Text style={styles.rowSubtitle}>
                    {`${localFilters.transactionType === 'all' ? 'Wszystkie' : (localFilters.transactionType === 'income' ? 'Wpływy' : 'Wydatki')} · ${localFilters.periodic === 'all' ? 'Dowolnie' : (localFilters.periodic === 'yes' ? 'Tylko cykliczne' : 'Bez cyklicznych')}`}
                </Text>
            </Pressable>
        </View>
    </ScrollView>
);

// Widok wyboru kategorii
const CategoriesView = ({ setScreen, categories, localFilters, toggleCategory }) => {
    const renderCategoryItem = ({ item }) => {
        const selected = (localFilters.categoryIds || []).includes(item.id);
        return (
            <List.Item
                title={item.name}
                titleStyle={styles.listTitle}
                onPress={() => toggleCategory(item.id)}
                left={() => <Avatar.Icon size={40} icon={item.iconName || 'folder'} style={{ backgroundColor: item.color ?? '#ddd' }} />}
                right={() => <Checkbox.Android status={selected ? 'checked' : 'unchecked'} onPress={() => toggleCategory(item.id)} />}
            />
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Kategorie</Text>
                <View style={{ width: 48 }} />
            </View>
            <Divider />
            <FlatList
                data={categories}
                keyExtractor={c => String(c.id)}
                renderItem={renderCategoryItem}
                ItemSeparatorComponent={() => <Divider style={{ marginLeft: 72 }} />}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={{ paddingBottom: 200 }}
            />
        </View>
    );
};

// Widok wyboru tagów
const TagsView = ({ setScreen, tagQuery, setTagQuery, filteredTags, localFilters, toggleTag }) => (
    <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
            <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
            <Text style={styles.headerTitle}>Tagi</Text>
            <View style={{ width: 48 }} />
        </View>
        <Divider />
        <ScrollView contentContainerStyle={{ paddingBottom: 180, padding: 12 }} keyboardShouldPersistTaps="always">
            <TextInput
                placeholder="Szukaj tagów..."
                value={tagQuery}
                onChangeText={setTagQuery}
                style={styles.tagSearchInput}
                returnKeyType="done"
                blurOnSubmit={false}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
                {filteredTags.map(tag => {
                    const selected = (localFilters.tagIds || []).includes(tag.id);
                    return (
                        <Chip
                            key={tag.id}
                            mode="outlined"
                            selected={selected}
                            onPress={() => toggleTag(tag.id)}
                            style={[
                                styles.chip,
                                selected && { backgroundColor: lightenColor(tag.color, 0.8) },
                                { borderColor: tag.color }
                            ]}
                            textStyle={{ color: selected ? tag.color : tag.color }}
                        >
                            {tag.name}
                        </Chip>
                    );
                })}
            </View>
        </ScrollView>
    </View>
);

// Widok wyboru zakresu dat
const DateView = ({ setScreen, localFilters, setShowFromPicker, setShowToPicker, showFromPicker, showToPicker, onChangeFrom, onChangeTo, onClearDates }) => (
    <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
            <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
            <Text style={styles.headerTitle}>Zakres dat</Text>
            <View style={{ width: 48 }} />
        </View>
        <Divider />
        <ScrollView contentContainerStyle={{ paddingBottom: 180, padding: 12 }} keyboardShouldPersistTaps="always">
            <Text style={styles.sectionSubtitle}>Wybierz zakres dat lub wyświetl wszystkie transakcje.</Text>
            <PaperButton
                mode={localFilters.dateFrom === null && localFilters.dateTo === null ? "contained" : "outlined"}
                onPress={onClearDates}
                style={{ marginBottom: 16 }}
                icon="calendar-blank-outline"
            >
                Wszystkie daty
            </PaperButton>
            <Divider style={{ marginVertical: 16 }} />
            <Text style={styles.sectionHint}>Lub ustaw konkretny zakres:</Text>
            <Text style={styles.inputLabel}>Data od:</Text>
            <PaperButton mode="outlined" onPress={() => setShowFromPicker(true)}>
                {localFilters.dateFrom ? formatDateEuropean(localFilters.dateFrom) : 'Wybierz datę'}
            </PaperButton>
            <Text style={{ marginVertical: 12, textAlign: 'center', fontSize: 16, color: '#666' }}>do</Text>
            <Text style={styles.inputLabel}>Data do:</Text>
            <PaperButton mode="outlined" onPress={() => setShowToPicker(true)}>
                {localFilters.dateTo ? formatDateEuropean(localFilters.dateTo) : 'Wybierz datę'}
            </PaperButton>
            {showFromPicker && <DateTimePicker value={new Date((localFilters.dateFrom || Date.now() / 1000) * 1000)} mode="date" display="default" onChange={onChangeFrom} maximumDate={localFilters.dateTo ? new Date(localFilters.dateTo * 1000) : new Date()} />}
            {showToPicker && <DateTimePicker value={new Date((localFilters.dateTo || Date.now() / 1000) * 1000)} mode="date" display="default" onChange={onChangeTo} minimumDate={localFilters.dateFrom ? new Date(localFilters.dateFrom * 1000) : undefined} maximumDate={new Date()} />}
        </ScrollView>
    </View>
);

// Widok wyboru zakresu kwot
const PriceView = ({ setScreen, localFilters, onManualMinChange, onManualMaxChange }) => (
    <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
            <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
            <Text style={styles.headerTitle}>Zakres kwot (PLN)</Text>
            <View style={{ width: 48 }} />
        </View>
        <Divider />
        <ScrollView contentContainerStyle={{ paddingBottom: 180, padding: 12 }} keyboardShouldPersistTaps="always">
            <Text style={styles.sectionSubtitle}>Wpisz zakres kwot do filtrowania transakcji.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Kwota od:</Text>
                    <TextInput placeholder="0" keyboardType="numeric" value={localFilters.amountMin != null ? String(localFilters.amountMin) : ''} onChangeText={onManualMinChange} style={styles.manualInput} blurOnSubmit={false} />
                </View>
                <Text style={{ fontSize: 16, color: '#666', marginTop: 20 }}>do</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>Kwota do:</Text>
                    <TextInput placeholder="Bez limitu" keyboardType="numeric" value={localFilters.amountMax != null ? String(localFilters.amountMax) : ''} onChangeText={onManualMaxChange} style={styles.manualInput} blurOnSubmit={false} />
                </View>
            </View>
            {(localFilters.amountMin != null || localFilters.amountMax != null) && (
                <Text style={{ marginTop: 16, fontSize: 14, color: '#333', textAlign: 'center' }}>
                    Zakres: {localFilters.amountMin ?? '0'} zł - {localFilters.amountMax ?? '∞'} zł
                </Text>
            )}
        </ScrollView>
    </View>
);

// Widok wyboru typu transakcji
const TypeView = ({ setScreen, localFilters, onTypeChange, onPeriodicChange }) => (
    <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
            <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
            <Text style={styles.headerTitle}>Typ transakcji</Text>
            <View style={{ width: 48 }} />
        </View>
        <Divider />
        <View style={{ padding: 12 }}>
            <Text style={styles.sectionHeader}>Typ</Text>
            <SegmentedButtons value={localFilters.transactionType ?? 'all'} onValueChange={onTypeChange} buttons={[{ value: 'all', label: 'Wszystkie' }, { value: 'expenditure', label: 'Wydatki' }, { value: 'income', label: 'Wpływy' }]} />
            <Text style={styles.sectionHeader}>Cykliczna</Text>
            <SegmentedButtons value={localFilters.periodic ?? 'all'} onValueChange={onPeriodicChange} buttons={[{ value: 'all', label: 'Dowolnie' }, { value: 'yes', label: 'Tylko tak' }, { value: 'no', label: 'Tylko nie' }]} />
        </View>
    </View>
);

const FilterModal = ({
    visible = false,
    initialFilters = null,
    categoriesOptions = [],
    tagsOptions = [],
    allTransactions = [],
    onApply,
    onClose,
    initialScreen = 'main',
}) => {
    const [localFilters, setLocalFilters] = useState(() => initialFilters ? { ...initialFilters } : createDefaultFilters());
    const [screen, setScreen] = useState('main');
    const [tagQuery, setTagQuery] = useState('');
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    useEffect(() => {
        if (visible) {
            setLocalFilters(initialFilters ? { ...initialFilters } : createDefaultFilters());
            setScreen(initialScreen ?? 'main');
            setTagQuery('');
        }
    }, [visible, initialFilters, initialScreen]);

    const normalizeCategory = (cat) => ({ id: cat.id ?? cat._id, name: cat.name, iconName: cat.iconName || 'folder', color: cat.color || '#cccccc' });
    const normalizeTag = (tag) => ({ id: tag.id ?? tag._id, name: tag.name, color: tag.color || '#808080' });

    const categories = useMemo(() => (categoriesOptions || []).map(normalizeCategory).filter(c => c.id != null), [categoriesOptions]);
    const tags = useMemo(() => (tagsOptions || []).map(normalizeTag).filter(t => t.id != null), [tagsOptions]);

    const dynamicMaxAmount = useMemo(() => {
        if (!allTransactions || allTransactions.length === 0) return DEFAULT_MAX_AMOUNT;
        const maxAbs = Math.max(...allTransactions.map(t => Math.abs(Number(t.amount || 0))));
        return Math.max(DEFAULT_MIN_AMOUNT + 1, Math.ceil(maxAbs));
    }, [allTransactions]);

    const updateLocal = (patch) => setLocalFilters(prev => ({ ...prev, ...patch }));
    const toggleCategory = (catId) => updateLocal({ categoryIds: (localFilters.categoryIds || []).includes(catId) ? localFilters.categoryIds.filter(id => id !== catId) : [...(localFilters.categoryIds || []), catId] });
    const toggleTag = (tagId) => updateLocal({ tagIds: (localFilters.tagIds || []).includes(tagId) ? localFilters.tagIds.filter(t => t !== tagId) : [...(localFilters.tagIds || []), tagId] });

    const onChangeFrom = (event, selectedDate) => {
        setShowFromPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const d = new Date(selectedDate);
            d.setHours(0, 0, 0, 0);
            updateLocal({ dateFrom: Math.floor(d.getTime() / 1000) });
        }
    };
    const onChangeTo = (event, selectedDate) => {
        setShowToPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const d = new Date(selectedDate);
            d.setHours(23, 59, 59, 999);
            updateLocal({ dateTo: Math.floor(d.getTime() / 1000) });
        }
    };
    const onClearDates = () => updateLocal({ dateFrom: null, dateTo: null });
    const onManualMinChange = (text) => updateLocal({ amountMin: text.replace(/[^\d]/g, '') === '' ? null : Number(text.replace(/[^\d]/g, '')) });
    const onManualMaxChange = (text) => updateLocal({ amountMax: text.replace(/[^\d]/g, '') === '' ? null : Number(text.replace(/[^\d]/g, '')) });
    const onTypeChange = (value) => updateLocal({ transactionType: value });
    const onPeriodicChange = (value) => updateLocal({ periodic: value });

    const filteredTags = useMemo(() => { const q = (tagQuery || '').trim().toLowerCase(); if (!q) return tags; return tags.filter(t => t.name.toLowerCase().includes(q)); }, [tags, tagQuery]);

    const applyToParent = () => {
        let { amountMin: min, amountMax: max, ...rest } = localFilters;
        if (min != null && max != null && min > max) [min, max] = [max, min];
        if (typeof onApply === 'function') onApply({ ...rest, amountMin: min, amountMax: max });
    };

    const resetCurrentScreen = () => {
        const defaults = createDefaultFilters();
        switch (screen) {
            case 'categories': updateLocal({ categoryIds: [] }); break;
            case 'tags': updateLocal({ tagIds: [] }); setTagQuery(''); break;
            case 'date': updateLocal({ dateFrom: defaults.dateFrom, dateTo: defaults.dateTo }); break;
            case 'price': updateLocal({ amountMin: null, amountMax: null }); break;
            case 'type': updateLocal({ transactionType: 'all', periodic: 'all' }); break;
            default: setLocalFilters(defaults); setTagQuery(''); break;
        }
    };

    const hasFiltersToReset = useMemo(() => {
        const defaults = createDefaultFilters();
        switch (screen) {
            case 'categories': return (localFilters.categoryIds || []).length > 0;
            case 'tags': return (localFilters.tagIds || []).length > 0 || tagQuery.trim() !== '';
            case 'date': return localFilters.dateFrom !== defaults.dateFrom || localFilters.dateTo !== defaults.dateTo;
            case 'price': return localFilters.amountMin != null || localFilters.amountMax != null;
            case 'type': return localFilters.transactionType !== 'all' || localFilters.periodic !== 'all';
            default:
                return (localFilters.categoryIds || []).length > 0 || (localFilters.tagIds || []).length > 0 ||
                    localFilters.amountMin != null || localFilters.amountMax != null ||
                    localFilters.transactionType !== 'all' || localFilters.periodic !== 'all' ||
                    localFilters.dateFrom !== defaults.dateFrom || localFilters.dateTo !== defaults.dateTo;
        }
    }, [localFilters, screen, tagQuery]);

    const getClearButtonText = useMemo(() => {
        switch (screen) {
            case 'categories': return `Wyczyść (${(localFilters.categoryIds || []).length})`;
            case 'tags': return `Wyczyść (${(localFilters.tagIds || []).length})`;
            case 'date': return 'Resetuj daty';
            case 'price': return 'Wyczyść kwoty';
            case 'type': return 'Resetuj typy';
            default: return 'Wyczyść wszystko';
        }
    }, [screen, localFilters]);

    const renderContent = () => {
        switch (screen) {
            case 'categories': return <CategoriesView
                setScreen={setScreen}
                categories={categories}
                localFilters={localFilters}
                toggleCategory={toggleCategory} />;
            case 'tags': return <TagsView
                setScreen={setScreen}
                tagQuery={tagQuery}
                setTagQuery={setTagQuery}
                filteredTags={filteredTags}
                localFilters={localFilters}
                toggleTag={toggleTag} />;
            case 'date': return <DateView
                setScreen={setScreen}
                localFilters={localFilters}
                setShowFromPicker={setShowFromPicker}
                setShowToPicker={setShowToPicker}
                showFromPicker={showFromPicker}
                showToPicker={showToPicker}
                onChangeFrom={onChangeFrom}
                onChangeTo={onChangeTo}
                onClearDates={onClearDates} />;
            case 'price': return <PriceView
                setScreen={setScreen}
                localFilters={localFilters}
                onManualMinChange={onManualMinChange}
                onManualMaxChange={onManualMaxChange} />;
            case 'type': return <TypeView
                setScreen={setScreen}
                localFilters={localFilters}
                onTypeChange={onTypeChange}
                onPeriodicChange={onPeriodicChange} />;
            default: return <MainView
                localFilters={localFilters}
                dynamicMaxAmount={dynamicMaxAmount}
                setScreen={setScreen}
                onClose={onClose} />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {renderContent()}
            <View style={styles.footer}>
                <PaperButton mode="text" onPress={resetCurrentScreen} disabled={!hasFiltersToReset} icon={screen === 'main' ? 'refresh' : 'close'}>
                    {getClearButtonText}
                </PaperButton>
                <View style={styles.footerRight}>
                    <PaperButton mode="text" onPress={onClose} style={{ marginRight: 8 }}>Anuluj</PaperButton>
                    <PaperButton mode="contained" onPress={screen === 'main' ? applyToParent : () => setScreen('main')} style={{ minWidth: 120 }} contentStyle={{ height: 44 }}>
                        {screen === 'main' ? 'Pokaż wyniki' : 'Zastosuj'}
                    </PaperButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

export const createDefaultFilters = () => {
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 60);
    fromDate.setHours(0, 0, 0, 0);

    return {
        categoryIds: [],
        tagIds: [],
        dateFrom: Math.floor(fromDate.getTime() / 1000),
        dateTo: Math.floor(to.getTime() / 1000),
        amountMin: null,
        amountMax: null,
        transactionType: 'all',
        periodic: 'all',
    };
};

export const getActiveFiltersCount = (filters) => {
    const defaults = createDefaultFilters();
    let count = 0;
    if (filters.categoryIds?.length > 0) count++;
    if (filters.tagIds?.length > 0) count++;
    if (filters.dateFrom !== defaults.dateFrom || filters.dateTo !== defaults.dateTo) count++;
    if (filters.amountMin != null || filters.amountMax != null) count++;
    if (filters.transactionType !== 'all') count++;
    if (filters.periodic !== 'all') count++;
    return count;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    innerContent: {
        paddingTop: 8,
        paddingBottom: 16,
        paddingHorizontal: 8
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 6
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center'
    },
    row: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    rowTitle: {
        fontSize: 16
    },
    rowSubtitle: {
        color: '#7f8c8d'
    },
    sectionHeader: {
        marginTop: 16,
        marginBottom: 8,
        fontWeight: '600'
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center'
    },
    sectionHint: {
        fontSize: 13,
        color: '#888',
        marginBottom: 16,
        textAlign: 'center'
    },
    inputLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 8
    },
    tagSearchInput: {
        height: 44,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        fontSize: 16
    },
    chip: {
        marginRight: 8,
        marginBottom: 8
    },
    manualInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 48,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        fontSize: 16,
        textAlign: 'center'
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 60,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    listTitle: {
        fontSize: 16
    },
});

export default React.memo(FilterModal);