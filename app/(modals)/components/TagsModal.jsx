import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, Button, Chip, useTheme } from 'react-native-paper';

const TagItem = memo(({ item, isSelected, onSelectTag }) => (
    <TouchableOpacity
        style={[
            styles.tagItem,
            isSelected && styles.tagItemSelected
        ]}
        onPress={() => onSelectTag(item.name)}
        disabled={isSelected}
        accessibilityRole="button"
        accessible
        accessibilityLabel={`${item.name} ${isSelected ? ' (wybrany)' : ''}`}
    >
        <Text variant="bodyLarge" style={[styles.tagItemText, isSelected && styles.tagItemTextSelected]}>
            {item.name}
        </Text>
        {isSelected && <Text style={styles.tagSelectedIndicator}>✓</Text>}
    </TouchableOpacity>
));

const SelectedTagChip = memo(({ tag, onRemove }) => (
    <Chip
        onClose={() => onRemove(tag)}
        style={styles.selectedChip}
        accessibilityLabel={`Usuń tag ${tag}`}
        accessible
    >
        {tag}
    </Chip>
));

const EmptyTagsList = memo(({ localSearchText, availableTags, tags, onAddNewTag }) => (
    <View style={styles.emptyTagsContainer}>
        {localSearchText.trim() ? (
            <View>
                <Text style={styles.emptyTagsText}>
                    Brak tagów zawierających "{localSearchText}"
                </Text>
                {!availableTags.some(tag => tag.name.toLowerCase() === localSearchText.toLowerCase()) &&
                    !tags.includes(localSearchText.trim()) && (
                        <TouchableOpacity style={styles.createTagButton} onPress={() => onAddNewTag(localSearchText.trim())} accessibilityRole="button" accessibilityLabel={`Utwórz tag ${localSearchText}`}>
                            <Text style={styles.createTagButtonText}>
                                + Utwórz tag "{localSearchText.trim()}"
                            </Text>
                        </TouchableOpacity>
                    )}
            </View>
        ) : (
            <Text style={styles.emptyTagsText}>Brak dostępnych tagów</Text>
        )}
    </View>
));

function TagsModal({
    visible,
    onClose,
    tags,
    availableTags,
    filteredTags,
    tagSearchText,
    onTagSearchChange,
    onSelectTag,
    onAddNewTag
}) {
    const theme = useTheme();

    const [localSearchText, setLocalSearchText] = useState(tagSearchText);

    useEffect(() => {
        setLocalSearchText(tagSearchText);
    }, [tagSearchText]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (localSearchText !== tagSearchText) {
                onTagSearchChange(localSearchText);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [localSearchText, tagSearchText, onTagSearchChange]);

    const handleRemoveTag = useCallback((tagToRemove) => {
        onSelectTag(tagToRemove);
    }, [onSelectTag]);

    const renderTagItem = useCallback(({ item }) => (
        <TagItem item={item} isSelected={tags.includes(item.name)} onSelectTag={onSelectTag} />
    ), [tags, onSelectTag]);

    const keyExtractor = useCallback((item) => item.id.toString(), []);

    const renderEmptyComponent = useCallback(() => (
        <EmptyTagsList
            localSearchText={localSearchText}
            availableTags={availableTags}
            tags={tags}
            onAddNewTag={onAddNewTag}
        />
    ), [localSearchText, availableTags, tags, onAddNewTag]);

    if (!visible) return null;

    return (
        <View style={styles.absoluteOverlay}>
            <Pressable style={styles.pickerBackdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Zamknij modal tagów" />
            <View style={[styles.tagsModalContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.pickerTitle, { color: theme.colors.onBackground }]}>Wybierz lub dodaj tagi</Text>

                {tags.length > 0 && (
                    <View style={styles.selectedTagsSection}>
                        <Text style={styles.selectedTagsLabel}>Wybrane tagi:</Text>
                        <View style={styles.selectedTagsContainer}>
                            {tags.map(tag => (
                                <SelectedTagChip key={tag} tag={tag} onRemove={handleRemoveTag} />
                            ))}
                        </View>
                    </View>
                )}

                <TextInput
                    mode="outlined"
                    label="Wyszukaj lub wpisz nowy tag"
                    value={localSearchText}
                    onChangeText={setLocalSearchText}
                    style={styles.tagSearchInput}
                    accessibilityLabel="Wyszukaj lub wpisz nowy tag"
                    right={
                        localSearchText.trim() &&
                            !availableTags.some(tag => tag.name.toLowerCase() === localSearchText.toLowerCase()) &&
                            !tags.includes(localSearchText.trim()) ? (
                            <TextInput.Icon icon="plus" onPress={() => onAddNewTag(localSearchText)} accessibilityLabel="Dodaj nowy tag" />
                        ) : null
                    }
                />

                <FlatList
                    data={filteredTags}
                    keyExtractor={keyExtractor}
                    renderItem={renderTagItem}
                    style={styles.tagsList}
                    ListEmptyComponent={renderEmptyComponent}
                    windowSize={10}
                    maxToRenderPerBatch={10}
                    initialNumToRender={10}
                    removeClippedSubviews={true}
                    getItemLayout={(data, index) => ({
                        length: 48,
                        offset: 48 * index,
                        index,
                    })}
                    accessibilityRole="list"
                />

                <Button mode="outlined" onPress={onClose} style={styles.closeTagsButton} accessibilityLabel="Zamknij wybór tagów">Zamknij</Button>
            </View>
        </View>
    );
}

export default memo(TagsModal);

const styles = StyleSheet.create({
    absoluteOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, elevation: 1000 },
    pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    tagsModalContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, width: '100%',
    },
    pickerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    selectedTagsSection: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
    selectedTagsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#666' },
    selectedTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectedChip: { marginRight: 0, marginBottom: 0 },
    tagSearchInput: { marginBottom: 16 },
    tagsList: { flex: 1, marginBottom: 16 },
    tagItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc' },
    tagItemSelected: { backgroundColor: '#f0f0f0', opacity: 0.6 },
    tagItemText: { flex: 1 },
    tagItemTextSelected: { color: '#666' },
    tagSelectedIndicator: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
    emptyTagsContainer: { padding: 20, alignItems: 'center' },
    emptyTagsText: { textAlign: 'center', color: '#666', marginBottom: 16 },
    createTagButton: { backgroundColor: '#2196F3', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    createTagButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
    closeTagsButton: { marginTop: 8 },
});
