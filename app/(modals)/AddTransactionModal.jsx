import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Alert, Platform, KeyboardAvoidingView, InteractionManager } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Switch, Chip } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useDb } from '@/context/DbContext';
import { addTransaction } from '@/services/transactionService';
import { addPeriodicTransaction, processPeriodicTransactions } from '@/services/periodicTransactionService';
import { getAllCategories } from '@/services/categoryService';
import { getAllTags } from '@/services/tagService';
import { eventEmitter } from '@/utils/eventEmitter';

import CategoryPicker from './components/CategoryPicker';
import TagsModal from './components/TagsModal';
import RepeatUnitPicker from './components/RepeatUnitPicker';
import { useTransactionForm } from '@/utils/useTransactionForm';

const REPEAT_UNITS = [
  { value: 'day', label: 'Dni', labelSingle: 'dzień', labelPlural: 'dni' },
  { value: 'week', label: 'Tygodnie', labelSingle: 'tydzień', labelPlural: 'tygodni' },
  { value: 'month', label: 'Miesiące', labelSingle: 'miesiąc', labelPlural: 'miesięcy' },
  { value: 'year', label: 'Lata', labelSingle: 'rok', labelPlural: 'lat' }
];

export default function AddTransactionModal() {
  const theme = useTheme();
  const router = useRouter();
  const { db } = useDb();

  const { state, actions, isButtonDisabled, debouncedTagSearchText } = useTransactionForm();

  const categoryBottomSheetRef = useRef(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!db) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        if (mounted) setIsLoading(true);
        const [cats, tags] = await Promise.all([getAllCategories(db), getAllTags(db)]);
        if (!mounted) return;
        setAvailableCategories(cats || []);
        setAvailableTags(tags || []);
      } catch (err) {
        console.error('fetchData error', err);
        if (mounted) Alert.alert('Błąd', 'Nie udało się pobrać danych początkowych.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    const task = InteractionManager.runAfterInteractions(() => {
      fetchData();
    });

    return () => {
      mounted = false;
    };
  }, [db]);

  const filteredTags = useMemo(() => {
    const q = (debouncedTagSearchText || '').trim().toLowerCase();
    if (!q) {
      return availableTags.filter(t => !state.tags.includes(t.name));
    }
    return availableTags.filter(t => t.name.toLowerCase().includes(q) && !state.tags.includes(t.name));
  }, [availableTags, debouncedTagSearchText, state.tags]);

  const handleSelectCategory = useCallback((category) => {
    actions.setSelectedCategory(category);
  }, [actions]);

  const handleOpenCategoryPicker = useCallback(() => {
    categoryBottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleOpenTagsModal = useCallback(() => {
    actions.setTagSearchText('');
    actions.toggleTagsModal(true);
  }, [actions]);

  const handleSelectTag = useCallback((tagName) => {
    if (state.tags.includes(tagName)) actions.removeTag(tagName);
    else actions.addTag(tagName);
    actions.setTagSearchText('');
  }, [actions, state.tags]);

  const handleRemoveTag = useCallback((tagName) => {
    actions.removeTag(tagName);
  }, [actions]);

  const handleAddNewTag = useCallback((tagName) => {
    const trimmed = (tagName || '').trim();
    if (!trimmed || state.tags.includes(trimmed)) return;

    const existing = availableTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (!existing) {
      const newTag = { id: `tmp-${Date.now()}`, name: trimmed };
      setAvailableTags(prev => [...prev, newTag]);
    }
    actions.addTag(trimmed);
    actions.setTagSearchText('');
  }, [availableTags, actions, state.tags]);

  const handleSelectRepeatUnit = useCallback((unit) => {
    actions.setRepeatUnit(unit);
    actions.toggleRepeatUnitPicker(false);
  }, [actions]);

  const getRepeatUnitLabel = useCallback((unit, interval) => {
    const cfg = REPEAT_UNITS.find(r => r.value === unit);
    if (!cfg) return unit;
    const n = parseInt(interval, 10) || 1;
    return n === 1 ? cfg.labelSingle : cfg.labelPlural;
  }, []);

  const onDateChange = useCallback((event, selectedDate) => {
    actions.toggleDatePicker(false);
    if (event?.type === 'set' && selectedDate) {
      actions.setDate(selectedDate);
    }
  }, [actions]);

  const onTimeChange = useCallback((event, selectedTime) => {
    actions.toggleTimePicker(false);
    if (event?.type === 'set' && selectedTime) {
      actions.setTime(selectedTime);
    }
  }, [actions]);

  const onEndDateChange = useCallback((event, selectedDate) => {
    actions.toggleEndDatePicker(false);
    if (event?.type === 'set' && selectedDate) {
      actions.setEndDate(selectedDate);
    }
  }, [actions]);

  const handleAddTransaction = useCallback(async () => {
    if (isButtonDisabled || state.isSaving) return;
    if (!state.selectedCategory?.id) {
      Alert.alert('Błąd', 'Wybierz kategorię.');
      return;
    }
    if (state.isPeriodic) {
      const intervalInt = parseInt(state.repeatInterval, 10);
      if (isNaN(intervalInt) || intervalInt < 1 || intervalInt > 1000) {
        Alert.alert('Błąd', 'Interwał powtórzeń musi być liczbą całkowitą od 1 do 1000.');
        return;
      }
    }

    actions.setIsSaving(true);
    try {
      const finalDateTime = new Date(
        state.date.getFullYear(),
        state.date.getMonth(),
        state.date.getDate(),
        state.time.getHours(),
        state.time.getMinutes()
      );
      const amountNumber = parseFloat((state.amount || '').replace(',', '.'));

      if (state.isPeriodic) {
        const data = {
          type: state.type,
          title: state.title,
          categoryId: state.selectedCategory.id,
          categoryName: state.selectedCategory.name,
          amount: amountNumber,
          repeatInterval: parseInt(state.repeatInterval, 10),
          repeatUnit: state.repeatUnit,
          startDate: finalDateTime,
          endDate: state.endDate,
          description: state.description,
          location: state.location,
          tags: state.tags
        };
        const res = await addPeriodicTransaction(db, data);
        if (res.success) {
          try {
            const periodicResult = await processPeriodicTransactions(db);
            let msg = 'Transakcja cykliczna została dodana!';
            if (periodicResult.success && periodicResult.addedCount > 0) {
              msg += `\n\nDodano automatycznie ${periodicResult.addedCount} nowych transakcji.`;
              eventEmitter.emit('transactionAdded', { timestamp: Date.now(), count: periodicResult.addedCount, type: 'automatic' });
            }
            Alert.alert('Sukces', msg, [{ text: 'OK', onPress: () => router.back() }]);
          } catch (err) {
            console.error(err);
            Alert.alert('Sukces', 'Transakcja cykliczna została dodana!\n\nUwaga: Błąd przy automatycznym tworzeniu transakcji.', [{ text: 'OK', onPress: () => router.back() }]);
          }
          eventEmitter.emit('periodicTransactionAdded', {
            periodicTransactionId: res.periodicTransactionId,
            timestamp: Date.now(),
            title: state.title,
            amount: amountNumber,
            type: state.type,
            repeatInterval: state.repeatInterval,
            repeatUnit: state.repeatUnit
          });
        } else {
          Alert.alert('Błąd', res.message || 'Błąd dodawania cyklicznej.');
        }
      } else {
        const transactionData = {
          type: state.type,
          title: state.title,
          categoryId: state.selectedCategory.id,
          categoryName: state.selectedCategory.name,
          amount: amountNumber,
          date: finalDateTime,
          description: state.description,
          location: state.location,
          tags: state.tags
        };
        const result = await addTransaction(db, transactionData);
        if (result.success) {
          eventEmitter.emit('transactionAdded', {
            transactionId: result.transactionId,
            timestamp: Date.now(),
            title: state.title,
            amount: amountNumber,
            type: state.type
          });
          router.back();
        } else {
          Alert.alert('Błąd', result.message || 'Błąd dodawania transakcji.');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Nieoczekiwany błąd.');
    } finally {
      actions.setIsSaving(false);
    }
  }, [isButtonDisabled, state, actions, db, router]);

  return (
    <>
      <Pressable style={styles.backdrop} onPress={() => router.back()} accessible={false} />

      <View
        style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <SegmentedButtons
            value={state.type}
            onValueChange={actions.setType}
            buttons={[
              { value: 'deposit', label: 'Wpłata', icon: 'arrow-down' },
              { value: 'expenditure', label: 'Wydatek', icon: 'arrow-up' },
            ]}
            style={styles.formField}
          />

          <TextInput
            mode="outlined"
            label="Tytuł"
            value={state.title}
            onChangeText={actions.setTitle}
            style={styles.formField}
            accessibilityLabel="Tytuł transakcji"
          />

          <Pressable onPress={handleOpenCategoryPicker} disabled={isLoading} accessibilityRole="button" accessibilityLabel="Otwórz wybór kategorii">
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label="Kategoria"
                value={state.selectedCategory?.name || ''}
                placeholder={isLoading ? "Ładowanie kategorii..." : "Wybierz kategorię"}
                editable={false}
                left={state.selectedCategory && (
                  <TextInput.Icon
                    icon={() => (
                      <View style={[styles.selectedCategoryIcon, { backgroundColor: state.selectedCategory.color || theme.colors.onSurface }]}>
                        <MaterialCommunityIcons name={state.selectedCategory.iconName || 'help-circle'} size={16} color="white" />
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
            value={state.amount}
            onChangeText={actions.setAmount}
            keyboardType="decimal-pad"
            style={styles.formField}
            accessibilityLabel="Kwota transakcji"
          />

          <View style={styles.dateTimeRow}>
            <View style={styles.dateInput}>
              <Pressable onPress={() => actions.toggleDatePicker(true)} accessibilityRole="button" accessibilityLabel="Wybierz datę">
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    label={state.isPeriodic ? "Data pierwszego wystąpienia" : "Data"}
                    value={state.date.toLocaleDateString('pl-PL')}
                    editable={false}
                    right={<TextInput.Icon icon="calendar" />}
                  />
                </View>
              </Pressable>
            </View>

            <View style={styles.timeInput}>
              <Pressable onPress={() => actions.toggleTimePicker(true)} accessibilityRole="button" accessibilityLabel="Wybierz godzinę">
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    label="Godzina"
                    value={state.time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    editable={false}
                    right={<TextInput.Icon icon="clock-outline" />}
                  />
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text variant="bodyLarge">Transakcja cykliczna</Text>
            <Switch value={state.isPeriodic} onValueChange={actions.setIsPeriodic} accessibilityLabel="Przełącznik transakcji cyklicznej" />
          </View>

          {state.isPeriodic && (
            <View style={[styles.periodicSection, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={styles.intervalRow}>
                <View style={styles.intervalInput}>
                  <TextInput
                    mode="outlined"
                    label="Co ile"
                    value={state.repeatInterval}
                    onChangeText={actions.setRepeatInterval}
                    keyboardType="numeric"
                    placeholder="1"
                    accessibilityLabel="Interwał powtarzania"
                  />
                </View>

                <Pressable onPress={() => actions.toggleRepeatUnitPicker(true)} style={styles.unitSelector} accessibilityRole="button" accessibilityLabel="Wybierz jednostkę powtarzania">
                  <View pointerEvents="none">
                    <TextInput
                      mode="outlined"
                      label="Jednostka"
                      value={getRepeatUnitLabel(state.repeatUnit, state.repeatInterval)}
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
                {state.endDate ? (
                  <View style={styles.endDateContainer}>
                    <Pressable onPress={() => actions.toggleEndDatePicker(true)} style={styles.endDateButton} accessibilityRole="button" accessibilityLabel="Wybierz datę zakończenia">
                      <Text>{state.endDate.toLocaleDateString('pl-PL')}</Text>
                      <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                    </Pressable>
                    <Button
                      mode="text"
                      onPress={actions.removeEndDate}
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
                    onPress={() => actions.toggleEndDatePicker(true)}
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
                  Co {state.repeatInterval} {getRepeatUnitLabel(state.repeatUnit, state.repeatInterval)},
                  począwszy od {state.date.toLocaleDateString('pl-PL')} o {state.time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                  {state.endDate && `, do ${state.endDate.toLocaleDateString('pl-PL')}`}
                </Text>
              </View>
            </View>
          )}

          <TextInput
            mode="outlined"
            label="Opis (opcjonalny)"
            value={state.description}
            onChangeText={actions.setDescription}
            multiline
            numberOfLines={3}
            style={styles.formField}
            accessibilityLabel="Opis transakcji"
          />

          <TextInput
            mode="outlined"
            label="Lokalizacja (opcjonalna)"
            value={state.location}
            onChangeText={actions.setLocation}
            style={styles.formField}
            accessibilityLabel="Lokalizacja"
          />

          <View style={styles.tagsSection}>
            <Text variant="labelLarge" style={styles.sectionTitle}>Tagi</Text>

            <Pressable onPress={handleOpenTagsModal} accessibilityRole="button" accessibilityLabel="Otwórz wybór tagów">
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

            {state.tags.length > 0 && (
              <View style={styles.tagsDisplayContainer}>
                {state.tags.map(tag => (
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
            onPress={handleAddTransaction}
            disabled={isButtonDisabled || state.isSaving}
            loading={state.isSaving}
            style={[styles.flexOne, { marginLeft: 12 }]}
            accessibilityLabel={state.isPeriodic ? 'Dodaj transakcję cykliczną' : 'Dodaj transakcję'}
          >
            {state.isPeriodic ? 'Dodaj Cykliczną' : 'Dodaj Transakcję'}
          </Button>
        </View>
      </View>

      {/* Pickery i modale */}
      <CategoryPicker
        bottomSheetRef={categoryBottomSheetRef}
        categories={availableCategories}
        selectedCategory={state.selectedCategory}
        onSelectCategory={handleSelectCategory}
        isLoading={isLoading}
      />
      <TagsModal
        visible={state.isTagsModalVisible}
        onClose={() => actions.toggleTagsModal(false)}
        tags={state.tags}
        availableTags={availableTags}
        filteredTags={filteredTags}
        tagSearchText={state.tagSearchText}
        onTagSearchChange={actions.setTagSearchText}
        onSelectTag={handleSelectTag}
        onAddNewTag={handleAddNewTag}
      />
      <RepeatUnitPicker
        visible={state.isRepeatUnitPickerVisible}
        onClose={() => actions.toggleRepeatUnitPicker(false)}
        repeatUnits={REPEAT_UNITS}
        onSelectUnit={handleSelectRepeatUnit}
        selectedUnit={state.repeatUnit}
      />
      {state.showDatePicker && (
        <DateTimePicker value={state.date} mode="date" display="default" onChange={onDateChange} />
      )}
      {state.showTimePicker && (
        <DateTimePicker value={state.time} mode="time" display="default" onChange={onTimeChange} />
      )}
      {state.showEndDatePicker && (
        <DateTimePicker
          value={state.endDate ?? state.date}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          minimumDate={state.date}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '95%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden'
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  formField: { marginBottom: 16 },
  dateTimeRow: { flexDirection: 'row', marginBottom: 16 },
  dateInput: { flex: 2, marginRight: 12 },
  timeInput: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 4, marginBottom: 8, minHeight: 40 },
  periodicSection: { padding: 16, borderRadius: 12, marginBottom: 12 },
  intervalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  intervalInput: { flex: 1, marginRight: 12 },
  unitSelector: { flex: 2 },
  endDateSection: { marginBottom: 16 },
  endDateContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  endDateButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, flex: 1, marginRight: 8, justifyContent: 'space-between' },
  cyclePreview: { padding: 12, borderRadius: 8, borderLeftWidth: 3 },
  sectionTitle: { marginBottom: 12 },
  subSectionTitle: { marginBottom: 8 },
  tagsSection: { marginBottom: 16 },
  tagsDisplayContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  chip: { marginRight: 8, marginBottom: 8 },
  selectedCategoryIcon: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  footer: {

    flexDirection: 'row',
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});