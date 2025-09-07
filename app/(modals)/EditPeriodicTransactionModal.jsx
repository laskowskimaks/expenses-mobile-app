import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Keyboard, Pressable } from 'react-native';
import { Appbar, Button, Text, TextInput, SegmentedButtons, useTheme, HelperText, Icon, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDb } from '@/context/DbContext';
import { getPeriodicTransactionById, updatePeriodicTransaction } from '@/services/periodicTransactionService';
import { getAllCategories } from '@/services/categoryService';
import { getAllTags } from '@/services/tagService';
import { formatDateOnly } from '@/utils/dateUtils';
import CategoryPicker from './components/CategoryPicker';
import TagsModal from './components/TagsModal';
import RepeatUnitPicker from './components/RepeatUnitPicker';
import useDebounce from '@/utils/useDebounce';

const REPEAT_UNITS = [
    { value: 'day', label: 'Dni', labelSingle: 'dzień', labelPlural: 'dni' },
    { value: 'week', label: 'Tygodnie', labelSingle: 'tydzień', labelPlural: 'tygodni' },
    { value: 'month', label: 'Miesiące', labelSingle: 'miesiąc', labelPlural: 'miesięcy' },
    { value: 'year', label: 'Lata', labelSingle: 'rok', labelPlural: 'lat' }
];

const getRepeatUnitLabel = (unit, interval) => {
    const unitData = REPEAT_UNITS.find(u => u.value === unit);
    if (!unitData) return '';

    const intervalNum = parseInt(interval, 10);
    if (intervalNum === 1) {
        return unitData.labelSingle;
    } else if (intervalNum >= 2 && intervalNum <= 4) {
        return unitData.labelPlural;
    } else {
        return unitData.labelPlural;
    }
};

const PeriodicSection = ({ form, updateForm, updateUi }) => {
    const theme = useTheme();
    return (
        <View style={[styles.periodicSection, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.intervalRow}>
                <View style={styles.intervalInput}>
                    <TextInput
                        mode="outlined"
                        label="Co ile"
                        value={form.repeatInterval}
                        onChangeText={(val) => updateForm('repeatInterval', val)}
                        keyboardType="numeric"
                        placeholder="1"
                        accessibilityLabel="Interwał powtarzania"
                    />
                </View>
                <Pressable
                    onPress={() => updateUi('isRepeatUnitPickerVisible', true)}
                    style={styles.unitSelector}
                    accessibilityRole="button"
                    accessibilityLabel="Wybierz jednostkę powtarzania"
                >
                    <View pointerEvents="none">
                        <TextInput
                            mode="outlined"
                            label="Jednostka"
                            value={getRepeatUnitLabel(form.repeatUnit, form.repeatInterval)}
                            editable={false}
                            right={<TextInput.Icon icon="chevron-down" />}
                        />
                    </View>
                </Pressable>
            </View>
            <View style={styles.endDateSection}>
                <Text variant="labelMedium" style={styles.subSectionTitle}>
                    Data zakończenia (opcjonalna)
                </Text>
                {form.endDate ? (
                    <View style={styles.endDateContainer}>
                        <Pressable
                            onPress={() => updateUi('showEndDatePicker', true)}
                            style={styles.endDateButton}
                            accessibilityRole="button"
                            accessibilityLabel="Wybierz datę zakończenia"
                        >
                            <Text>{form.endDate.toLocaleDateString('pl-PL')}</Text>
                            <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                        </Pressable>
                        <Button
                            mode="text"
                            onPress={() => updateForm('endDate', null)}
                            compact
                            icon="close"
                            accessibilityLabel="Usuń datę zakończenia"
                        >
                            Usuń
                        </Button>
                    </View>
                ) : (
                    <Button
                        mode="outlined"
                        onPress={() => updateUi('showEndDatePicker', true)}
                        icon="calendar-plus"
                        accessibilityLabel="Ustaw datę zakończenia"
                    >
                        Ustaw datę zakończenia
                    </Button>
                )}
            </View>
            <View style={styles.cyclePreview}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginBottom: 4 }}>
                    Podgląd:
                </Text>
                <Text variant="bodyMedium">
                    Co {form.repeatInterval} {getRepeatUnitLabel(form.repeatUnit, form.repeatInterval)},
                    począwszy od {form.startDate.toLocaleDateString('pl-PL')}
                    {form.endDate && `, do ${form.endDate.toLocaleDateString('pl-PL')}`}
                </Text>
            </View>
        </View>
    );
};

export default function EditPeriodicTransactionModal() {
    const theme = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { db } = useDb();

    const [form, setForm] = useState({
        title: '', amount: '', type: 'expenditure', selectedCategory: null, tags: [],
        repeatInterval: '1', repeatUnit: 'month', startDate: new Date(), endDate: null, description: '', startTime: new Date()
    });
    const [ui, setUi] = useState({
        isSaving: false, tagSearchText: '', isTagsModalVisible: false, isRepeatUnitPickerVisible: false,
        showStartDatePicker: false, showEndDatePicker: false, showStartTimePicker: false
    });

    const [categories, setCategories] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const categorySheetRef = useRef(null);
    const debouncedTagSearch = useDebounce(ui.tagSearchText, 300);

    useEffect(() => {
        const loadInitialData = async () => {
            if (db && params.transactionId) {
                const [cats, allTags, transactionData] = await Promise.all([
                    getAllCategories(db),
                    getAllTags(db),
                    getPeriodicTransactionById(db, parseInt(params.transactionId))
                ]);
                setCategories(cats);
                setAvailableTags(allTags);

                if (transactionData) {
                    const category = cats.find(c => c.id === transactionData.categoryId);

                    let startDate, endDate = null;
                    let startTime;

                    if (params.editMode === 'future') {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        startDate = today;
                        
                        const originalTime = new Date(transactionData.startDate * 1000);
                        startTime = new Date();
                        startTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);

                        if (transactionData.endDate) {
                            const templateStart = new Date(transactionData.startDate * 1000);
                            templateStart.setHours(0, 0, 0, 0);

                            const templateEnd = new Date(transactionData.endDate * 1000);
                            templateEnd.setHours(0, 0, 0, 0);

                            const diffDays = Math.round((templateEnd - templateStart) / (1000 * 60 * 60 * 24));
                            endDate = new Date(today.getTime() + diffDays * 24 * 60 * 60 * 1000);
                        }
                    } else {
                        startDate = new Date(transactionData.startDate * 1000);
                        startDate.setHours(0, 0, 0, 0);
                        
                        const originalDateTime = new Date(transactionData.startDate * 1000);
                        startTime = new Date();
                        startTime.setHours(originalDateTime.getHours(), originalDateTime.getMinutes(), 0, 0);

                        if (transactionData.endDate) {
                            endDate = new Date(transactionData.endDate * 1000);
                            endDate.setHours(0, 0, 0, 0);
                        }
                    }

                    setForm({
                        title: transactionData.title,
                        amount: String(Math.abs(transactionData.amount)),
                        type: transactionData.amount < 0 ? 'expenditure' : 'income',
                        selectedCategory: category || null,
                        tags: (transactionData.tags || []).map(t => t.name),
                        repeatInterval: String(transactionData.repeatInterval),
                        repeatUnit: transactionData.repeatUnit,
                        startDate: startDate,
                        endDate: endDate,
                        description: transactionData.notes || '',
                        startTime: startTime
                    });
                } else {
                    Alert.alert("Błąd", "Nie znaleziono transakcji.", [{ text: "OK", onPress: () => router.back() }]);
                }
            }
        };
        loadInitialData();
    }, [db, params.transactionId, params.editMode]);

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const updateUi = (key, value) => setUi(prev => ({ ...prev, [key]: value }));

    const handleOpenCategoryPicker = () => {
        categorySheetRef.current?.snapToIndex(1);
    };

    const handleRemoveTag = (tagToRemove) => {
        const newTags = form.tags.filter(tag => tag !== tagToRemove);
        updateForm('tags', newTags);
    };

    const handleSelectTag = (tagName) => {
        const newTags = form.tags.includes(tagName)
            ? form.tags.filter(t => t !== tagName)
            : [...form.tags, tagName];
        updateForm('tags', newTags);
    };

    const handleAddNewTag = (tagName) => {
        if (tagName && !form.tags.includes(tagName)) {
            updateForm('tags', [...form.tags, tagName]);
        }
        updateUi('tagSearchText', '');
    };

    const handleSave = async () => {
        Keyboard.dismiss();
        if (!form.title.trim() || !form.amount || !form.selectedCategory) {
            Alert.alert("Błąd", "Tytuł, kwota i kategoria są wymagane.");
            return;
        }

        updateUi('isSaving', true);
        
        // Połącz datę i czas
        const finalStartDate = new Date(
            form.startDate.getFullYear(),
            form.startDate.getMonth(),
            form.startDate.getDate(),
            form.startTime.getHours(),
            form.startTime.getMinutes()
        );

        const result = await updatePeriodicTransaction({
            db,
            id: parseInt(params.transactionId),
            data: { 
                ...form, 
                categoryId: form.selectedCategory.id,
                startDate: finalStartDate
            },
            mode: params.editMode 
        });
        updateUi('isSaving', false);

        if (result.success) {
            router.back();
        } else {
            Alert.alert("Błąd", result.message || "Nie udało się zapisać zmian.");
        }
    };

    const filteredTags = useMemo(() => {
        if (!debouncedTagSearch) return availableTags;
        return availableTags.filter(tag => tag.name.toLowerCase().includes(debouncedTagSearch.toLowerCase()));
    }, [availableTags, debouncedTagSearch]);

    return (
        <>
            <Pressable
                style={styles.backdrop}
                onPress={() => router.back()}
                accessible={false}
            />
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <Text variant="headlineMedium" style={styles.headerTitle}>
                        Edytuj Transakcję Cykliczną
                    </Text>

                    <SegmentedButtons
                        value={form.type}
                        onValueChange={updateForm.bind(null, 'type')}
                        buttons={[
                            { value: 'income', label: 'Wpływ', icon: 'arrow-down' },
                            { value: 'expenditure', label: 'Wydatek', icon: 'arrow-up' }
                        ]}
                        style={styles.formField}
                    />

                    <TextInput
                        mode="outlined"
                        label="Tytuł"
                        value={form.title}
                        onChangeText={(val) => updateForm('title', val)}
                        style={styles.formField}
                        accessibilityLabel="Tytuł transakcji"
                    />

                    <Pressable
                        onPress={handleOpenCategoryPicker}
                        accessibilityRole="button"
                        accessibilityLabel="Otwórz wybór kategorii"
                    >
                        <View pointerEvents="none">
                            <TextInput
                                mode="outlined"
                                label="Kategoria"
                                value={form.selectedCategory?.name || ''}
                                placeholder="Wybierz kategorię"
                                editable={false}
                                left={form.selectedCategory && (
                                    <TextInput.Icon
                                        icon={() => (
                                            <View style={[styles.selectedCategoryIcon, { backgroundColor: form.selectedCategory.color || theme.colors.onSurface }]}>
                                                <MaterialCommunityIcons name={form.selectedCategory.iconName || 'help-circle'} size={16} color="white" />
                                            </View>
                                        )}
                                    />
                                )}
                                right={<TextInput.Icon icon="chevron-down" />}
                                style={styles.formField}
                            />
                        </View>
                    </Pressable>

                    <TextInput
                        mode="outlined"
                        label="Kwota"
                        value={form.amount}
                        onChangeText={(val) => updateForm('amount', val)}
                        keyboardType="decimal-pad"
                        style={styles.formField}
                        accessibilityLabel="Kwota transakcji"
                    />
                    <HelperText type="info" style={styles.helperText}>
                        <Icon source="information-outline" size={14} />
                        {' '}Zmiana daty może dodać lub usunąć historyczne transakcje.
                    </HelperText>
                    <View style={styles.dateTimeRow}>
                        <View style={styles.dateInput}>
                            <Pressable
                                onPress={() => updateUi('showStartDatePicker', true)}
                                accessibilityRole="button"
                                accessibilityLabel="Wybierz datę rozpoczęcia"
                            >
                                <View pointerEvents="none">
                                    <TextInput
                                        mode="outlined"
                                        label="Data rozpoczęcia"
                                        value={form.startDate.toLocaleDateString('pl-PL')}
                                        editable={false}
                                        right={<TextInput.Icon icon="calendar" />}
                                    />
                                </View>
                            </Pressable>
                        </View>
                        <View style={styles.timeInput}>
                            <Pressable
                                onPress={() => updateUi('showStartTimePicker', true)}
                                accessibilityRole="button"
                                accessibilityLabel="Wybierz godzinę rozpoczęcia"
                            >
                                <View pointerEvents="none">
                                    <TextInput
                                        mode="outlined"
                                        label="Godzina"
                                        value={form.startTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                        editable={false}
                                        right={<TextInput.Icon icon="clock-outline" />}
                                    />
                                </View>
                            </Pressable>
                        </View>
                    </View>

                    <PeriodicSection
                        form={form}
                        updateForm={updateForm}
                        updateUi={updateUi}
                    />

                    <TextInput
                        mode="outlined"
                        label="Opis (opcjonalny)"
                        value={form.description}
                        onChangeText={(val) => updateForm('description', val)}
                        multiline
                        numberOfLines={3}
                        style={styles.formField}
                        accessibilityLabel="Opis transakcji"
                    />

                    <View style={styles.tagsSection}>
                        <Text variant="labelLarge" style={styles.sectionTitle}>
                            Tagi
                        </Text>
                        <Pressable
                            onPress={() => updateUi('isTagsModalVisible', true)}
                            accessibilityRole="button"
                            accessibilityLabel="Otwórz wybór tagów"
                        >
                            <View pointerEvents="none">
                                <TextInput
                                    mode="outlined"
                                    label="Dodaj tagi"
                                    placeholder="Kliknij aby wybrać lub dodać tagi"
                                    editable={false}
                                    right={<TextInput.Icon icon="plus-circle-outline" />}
                                />
                            </View>
                        </Pressable>
                        {form.tags.length > 0 && (
                            <View style={styles.tagsDisplayContainer}>
                                {form.tags.map(tag => (
                                    <Chip
                                        key={tag}
                                        onClose={() => handleRemoveTag(tag)}
                                        style={styles.chip}
                                        accessibilityLabel={`Usuń tag ${tag}`}
                                        accessible
                                    >
                                        {tag}
                                    </Chip>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
                    <Button
                        mode="outlined"
                        onPress={() => router.back()}
                        style={styles.flexOne}
                        accessibilityLabel="Anuluj i wróć"
                    >
                        Anuluj
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        disabled={ui.isSaving}
                        loading={ui.isSaving}
                        style={[styles.flexOne, { marginLeft: 12 }]}
                        accessibilityLabel="Zapisz zmiany"
                    >
                        Zapisz Zmiany
                    </Button>
                </View>

                <CategoryPicker bottomSheetRef={categorySheetRef} categories={categories} selectedCategory={form.selectedCategory} onSelectCategory={(cat) => updateForm('selectedCategory', cat)} isLoading={false} />
                <TagsModal visible={ui.isTagsModalVisible} onClose={() => updateUi('isTagsModalVisible', false)} tags={form.tags} availableTags={availableTags} filteredTags={filteredTags} tagSearchText={ui.tagSearchText} onTagSearchChange={(val) => updateUi('tagSearchText', val)} onSelectTag={handleSelectTag} onAddNewTag={handleAddNewTag} />
                <RepeatUnitPicker visible={ui.isRepeatUnitPickerVisible} onClose={() => updateUi('isRepeatUnitPickerVisible', false)} repeatUnits={REPEAT_UNITS} selectedUnit={form.repeatUnit} onSelectUnit={(unit) => { updateForm('repeatUnit', unit); updateUi('isRepeatUnitPickerVisible', false) }} />

                {ui.showStartDatePicker && <DateTimePicker value={form.startDate} mode="date" display="default" onChange={(e, d) => {updateUi('showStartDatePicker', false); if(d) updateForm('startDate', d)}} />}
                {ui.showStartTimePicker && <DateTimePicker value={form.startTime} mode="time" display="default" onChange={(e, t) => {updateUi('showStartTimePicker', false); if(t) updateForm('startTime', t)}} />}
                {ui.showEndDatePicker && <DateTimePicker value={form.endDate || new Date()} mode="date" display="default" onChange={(e, d) => {updateUi('showEndDatePicker', false); if(d) updateForm('endDate', d)}} minimumDate={form.startDate}/>}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    flexOne: { flex: 1 },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    scrollContainer: {
        padding: 24,
        paddingBottom: 100,
    },
    headerTitle: {
        textAlign: 'center',
        marginBottom: 24,
        fontWeight: '600',
    },
    formField: {
        marginBottom: 16,
    },
    selectedCategoryIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateTimeRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    dateInput: {
        flex: 2,
    },
    timeInput: {
        flex: 1,
    },
    helperText: {
        marginTop: 6,
        marginBottom: 8,
    },
    periodicSection: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    intervalRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    intervalInput: {
        flex: 1,
    },
    unitSelector: {
        flex: 1.5,
    },
    endDateSection: {
        marginBottom: 16,
    },
    subSectionTitle: {
        marginBottom: 8,
        fontWeight: '500',
    },
    endDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    endDateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 1,
        borderRadius: 4,
        borderColor: 'rgba(0,0,0,0.38)',
    },
    cyclePreview: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    tagsSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 8,
        fontWeight: '500',
    },
    tagsDisplayContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    chip: {
        marginBottom: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        gap: 12,
    },
});