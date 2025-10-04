import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Platform,
    FlatList,
} from 'react-native';
import {
    Appbar,
    Button as PaperButton,
    Divider,
    RadioButton,
    SegmentedButtons,
    Text,
    TextInput,
    Checkbox,
    List,
    Avatar,
    Chip,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateOnly } from '@/utils/dateUtils';

export const createDefaultPeriodicFilters = () => ({
    sort: 'start_date_desc',
    status: 'all',
    categoryIds: [],
    tagIds: [],
    transactionType: 'all',
    amountMin: null,
    amountMax: null,
    dateFrom: null,
    dateTo: null,
});

const SORT_OPTIONS = [
    { label: 'Najnowsza data rozpoczęcia', value: 'start_date_desc' },
    { label: 'Najstarsza data rozpoczęcia', value: 'start_date_asc' },
    { label: 'Najbliższa data powtórzenia', value: 'next_occurrence_asc' },
    { label: 'Najdalsza data powtórzenia', value: 'next_occurrence_desc' },
    { label: 'Największa kwota', value: 'amount_desc' },
    { label: 'Najmniejsza kwota', value: 'amount_asc' },
    { label: 'Największa liczba powtórzeń', value: 'occurrences_desc' },
    { label: 'Najmniejsza liczba powtórzeń', value: 'occurrences_asc' },
    { label: 'Alfabetycznie (A-Z)', value: 'title_asc' },
];

export default function PeriodicFilterModal({
    initialFilters,
    onApply,
    onClose,
    categoriesOptions,
    tagsOptions,
}) {
    const theme = useTheme();

    const [localFilters, setLocalFilters] = useState(() =>
        initialFilters ? { ...initialFilters } : createDefaultPeriodicFilters()
    );
    const [screen, setScreen] = useState('main'); // 'main', 'categories', 'tags'
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [sortAccordionExpanded, setSortAccordionExpanded] = useState(false);
    const [tagQuery, setTagQuery] = useState('');

    const updateLocal = (patch) =>
        setLocalFilters((prev) => ({ ...prev, ...patch }));

    const toggleCategory = (catId) => {
        const current = localFilters.categoryIds || [];
        updateLocal({
            categoryIds: current.includes(catId)
                ? current.filter((id) => id !== catId)
                : [...current, catId],
        });
    };

    const toggleTag = (tagId) => {
        const current = localFilters.tagIds || [];
        updateLocal({
            tagIds: current.includes(tagId)
                ? current.filter((id) => id !== tagId)
                : [...current, tagId],
        });
    };

    const validateAmount = (val) => {
        if (val === '' || val === null) return true;
        const num = parseFloat((val || '').replace(',', '.'));
        return !isNaN(num) && num >= 0;
    };

    const isFiltersValid =
        validateAmount(localFilters.amountMin) &&
        validateAmount(localFilters.amountMax) &&
        (
            !localFilters.amountMin ||
            !localFilters.amountMax ||
            parseFloat((localFilters.amountMin || '').replace(',', '.')) <=
            parseFloat((localFilters.amountMax || '').replace(',', '.'))
        ) &&
        (
            !localFilters.dateFrom ||
            !localFilters.dateTo ||
            localFilters.dateFrom <= localFilters.dateTo
        );

    const onChangeFrom = (event, selectedDate) => {
        setShowFromPicker(Platform.OS === 'ios');
        if (event?.type === 'dismissed') return;
        if (selectedDate) {
            const d = new Date(selectedDate);
            d.setHours(0, 0, 0, 0);
            updateLocal({ dateFrom: Math.floor(d.getTime() / 1000) });
        }
    };

    const onChangeTo = (event, selectedDate) => {
        setShowToPicker(Platform.OS === 'ios');
        if (event?.type === 'dismissed') return;
        if (selectedDate) {
            const d = new Date(selectedDate);
            d.setHours(23, 59, 59, 999);
            updateLocal({ dateTo: Math.floor(d.getTime() / 1000) });
        }
    };

    const clearDates = () => updateLocal({ dateFrom: null, dateTo: null });

    const filteredTags = useMemo(() => {
        const q = (tagQuery || '').trim().toLowerCase();
        if (!q) return tagsOptions || [];
        return (tagsOptions || []).filter(t => t.name.toLowerCase().includes(q));
    }, [tagsOptions, tagQuery]);

    const renderMain = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <List.Accordion
                title="Sortuj według"
                expanded={sortAccordionExpanded}
                onPress={() => setSortAccordionExpanded(!sortAccordionExpanded)}
                left={(props) => <List.Icon {...props} icon="sort" />}
            >
                <RadioButton.Group
                    onValueChange={(value) => updateLocal({ sort: value })}
                    value={localFilters.sort}
                >
                    {SORT_OPTIONS.map((opt) => (
                        <RadioButton.Item
                            key={opt.value}
                            label={opt.label}
                            value={opt.value}
                        />
                    ))}
                </RadioButton.Group>
            </List.Accordion>
            <Divider />
            <List.Section title="Filtruj">
                <List.Item
                    title="Kategorie"
                    description={`${(localFilters.categoryIds || []).length} wybr.`}
                    onPress={() => setScreen('categories')}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                />
                <List.Item
                    title="Tagi"
                    description={`${(localFilters.tagIds || []).length} wybr.`}
                    onPress={() => setScreen('tags')}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                />
                <Text style={styles.label}>Status</Text>
                <SegmentedButtons
                    value={localFilters.status}
                    onValueChange={(value) => updateLocal({ status: value })}
                    buttons={[
                        { value: 'all', label: 'Wszystkie' },
                        { value: 'active', label: 'Aktywne' },
                        { value: 'inactive', label: 'Nieaktywne' },
                    ]}
                />
                <Text style={styles.label}>Typ transakcji</Text>
                <SegmentedButtons
                    value={localFilters.transactionType}
                    onValueChange={(value) =>
                        updateLocal({ transactionType: value })
                    }
                    buttons={[
                        { value: 'all', label: 'Wszystkie' },
                        { value: 'expense', label: 'Wydatki' },
                        { value: 'income', label: 'Wpływy' },
                    ]}
                />
                <Text style={styles.label}>Zakres kwot (PLN)</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        mode="outlined"
                        placeholder="Od"
                        value={localFilters.amountMin || ''}
                        onChangeText={(t) => updateLocal({ amountMin: t })}
                        keyboardType="numeric"
                        error={!validateAmount(localFilters.amountMin)}
                    />
                    <TextInput
                        style={styles.input}
                        mode="outlined"
                        placeholder="Do"
                        value={localFilters.amountMax || ''}
                        onChangeText={(t) => updateLocal({ amountMax: t })}
                        keyboardType="numeric"
                        error={!validateAmount(localFilters.amountMax)}
                    />
                </View>
                <Text style={styles.label}>Data Rozpoczęcia</Text>
                <View style={styles.inputRow}>
                    <PaperButton
                        mode="outlined"
                        onPress={() => setShowFromPicker(true)}
                    >
                        {localFilters.dateFrom
                            ? formatDateOnly(localFilters.dateFrom)
                            : 'Od'}
                    </PaperButton>
                    <PaperButton
                        mode="outlined"
                        onPress={() => setShowToPicker(true)}
                    >
                        {localFilters.dateTo
                            ? formatDateOnly(localFilters.dateTo)
                            : 'Do'}
                    </PaperButton>
                    {(localFilters.dateFrom || localFilters.dateTo) && (
                        <PaperButton
                            mode="text"
                            onPress={clearDates}
                            icon="close"
                        >
                            Wyczyść
                        </PaperButton>
                    )}
                </View>
            </List.Section>
        </ScrollView>
    );

    const renderCategories = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
                <Appbar.BackAction onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Kategorie</Text>
                <View style={{ width: 48 }} />
            </View>
            <Divider />
            <FlatList
                data={categoriesOptions}
                keyExtractor={c => String(c.id)}
                renderItem={({ item }) => {
                    const selected = (localFilters.categoryIds || []).includes(item.id);
                    return (
                        <List.Item
                            title={item.name}
                            titleStyle={styles.listTitle}
                            onPress={() => toggleCategory(item.id)}
                            left={() => (
                                <Avatar.Icon
                                    size={40}
                                    icon={item.iconName || 'folder'}
                                    style={{ backgroundColor: item.color ?? theme.colors.surfaceVariant }}
                                    color="#fff"
                                />
                            )}
                            right={() => (
                                <Checkbox.Android
                                    status={selected ? 'checked' : 'unchecked'}
                                    onPress={() => toggleCategory(item.id)}
                                />
                            )}
                            style={styles.categoryListItem}
                        />
                    );
                }}
                ItemSeparatorComponent={() => <Divider style={{ marginLeft: 72 }} />}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={styles.categoryListContent}
            />
        </View>
    );

    const renderTags = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
                <Appbar.BackAction onPress={() => setScreen('main')} />
                <Text style={styles.headerTitle}>Tagi</Text>
                <View style={{ width: 48 }} />
            </View>
            <Divider />
            <ScrollView contentContainerStyle={styles.tagsScrollContent} keyboardShouldPersistTaps="always">
                <TextInput
                    mode="outlined"
                    placeholder="Szukaj tagów..."
                    value={tagQuery}
                    onChangeText={setTagQuery}
                    returnKeyType="done"
                    blurOnSubmit={false}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{ margin: 12 }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
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
                                    selected && { backgroundColor: `${tag.color}20` },
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

    const renderContent = () => {
        if (screen === 'categories') return renderCategories();
        if (screen === 'tags') return renderTags();
        return renderMain();
    };

    return (
        <SafeAreaView
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            <Appbar.Header>
                <Appbar.Content
                    title={
                        screen === 'main'
                            ? 'Filtry i Sortowanie'
                            : screen === 'categories'
                                ? 'Kategorie'
                                : 'Tagi'
                    }
                />
                <Appbar.Action icon="close" onPress={onClose} />
            </Appbar.Header>
            {renderContent()}
            {showFromPicker && (
                <DateTimePicker
                    value={
                        new Date(
                            (localFilters.dateFrom || Date.now() / 1000) * 1000
                        )
                    }
                    mode="date"
                    display="default"
                    onChange={onChangeFrom}
                />
            )}
            {showToPicker && (
                <DateTimePicker
                    value={
                        new Date(
                            (localFilters.dateTo || Date.now() / 1000) * 1000
                        )
                    }
                    mode="date"
                    display="default"
                    onChange={onChangeTo}
                />
            )}
            <View
                style={[
                    styles.footer,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <PaperButton
                    onPress={() => setLocalFilters(createDefaultPeriodicFilters())}
                >
                    Wyczyść
                </PaperButton>
                <PaperButton
                    mode="contained"
                    onPress={() => {
                        if (screen === 'main') {
                            onApply(localFilters);
                        } else {
                            setScreen('main');
                        }
                    }}
                    disabled={!isFiltersValid}
                >
                    {screen === 'main' ? 'Zastosuj' : 'Zatwierdź'}
                </PaperButton>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    tagsScrollContent: { padding: 12, paddingBottom: 32 },
    label: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 12,
        fontWeight: '500',
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    input: { flex: 1, marginHorizontal: 4 },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    dot: { width: 24, height: 24, borderRadius: 12, margin: 8 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    headerTitle: {
        fontWeight: '500',
        fontSize: 18,
        flex: 1,
        textAlign: 'center',
    },
    listTitle: {
        fontWeight: '500',
    },
    categoryListItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    categoryListContent: {
        paddingBottom: 16,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
    },
});