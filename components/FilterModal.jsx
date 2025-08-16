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
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const DEFAULT_MIN_AMOUNT = 0;
const DEFAULT_MAX_AMOUNT = 20000;

const MainScroll = ({
    localFilters,
    dynamicMaxAmount,
    setScreen,
    onClose,
}) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 160 }} keyboardShouldPersistTaps="always">
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
                    {`${new Date((localFilters.dateFrom || 0) * 1000).toLocaleDateString()} — ${new Date((localFilters.dateTo || 0) * 1000).toLocaleDateString()}`}
                </Text>
            </Pressable>

            <Pressable style={styles.row} onPress={() => setScreen('price')}>
                <Text style={styles.rowTitle}>Zakres kwot</Text>
                <Text style={styles.rowSubtitle}>
                    {(localFilters.amountMin != null || localFilters.amountMax != null)
                        ? `${localFilters.amountMin ?? 0} zł — ${localFilters.amountMax ?? dynamicMaxAmount} zł`
                        : 'Dowolnie'}
                </Text>
            </Pressable>

            <Pressable style={styles.row} onPress={() => setScreen('type')}>
                <Text style={styles.rowTitle}>Typ transakcji / Cykliczna</Text>
                <Text style={styles.rowSubtitle}>
                    {`${localFilters.transactionType !== 'all' ? localFilters.transactionType : 'Wszystkie'} · ${localFilters.recurring !== 'all' ? (localFilters.recurring === 'yes' ? 'Tylko cykliczne' : 'Bez cyklicznych') : 'Dowolnie'}`}
                </Text>
            </Pressable>
        </View>
    </ScrollView>
);

const CategoriesView = ({ setScreen, categories, localFilters, toggleCategory, clearCategories }) => {
    const renderCategoryItem = ({ item }) => {
        const selected = (localFilters.categoryIds || []).includes(item.id);
        return (
            <Pressable onPress={() => toggleCategory(item.id)}>
                <List.Item
                    title={() => <Text style={styles.listTitle}>{item.name}</Text>}
                    left={() => (
                        <Avatar.Icon
                            size={40}
                            icon={item.iconName || 'folder'}
                            style={{ backgroundColor: item.color ?? '#ddd' }}
                        />
                    )}
                    right={() => (
                        <Checkbox
                            status={selected ? 'checked' : 'unchecked'}
                            onPress={() => toggleCategory(item.id)}
                        />
                    )}
                />
            </Pressable>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Kategorie</Text>
                <View style={{ width: 40 }} />
            </View>
            <Divider />
            <Pressable style={{ padding: 12 }} onPress={() => { clearCategories(); setScreen('main'); }}>
                <Text style={{ color: '#1976d2' }}>Wszystkie (wyczyść)</Text>
            </Pressable>
            <FlatList
                data={categories}
                keyExtractor={c => String(c.id)}
                renderItem={renderCategoryItem}
                ItemSeparatorComponent={() => <Divider style={{ marginLeft: 72 }} />}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={{ paddingBottom: 180 }}
            />
        </View>
    );
};

const TagsView = ({ setScreen, tagQuery, setTagQuery, filteredTags, localFilters, toggleTag }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 160 }} keyboardShouldPersistTaps="always">
        <View style={styles.innerContent}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Tagi</Text>
                <View style={{ width: 40 }} />
            </View>
            <Divider />
            <View style={{ padding: 12 }}>
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
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
                    {filteredTags.map(tag => {
                        const selected = (localFilters.tagIds || []).includes(tag.id);
                        return (
                            <Chip
                                key={tag.id}
                                mode={selected ? 'flat' : 'outlined'}
                                selected={selected}
                                onPress={() => toggleTag(tag.id)}
                                style={{ marginRight: 8, marginBottom: 8 }}
                            >
                                <Text>{tag.name}</Text>
                            </Chip>
                        );
                    })}
                </View>
            </View>
        </View>
    </ScrollView>
);

const DateView = ({ setScreen, localFilters, setShowFromPicker, setShowToPicker, showFromPicker, showToPicker, onChangeFrom, onChangeTo }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 160 }} keyboardShouldPersistTaps="always">
        <View style={styles.innerContent}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Zakres dat</Text>
                <View style={{ width: 40 }} />
            </View>
            <Divider />
            <View style={{ padding: 12 }}>
                <PaperButton mode="outlined" onPress={() => setShowFromPicker(true)}>
                    <Text>{new Date((localFilters.dateFrom || 0) * 1000).toLocaleDateString()}</Text>
                </PaperButton>
                <Text style={{ marginVertical: 12, textAlign: 'center' }}>—</Text>
                <PaperButton mode="outlined" onPress={() => setShowToPicker(true)}>
                    <Text>{new Date((localFilters.dateTo || 0) * 1000).toLocaleDateString()}</Text>
                </PaperButton>

                {showFromPicker && (
                    <DateTimePicker value={new Date((localFilters.dateFrom || 0) * 1000)} mode="date" display="default" onChange={onChangeFrom} maximumDate={new Date()} />
                )}
                {showToPicker && (
                    <DateTimePicker value={new Date((localFilters.dateTo || 0) * 1000)} mode="date" display="default" onChange={onChangeTo} maximumDate={new Date()} />
                )}
            </View>
        </View>
    </ScrollView>
);

const PriceView = ({ setScreen, sliderVals, dynamicMaxAmount, onSliderChange, onSliderFinish, localFilters, onManualMinChange, onManualMaxChange }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 160 }} keyboardShouldPersistTaps="always">
        <View style={styles.innerContent}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Zakres kwot (PLN)</Text>
                <View style={{ width: 40 }} />
            </View>
            <Divider />
            <View style={{ padding: 12, alignItems: 'center' }}>
                <Text>{`${sliderVals[0] ?? 0} zł — ${sliderVals[1] ?? dynamicMaxAmount} zł`}</Text>
                <View style={{ width: '100%', paddingHorizontal: 16 }}>
                    <MultiSlider
                        values={[sliderVals[0] ?? 0, sliderVals[1] ?? dynamicMaxAmount]}
                        sliderLength={Math.min(320, 340)}
                        onValuesChange={onSliderChange}
                        onValuesChangeFinish={onSliderFinish}
                        min={DEFAULT_MIN_AMOUNT}
                        max={Math.max(dynamicMaxAmount, DEFAULT_MAX_AMOUNT)}
                        step={1}
                        allowOverlap={false}
                        snapped
                    />
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, width: '100%', justifyContent: 'space-between', paddingHorizontal: 16 }}>
                    <TextInput
                        placeholder="Min"
                        keyboardType="numeric"
                        value={localFilters.amountMin != null ? String(localFilters.amountMin) : ''}
                        onChangeText={onManualMinChange}
                        style={styles.manualInput}
                        blurOnSubmit={false}
                    />
                    <TextInput
                        placeholder="Max"
                        keyboardType="numeric"
                        value={localFilters.amountMax != null ? String(localFilters.amountMax) : ''}
                        onChangeText={onManualMaxChange}
                        style={styles.manualInput}
                        blurOnSubmit={false}
                    />
                </View>
            </View>
        </View>
    </ScrollView>
);

const TypeView = ({ setScreen, localFilters, onTypeChange, onRecurringChange }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 160 }} keyboardShouldPersistTaps="always">
        <View style={styles.innerContent}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Typ transakcji</Text>
                <View style={{ width: 40 }} />
            </View>
            <Divider />
            <View style={{ padding: 12 }}>
                <Text style={{ marginBottom: 6, fontWeight: '600' }}>Typ</Text>
                <SegmentedButtons
                    value={localFilters.transactionType ?? 'all'}
                    onValueChange={onTypeChange}
                    buttons={[
                        { value: 'all', label: 'Wszystkie' },
                        { value: 'expenditure', label: 'Wydatki' },
                        { value: 'income', label: 'Wpływy' },
                    ]}
                />
                <Text style={{ marginTop: 16, marginBottom: 6, fontWeight: '600' }}>Cykliczna</Text>
                <SegmentedButtons
                    value={localFilters.recurring ?? 'all'}
                    onValueChange={onRecurringChange}
                    buttons={[
                        { value: 'all', label: 'Dowolnie' },
                        { value: 'yes', label: 'Tylko tak' },
                        { value: 'no', label: 'Tylko nie' },
                    ]}
                />
            </View>
        </View>
    </ScrollView>
);


const FilterModal = ({
    visible = false,
    initialFilters = null,
    categoriesOptions = [],
    tagsOptions = [],
    allTransactions = [],
    onApply,
    onResetAndApply,
    onClose,
}) => {
    // ... reszta kodu pozostaje bez zmian ...
    const [localFilters, setLocalFilters] = useState(() => initialFilters ? { ...initialFilters } : createDefaultLocal());
    const [screen, setScreen] = useState('main');
    const [tagQuery, setTagQuery] = useState('');
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [sliderVals, setSliderVals] = useState([DEFAULT_MIN_AMOUNT, DEFAULT_MAX_AMOUNT]);

    useEffect(() => {
        if (visible) {
            setLocalFilters(initialFilters ? { ...initialFilters } : createDefaultLocal());
            setScreen('main');
            setTagQuery('');
        }
    }, [visible, initialFilters]);

    const normalizeCategory = (cat) => ({ id: cat.id ?? cat.categoryId ?? cat._id ?? null, name: cat.name ?? cat.label ?? cat.categoryName ?? '', iconName: cat.iconName ?? cat.icon ?? cat.categoryIcon ?? 'folder', color: cat.color ?? cat.backgroundColor ?? cat.categoryColor ?? '#cccccc' });
    const normalizeTag = (tag) => ({ id: tag.id ?? tag.tagId ?? tag._id ?? null, name: tag.name ?? tag.label ?? tag.tagName ?? '' });

    const categories = (categoriesOptions || []).map(normalizeCategory).filter(c => c.id != null);
    const tags = (tagsOptions || []).map(normalizeTag).filter(t => t.id != null);

    const dynamicMaxAmount = useMemo(() => {
        try {
            const filtered = (allTransactions || []).filter(tx => {
                const f = { ...localFilters, amountMin: null, amountMax: null };
                if (f.categoryIds && f.categoryIds.length > 0) {
                    if (!tx.categoryId || !f.categoryIds.includes(tx.categoryId)) return false;
                }
                if (f.tagIds && f.tagIds.length > 0) {
                    const txTagIds = (tx.tags || []).map(t => t.id);
                    if (!f.tagIds.every(id => txTagIds.includes(id))) return false;
                }
                if (f.dateFrom && tx.transactionDate < f.dateFrom) return false;
                if (f.dateTo && tx.transactionDate > f.dateTo) return false;
                if (f.transactionType === 'income' && !(tx.amount > 0)) return false;
                if (f.transactionType === 'expenditure' && !(tx.amount < 0)) return false;
                if (f.recurring && f.recurring !== 'all') {
                    const r = Boolean(tx.recurring || tx.isRecurring || false);
                    if (f.recurring === 'yes' && !r) return false;
                    if (f.recurring === 'no' && r) return false;
                }
                return true;
            });
            if (!filtered || filtered.length === 0) return DEFAULT_MAX_AMOUNT;
            const maxAbs = Math.max(...filtered.map(t => Math.abs(Number(t.amount || 0))));
            return Math.max(DEFAULT_MIN_AMOUNT + 1, Math.ceil(maxAbs));
        } catch (e) {
            return DEFAULT_MAX_AMOUNT;
        }
    }, [allTransactions, localFilters]);

    useEffect(() => {
        const min = localFilters.amountMin != null ? Number(localFilters.amountMin) : DEFAULT_MIN_AMOUNT;
        const max = localFilters.amountMax != null ? Number(localFilters.amountMax) : dynamicMaxAmount;
        setSliderVals([min, Math.max(min, Math.min(max, dynamicMaxAmount))]);
    }, [localFilters.amountMin, localFilters.amountMax, dynamicMaxAmount]);

    const updateLocal = (patch) => setLocalFilters(prev => ({ ...prev, ...patch }));
    const toggleCategory = (catId) => updateLocal({ categoryIds: (localFilters.categoryIds || []).includes(catId) ? localFilters.categoryIds.filter(id => id !== catId) : [...(localFilters.categoryIds || []), catId] });
    const clearCategories = () => updateLocal({ categoryIds: [] });
    const toggleTag = (tagId) => updateLocal({ tagIds: (localFilters.tagIds || []).includes(tagId) ? localFilters.tagIds.filter(t => t !== tagId) : [...(localFilters.tagIds || []), tagId] });

    const onChangeFrom = (event, selectedDate) => { setShowFromPicker(Platform.OS === 'ios'); if (selectedDate) { const d = new Date(selectedDate); d.setHours(0, 0, 0, 0); updateLocal({ dateFrom: Math.floor(d.getTime() / 1000) }); } };
    const onChangeTo = (event, selectedDate) => { setShowToPicker(Platform.OS === 'ios'); if (selectedDate) { const d = new Date(selectedDate); d.setHours(23, 59, 59, 999); updateLocal({ dateTo: Math.floor(d.getTime() / 1000) }); } };

    const onSliderChange = (values) => setSliderVals(values);
    const onSliderFinish = (values) => { setSliderVals(values); updateLocal({ amountMin: values[0], amountMax: values[1] }); };

    const onManualMinChange = (text) => { const cleaned = text.replace(/[^\d]/g, ''); const asNum = cleaned === '' ? null : Number(cleaned); updateLocal({ amountMin: asNum }); setSliderVals(s => [asNum != null ? asNum : s[0], s[1]]); };
    const onManualMaxChange = (text) => { const cleaned = text.replace(/[^\d]/g, ''); const asNum = cleaned === '' ? null : Number(cleaned); updateLocal({ amountMax: asNum }); setSliderVals(s => [s[0], asNum != null ? asNum : s[1]]); };

    const onTypeChange = (value) => updateLocal({ transactionType: value });
    const onRecurringChange = (value) => updateLocal({ recurring: value });

    const filteredTags = useMemo(() => { const q = (tagQuery || '').trim().toLowerCase(); if (!q) return tags; return tags.filter(t => t.name.toLowerCase().includes(q)); }, [tags, tagQuery]);

    const applyToParent = () => { let min = localFilters.amountMin != null ? Number(localFilters.amountMin) : null; let max = localFilters.amountMax != null ? Number(localFilters.amountMax) : null; if (min != null && max != null && min > max) [min, max] = [max, min]; const finalFilters = { ...localFilters, amountMin: min, amountMax: max }; if (typeof onApply === 'function') onApply(finalFilters); };
    const resetToDefaults = () => { if (typeof onResetAndApply === 'function') { onResetAndApply(); } else { const defaults = createDefaultLocal(); setLocalFilters(defaults); if (typeof onApply === 'function') onApply(defaults); } };

    return (
        <SafeAreaView style={styles.container}>
            {screen === 'main' && (
                <MainScroll
                    localFilters={localFilters}
                    dynamicMaxAmount={dynamicMaxAmount}
                    setScreen={setScreen}
                    onClose={onClose}
                />
            )}
            {screen === 'categories' && (
                <CategoriesView
                    setScreen={setScreen}
                    categories={categories}
                    localFilters={localFilters}
                    toggleCategory={toggleCategory}
                    clearCategories={clearCategories}
                />
            )}
            {screen === 'tags' && (
                <TagsView
                    setScreen={setScreen}
                    tagQuery={tagQuery}
                    setTagQuery={setTagQuery}
                    filteredTags={filteredTags}
                    localFilters={localFilters}
                    toggleTag={toggleTag}
                />
            )}
            {screen === 'date' && (
                <DateView
                    setScreen={setScreen}
                    localFilters={localFilters}
                    setShowFromPicker={setShowFromPicker}
                    setShowToPicker={setShowToPicker}
                    showFromPicker={showFromPicker}
                    showToPicker={showToPicker}
                    onChangeFrom={onChangeFrom}
                    onChangeTo={onChangeTo}
                />
            )}
            {screen === 'price' && (
                <PriceView
                    setScreen={setScreen}
                    sliderVals={sliderVals}
                    dynamicMaxAmount={dynamicMaxAmount}
                    onSliderChange={onSliderChange}
                    onSliderFinish={onSliderFinish}
                    localFilters={localFilters}
                    onManualMinChange={onManualMinChange}
                    onManualMaxChange={onManualMaxChange}
                />
            )}
            {screen === 'type' && (
                <TypeView
                    setScreen={setScreen}
                    localFilters={localFilters}
                    onTypeChange={onTypeChange}
                    onRecurringChange={onRecurringChange}
                />
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <PaperButton mode="text" onPress={resetToDefaults}>
                        <Text>Wyczyść</Text>
                    </PaperButton>
                </View>
                <View style={styles.footerRight}>
                    <PaperButton mode="text" onPress={onClose}>
                        <Text>Anuluj</Text>
                    </PaperButton>
                    {screen === 'main' ? (
                        <PaperButton mode="contained" onPress={applyToParent} style={{ marginLeft: 8 }}>
                            <Text style={{ color: '#fff' }}>Pokaż wyniki</Text>
                        </PaperButton>
                    ) : (
                        <PaperButton mode="contained" onPress={() => setScreen('main')} style={{ marginLeft: 8 }}>
                            <Text style={{ color: '#fff' }}>Zastosuj</Text>
                        </PaperButton>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const createDefaultLocal = () => {
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 45);
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

const styles = StyleSheet.create({
    container: { width: '100%', height: '100%', backgroundColor: 'white' },
    innerContent: { paddingTop: 8, paddingBottom: 16, paddingHorizontal: 8 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
    headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
    row: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowTitle: { fontSize: 16 },
    rowSubtitle: { color: '#7f8c8d' },
    tagSearchInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    manualInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 44,
        paddingHorizontal: 10,
        width: '48%',
        backgroundColor: '#fff',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: { flex: 1 },
    footerRight: { flexDirection: 'row', alignItems: 'center' },
    listTitle: { fontSize: 16 },
});

export default React.memo(FilterModal);
