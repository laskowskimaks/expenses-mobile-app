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

// Funkcja pomocnicza do rozjaśniania kolorów
const lightenColor = (color, percent) => {
    if (!color) return '#e0e0e0';
    let f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
};


const MainScroll = ({
    localFilters,
    dynamicMaxAmount,
    setScreen,
    onClose,
}) => (
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
                        : `od ${formatDateEuropean(localFilters.dateFrom || 0)} do ${formatDateEuropean(localFilters.dateTo || 0)}`
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

const TagsView = ({ setScreen, tagQuery, setTagQuery, filteredTags, localFilters, toggleTag }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 180 }} keyboardShouldPersistTaps="always">
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
                        const backgroundColor = selected ? lightenColor(tag.color, 0.8) : 'transparent';
                        const textColor = tag.color;
                        const borderColor = tag.color;

                        return (
                            <Chip
                                key={tag.id}
                                mode={selected ? 'flat' : 'outlined'}
                                selected={selected}
                                onPress={() => toggleTag(tag.id)}
                                style={{
                                    marginRight: 8,
                                    marginBottom: 8,
                                    backgroundColor,
                                    borderColor,
                                }}
                                textStyle={{ color: textColor }}
                            >
                                {tag.name}
                            </Chip>
                        );
                    })}
                </View>
            </View>
        </View>
    </ScrollView>
);

const DateView = ({ setScreen, localFilters, setShowFromPicker, setShowToPicker, showFromPicker, showToPicker, onChangeFrom, onChangeTo, onClearDates }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 180 }} keyboardShouldPersistTaps="always">
        <View style={styles.innerContent}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Zakres dat</Text>
                <View style={{ width: 40 }} />
            </View>
            <Divider />
            <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' }}>
                    Wybierz zakres dat lub wyświetl wszystkie transakcje
                </Text>

                {/*  OPCJA "WSZYSTKIE DATY" */}
                <PaperButton
                    mode={localFilters.dateFrom === null && localFilters.dateTo === null ? "contained" : "outlined"}
                    onPress={onClearDates}
                    style={{ marginBottom: 16 }}
                    icon="calendar-remove"
                >
                    <Text>Wszystkie daty (bez ograniczeń)</Text>
                </PaperButton>

                <Divider style={{ marginVertical: 16 }} />

                <Text style={{ fontSize: 13, color: '#888', marginBottom: 8, textAlign: 'center' }}>
                    Lub ustaw konkretny zakres:
                </Text>

                <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Data od:</Text>
                <PaperButton
                    mode="outlined"
                    onPress={() => setShowFromPicker(true)}
                >
                    <Text>{localFilters.dateFrom ? formatDateEuropean(localFilters.dateFrom) : 'Wybierz datę'}</Text>
                </PaperButton>

                <Text style={{ marginVertical: 12, textAlign: 'center', fontSize: 16, color: '#666' }}>do</Text>

                <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Data do:</Text>
                <PaperButton
                    mode="outlined"
                    onPress={() => setShowToPicker(true)}
                >
                    <Text>{localFilters.dateTo ? formatDateEuropean(localFilters.dateTo) : 'Wybierz datę'}</Text>
                </PaperButton>

                {showFromPicker && (
                    <DateTimePicker
                        value={new Date((localFilters.dateFrom || Date.now() / 1000) * 1000)}
                        mode="date"
                        display="default"
                        onChange={onChangeFrom}
                        maximumDate={localFilters.dateTo ? new Date(localFilters.dateTo * 1000) : new Date()} //  Nie może być późniejsza niż dateTo
                    />
                )}
                {showToPicker && (
                    <DateTimePicker
                        value={new Date((localFilters.dateTo || Date.now() / 1000) * 1000)}
                        mode="date"
                        display="default"
                        onChange={onChangeTo}
                        minimumDate={localFilters.dateFrom ? new Date(localFilters.dateFrom * 1000) : undefined} //  Nie może być wcześniejsza niż dateFrom
                        maximumDate={new Date()} //  Nie może być z przyszłości
                    />
                )}
            </View>
        </View>
    </ScrollView>
);

const PriceView = ({ setScreen, localFilters, onManualMinChange, onManualMaxChange }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 180 }} keyboardShouldPersistTaps="always">
        <View style={styles.innerContent}>
            <View style={styles.headerRow}>
                <IconButton icon="arrow-left" onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Zakres kwot (PLN)</Text>
                <View style={{ width: 40 }} />
            </View>
            <Divider />
            <View style={{ padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' }}>
                    Wpisz zakres kwot do filtrowania transakcji
                </Text>
                <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Kwota od:</Text>
                        <TextInput
                            placeholder="0"
                            keyboardType="numeric"
                            value={localFilters.amountMin != null ? String(localFilters.amountMin) : ''}
                            onChangeText={onManualMinChange}
                            style={[styles.manualInput, { width: '100%' }]}
                            blurOnSubmit={false}
                        />
                    </View>
                    <Text style={{ fontSize: 16, color: '#666', marginTop: 20 }}>do</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Kwota do:</Text>
                        <TextInput
                            placeholder="Bez limitu"
                            keyboardType="numeric"
                            value={localFilters.amountMax != null ? String(localFilters.amountMax) : ''}
                            onChangeText={onManualMaxChange}
                            style={[styles.manualInput, { width: '100%' }]}
                            blurOnSubmit={false}
                        />
                    </View>
                </View>
                {(localFilters.amountMin != null || localFilters.amountMax != null) && (
                    <Text style={{ marginTop: 16, fontSize: 14, color: '#333', textAlign: 'center' }}>
                        Zakres: {localFilters.amountMin ?? '0'} zł - {localFilters.amountMax ?? '∞'} zł
                    </Text>
                )}
            </View>
        </View>
    </ScrollView>
);

const TypeView = ({ setScreen, localFilters, onTypeChange, onRecurringChange }) => (
    <ScrollView contentContainerStyle={{ paddingBottom: 180 }} keyboardShouldPersistTaps="always">
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
    initialScreen = 'main',
}) => {
    const [localFilters, setLocalFilters] = useState(() => initialFilters ? { ...initialFilters } : createDefaultLocal());
    const [screen, setScreen] = useState('main');
    const [tagQuery, setTagQuery] = useState('');
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    useEffect(() => {
        if (visible) {
            setLocalFilters(initialFilters ? { ...initialFilters } : createDefaultLocal());
            setScreen(initialScreen ?? 'main');
            setTagQuery('');
        }
    }, [visible, initialFilters, initialScreen]);

    const normalizeCategory = (cat) => ({ id: cat.id ?? cat.categoryId ?? cat._id ?? null, name: cat.name ?? cat.label ?? cat.categoryName ?? '', iconName: cat.iconName ?? cat.icon ?? cat.categoryIcon ?? 'folder', color: cat.color ?? cat.backgroundColor ?? cat.categoryColor ?? '#cccccc' });
    const normalizeTag = (tag) => ({ id: tag.id ?? tag.tagId ?? tag._id ?? null, name: tag.name ?? tag.label ?? tag.tagName ?? '', color: tag.color ?? '#808080' });

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
                    const r = Boolean(tx.isFromPeriodic);
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

    const updateLocal = (patch) => setLocalFilters(prev => ({ ...prev, ...patch }));
    const toggleCategory = (catId) => updateLocal({ categoryIds: (localFilters.categoryIds || []).includes(catId) ? localFilters.categoryIds.filter(id => id !== catId) : [...(localFilters.categoryIds || []), catId] });
    const clearCategories = () => updateLocal({ categoryIds: [] });
    const toggleTag = (tagId) => updateLocal({ tagIds: (localFilters.tagIds || []).includes(tagId) ? localFilters.tagIds.filter(t => t !== tagId) : [...(localFilters.tagIds || []), tagId] });

    const onChangeFrom = (event, selectedDate) => {
        setShowFromPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const d = new Date(selectedDate);
            d.setHours(0, 0, 0, 0);

            //  Sprawdź czy wybrana data nie jest późniejsza niż dateTo
            if (localFilters.dateTo && Math.floor(d.getTime() / 1000) > localFilters.dateTo) {
                console.warn('[FilterModal] Data "od" nie może być późniejsza niż data "do"');
                return;
            }

            updateLocal({ dateFrom: Math.floor(d.getTime() / 1000) });

            //  Automatycznie ustaw dateTo na dzisiaj jeśli była null
            if (localFilters.dateTo === null) {
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                updateLocal({ dateTo: Math.floor(today.getTime() / 1000) });
            }
        }
    };

    const onChangeTo = (event, selectedDate) => {
        setShowToPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const d = new Date(selectedDate);
            d.setHours(23, 59, 59, 999);

            //  Sprawdź czy wybrana data nie jest wcześniejsza niż dateFrom
            if (localFilters.dateFrom && Math.floor(d.getTime() / 1000) < localFilters.dateFrom) {
                console.warn('[FilterModal] Data "do" nie może być wcześniejsza niż data "od"');
                return;
            }

            updateLocal({ dateTo: Math.floor(d.getTime() / 1000) });

            //  Automatycznie ustaw dateFrom jeśli była null (60 dni wcześniej)
            if (localFilters.dateFrom === null) {
                const sixtyDaysAgo = new Date(selectedDate);
                sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
                sixtyDaysAgo.setHours(0, 0, 0, 0);
                updateLocal({ dateFrom: Math.floor(sixtyDaysAgo.getTime() / 1000) });
            }
        }
    };

    //  FUNKCJA DO CZYSZCZENIA DAT
    const onClearDates = () => {
        updateLocal({ dateFrom: null, dateTo: null });
        console.log('[FilterModal] Wyczyszczono ograniczenia dat - wyświetlane wszystkie transakcje');
    };

    const onManualMinChange = (text) => {
        const cleaned = text.replace(/[^\d]/g, '');
        const asNum = cleaned === '' ? null : Number(cleaned);
        updateLocal({ amountMin: asNum });
    };
    const onManualMaxChange = (text) => {
        const cleaned = text.replace(/[^\d]/g, '');
        const asNum = cleaned === '' ? null : Number(cleaned);
        updateLocal({ amountMax: asNum });
    };

    const onTypeChange = (value) => updateLocal({ transactionType: value });
    const onRecurringChange = (value) => updateLocal({ recurring: value });

    const filteredTags = useMemo(() => { const q = (tagQuery || '').trim().toLowerCase(); if (!q) return tags; return tags.filter(t => t.name.toLowerCase().includes(q)); }, [tags, tagQuery]);

    const applyToParent = () => { let min = localFilters.amountMin != null ? Number(localFilters.amountMin) : null; let max = localFilters.amountMax != null ? Number(localFilters.amountMax) : null; if (min != null && max != null && min > max) [min, max] = [max, min]; const finalFilters = { ...localFilters, amountMin: min, amountMax: max }; if (typeof onApply === 'function') onApply(finalFilters); };

    //  KONTEKSTOWE CZYSZCZENIE - różne dla każdego ekranu
    const resetCurrentScreen = () => {
        switch (screen) {
            case 'categories':
                // Wyczyść tylko kategorie
                updateLocal({ categoryIds: [] });
                console.log('[FilterModal] Wyczyszczono kategorie');
                break;

            case 'tags':
                // Wyczyść tylko tagi
                updateLocal({ tagIds: [] });
                setTagQuery(''); // Wyczyść też wyszukiwanie
                console.log('[FilterModal] Wyczyszczono tagi');
                break;

            case 'date':
                //  Resetuj daty do "ostatnie 60 dni" zamiast null
                const defaults = createDefaultLocal();
                updateLocal({
                    dateFrom: defaults.dateFrom,
                    dateTo: defaults.dateTo
                });
                console.log('[FilterModal] Zresetowano do zakresu ostatnich 60 dni');
                break;

            case 'price':
                // Wyczyść zakres kwot
                updateLocal({ amountMin: null, amountMax: null });
                console.log('[FilterModal] Wyczyszczono zakres kwot');
                break;

            case 'type':
                // Resetuj typ transakcji i cykliczność
                updateLocal({
                    transactionType: 'all',
                    recurring: 'all'
                });
                console.log('[FilterModal] Zresetowano typ transakcji');
                break;

            case 'main':
            default:
                // W głównym widoku - wyczyść wszystko
                const allDefaults = createDefaultLocal();
                setLocalFilters(allDefaults);
                setTagQuery('');
                console.log('[FilterModal] Wyczyszczono wszystkie filtry');
                break;
        }
    };

    //  FUNKCJA DO OKREŚLENIA TEKSTU PRZYCISKU
    const getClearButtonText = () => {
        switch (screen) {
            case 'categories':
                const catCount = (localFilters.categoryIds || []).length;
                return catCount > 0 ? `Wyczyść (${catCount})` : 'Wyczyść kategorie';
            case 'tags':
                const tagCount = (localFilters.tagIds || []).length;
                return tagCount > 0 ? `Wyczyść (${tagCount})` : 'Wyczyść tagi';
            case 'date':
                return 'Resetuj daty';
            case 'price':
                const hasAmounts = localFilters.amountMin != null || localFilters.amountMax != null;
                return hasAmounts ? 'Wyczyść kwoty' : 'Resetuj kwoty';
            case 'type':
                return 'Resetuj typ';
            case 'main':
            default:
                return 'Wyczyść wszystko';
        }
    };

    //  FUNKCJA DO SPRAWDZENIA CZY JEST CO CZYŚCIĆ
    const hasFiltersToReset = () => {
        const defaults = createDefaultLocal();

        switch (screen) {
            case 'categories':
                return (localFilters.categoryIds || []).length > 0;
            case 'tags':
                return (localFilters.tagIds || []).length > 0 || tagQuery.trim() !== '';
            case 'date':
                return localFilters.dateFrom !== defaults.dateFrom ||
                    localFilters.dateTo !== defaults.dateTo;
            case 'price':
                return localFilters.amountMin != null || localFilters.amountMax != null;
            case 'type':
                return localFilters.transactionType !== 'all' ||
                    localFilters.recurring !== 'all';
            case 'main':
            default:
                //  Sprawdź czy są ustawione niestandardowe daty (różne od domyślnych 60 dni)
                const hasCustomDates = (localFilters.dateFrom !== defaults.dateFrom ||
                    localFilters.dateTo !== defaults.dateTo);

                return (localFilters.categoryIds || []).length > 0 ||
                    (localFilters.tagIds || []).length > 0 ||
                    localFilters.amountMin != null ||
                    localFilters.amountMax != null ||
                    localFilters.transactionType !== 'all' ||
                    localFilters.recurring !== 'all' ||
                    hasCustomDates; //  Tylko jeśli daty są różne od domyślnych
        }
    };

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
                    onClearDates={onClearDates}
                />
            )}
            {screen === 'price' && (
                <PriceView
                    setScreen={setScreen}
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
                    {/*  KONTEKSTOWY PRZYCISK "WYCZYŚĆ" */}
                    <PaperButton
                        mode="text"
                        onPress={resetCurrentScreen}
                        disabled={!hasFiltersToReset()} //  Disable jeśli nie ma co czyścić
                        icon={screen === 'main' ? 'refresh' : 'close'} //  Różne ikony
                    >
                        <Text>{getClearButtonText()}</Text>
                    </PaperButton>
                </View>
                <View style={styles.footerRight}>
                    <PaperButton
                        mode="text"
                        onPress={onClose}
                        style={{ marginRight: 8 }}
                    >
                        <Text>Anuluj</Text>
                    </PaperButton>
                    {screen === 'main' ? (
                        <PaperButton
                            mode="contained"
                            onPress={applyToParent}
                            style={{ minWidth: 120 }}
                            contentStyle={{ height: 44, paddingHorizontal: 12 }}
                            labelStyle={{ color: '#fff', fontSize: 15 }}
                            uppercase={false}
                        >
                            Pokaż wyniki
                        </PaperButton>
                    ) : (
                        <PaperButton
                            mode="contained"
                            onPress={() => setScreen('main')}
                            style={{ minWidth: 100 }}
                            contentStyle={{ height: 44, paddingHorizontal: 12 }}
                            labelStyle={{ color: '#fff', fontSize: 15 }}
                            uppercase={false}
                        >
                            Zastosuj
                        </PaperButton>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

// FUNKCJA DOMYŚLNYCH FILTRÓW
export const createDefaultFilters = () => {
    // DOMYŚLNY ZAKRES: ostatnie 60 dni
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 60); // 60 dni wstecz
    fromDate.setHours(0, 0, 0, 0);

    return {
        categoryIds: [],
        tagIds: [],
        dateFrom: Math.floor(fromDate.getTime() / 1000), // 60 dni temu
        dateTo: Math.floor(to.getTime() / 1000),         // dzisiaj
        amountMin: null,
        amountMax: null,
        transactionType: 'all',
        recurring: 'all',
    };
};

//  EKSPORTOWANA FUNKCJA DO SPRAWDZANIA AKTYWNYCH FILTRÓW
export const getActiveFiltersCount = (filters) => {
    const defaults = createDefaultFilters();
    let count = 0;

    // Kategorie
    if (filters.categoryIds?.length > 0) count++;

    // Tagi  
    if (filters.tagIds?.length > 0) count++;

    // Daty - tylko jeśli różne od domyślnych
    if (filters.dateFrom !== defaults.dateFrom ||
        filters.dateTo !== defaults.dateTo) count++;

    // Kwoty
    if (filters.amountMin != null || filters.amountMax != null) count++;

    // Typ transakcji
    if (filters.transactionType !== 'all') count++;

    // Cykliczność
    if (filters.recurring !== 'all') count++;

    return count;
};

const createDefaultLocal = createDefaultFilters;

//  ULEPSZONY FORMAT DATY - dokładnie dd.mm.rrrr
const formatDateEuropean = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 60,
    },
    footerLeft: {
        flex: 1,
        marginRight: 8,
    },
    footerRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    listTitle: { fontSize: 16 },
});

export default React.memo(FilterModal);
