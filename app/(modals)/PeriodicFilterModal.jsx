import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, FlatList } from 'react-native';
import { Appbar, Button as PaperButton, Divider, RadioButton, SegmentedButtons, Text, TextInput, Checkbox, List, Avatar, useTheme } from 'react-native-paper';
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

export default function PeriodicFilterModal({ initialFilters, onApply, onClose, categoriesOptions, tagsOptions }) {
    const theme = useTheme();
    const [localFilters, setLocalFilters] = useState(() => initialFilters ? { ...initialFilters } : createDefaultPeriodicFilters());
    const [screen, setScreen] = useState('main'); // 'main', 'categories', 'tags'
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [sortAccordionExpanded, setSortAccordionExpanded] = useState(false);

    const updateLocal = (patch) => setLocalFilters(prev => ({ ...prev, ...patch }));
    const toggleCategory = (catId) => updateLocal({ categoryIds: (localFilters.categoryIds || []).includes(catId) ? localFilters.categoryIds.filter(id => id !== catId) : [...(localFilters.categoryIds || []), catId] });
    const toggleTag = (tagId) => updateLocal({ tagIds: (localFilters.tagIds || []).includes(tagId) ? localFilters.tagIds.filter(t => t !== tagId) : [...(localFilters.tagIds || []), tagId] });

    const onChangeFrom = (_, selectedDate) => { setShowFromPicker(Platform.OS === 'ios'); if (selectedDate) { const d = new Date(selectedDate); d.setHours(0,0,0,0); updateLocal({ dateFrom: Math.floor(d.getTime() / 1000) }); }};
    const onChangeTo = (_, selectedDate) => { setShowToPicker(Platform.OS === 'ios'); if (selectedDate) { const d = new Date(selectedDate); d.setHours(23,59,59,999); updateLocal({ dateTo: Math.floor(d.getTime() / 1000) }); }};
    
    const renderMain = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <List.Accordion
                title="Sortuj według"
                expanded={sortAccordionExpanded}
                onPress={() => setSortAccordionExpanded(!sortAccordionExpanded)}
                left={props => <List.Icon {...props} icon="sort" />}
            >
                <RadioButton.Group onValueChange={value => updateLocal({ sort: value })} value={localFilters.sort}>
                    {SORT_OPTIONS.map(opt => (
                        <RadioButton.Item key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                </RadioButton.Group>
            </List.Accordion>
            <Divider />
            <List.Section title="Filtruj">
                 <List.Item title="Kategorie" description={`${(localFilters.categoryIds || []).length} wybr.`} onPress={() => setScreen('categories')} right={props => <List.Icon {...props} icon="chevron-right"/>}/>
                 <List.Item title="Tagi" description={`${(localFilters.tagIds || []).length} wybr.`} onPress={() => setScreen('tags')} right={props => <List.Icon {...props} icon="chevron-right"/>}/>
                 <Text style={styles.label}>Status</Text>
                 <SegmentedButtons value={localFilters.status} onValueChange={value => updateLocal({ status: value })} buttons={[{value: 'all', label: 'Wszystkie'}, {value: 'active', label: 'Aktywne'}, {value: 'inactive', label: 'Nieaktywne'}]} />
                 <Text style={styles.label}>Typ transakcji</Text>
                 <SegmentedButtons value={localFilters.transactionType} onValueChange={value => updateLocal({ transactionType: value })} buttons={[{value: 'all', label: 'Wszystkie'}, {value: 'expenditure', label: 'Wydatki'}, {value: 'income', label: 'Wpływy'}]} />
                 <Text style={styles.label}>Zakres kwot (PLN)</Text>
                 <View style={styles.inputRow}>
                     <TextInput style={styles.input} mode="outlined" placeholder="Od" value={localFilters.amountMin || ''} onChangeText={t => updateLocal({ amountMin: t })} keyboardType="numeric"/>
                     <TextInput style={styles.input} mode="outlined" placeholder="Do" value={localFilters.amountMax || ''} onChangeText={t => updateLocal({ amountMax: t })} keyboardType="numeric"/>
                 </View>
                 <Text style={styles.label}>Data Rozpoczęcia</Text>
                 <View style={styles.inputRow}>
                    <PaperButton mode="outlined" onPress={() => setShowFromPicker(true)}>{localFilters.dateFrom ? formatDateOnly(localFilters.dateFrom) : 'Od'}</PaperButton>
                    <PaperButton mode="outlined" onPress={() => setShowToPicker(true)}>{localFilters.dateTo ? formatDateOnly(localFilters.dateTo) : 'Do'}</PaperButton>
                 </View>
            </List.Section>
        </ScrollView>
    );

    const renderCategories = () => (
        <FlatList data={categoriesOptions} keyExtractor={c => String(c.id)} renderItem={({item}) => (
             <List.Item title={item.name} onPress={() => toggleCategory(item.id)} left={() => <Avatar.Icon size={40} icon={item.iconName} style={{backgroundColor: item.color}}/>} right={() => <Checkbox.Android status={(localFilters.categoryIds || []).includes(item.id) ? 'checked' : 'unchecked'}/>}/>
        )}/>
    );

    const renderTags = () => (
        <FlatList data={tagsOptions} keyExtractor={t => String(t.id)} renderItem={({item}) => (
            <List.Item title={item.name} onPress={() => toggleTag(item.id)} left={() => <View style={[styles.dot, {backgroundColor: item.color}]}/>} right={() => <Checkbox.Android status={(localFilters.tagIds || []).includes(item.id) ? 'checked' : 'unchecked'}/>}/>
        )}/>
    );

    const renderContent = () => {
        if (screen === 'categories') return renderCategories();
        if (screen === 'tags') return renderTags();
        return renderMain();
    }
    
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                {screen !== 'main' && <Appbar.BackAction onPress={() => setScreen('main')} />}
                <Appbar.Content title={screen === 'main' ? "Filtry i Sortowanie" : (screen === 'categories' ? "Wybierz kategorie" : "Wybierz tagi")} />
                <Appbar.Action icon="close" onPress={onClose} />
            </Appbar.Header>
            {renderContent()}
            {showFromPicker && <DateTimePicker value={new Date((localFilters.dateFrom || Date.now() / 1000) * 1000)} mode="date" display="default" onChange={onChangeFrom}/>}
            {showToPicker && <DateTimePicker value={new Date((localFilters.dateTo || Date.now() / 1000) * 1000)} mode="date" display="default" onChange={onChangeTo}/>}
            <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
                <PaperButton onPress={() => setLocalFilters(createDefaultPeriodicFilters())}>Wyczyść</PaperButton>
                <PaperButton 
                    mode="contained" 
                    onPress={() => {
                        if (screen === 'main') {
                            onApply(localFilters);
                        } else {
                            setScreen('main');
                        }
                    }}
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
    label: { marginTop: 16, marginBottom: 8, fontSize: 12, fontWeight: '500' },
    inputRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    input: { flex: 1, marginHorizontal: 4 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
    dot: { width: 24, height: 24, borderRadius: 12, margin: 8 },
});