import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, Button, Chip, useTheme } from 'react-native-paper';

// Funkcja pomocnicza do rozjaśniania kolorów dla tła
const lightenColor = (color, percent) => {
    if (!color) return '#e0e0e0';
    let f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
};


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

const SelectedTagChip = memo(({ tag, onRemove }) => {
    const chipBackgroundColor = lightenColor(tag.color, 0.8);
    const chipTextColor = tag.color || '#000000';

    return (
        <Chip
            onClose={() => onRemove(tag.name)}
            style={[styles.selectedChip, { backgroundColor: chipBackgroundColor }]}
            textStyle={{ color: chipTextColor, fontWeight: 'bold' }}
            closeIconProps={{ color: chipTextColor }}
            accessibilityLabel={`Usuń tag ${tag.name}`}
            accessible
        >
            {tag.name}
        </Chip>
    );
});


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
                            {tags.map(tagName => {
                                const tagObject = availableTags.find(t => t.name === tagName);
                                const displayTag = tagObject || { name: tagName, color: '#808080' };
                                return (
                                    <SelectedTagChip key={tagName} tag={displayTag} onRemove={handleRemoveTag} />
                                );
                            })}
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
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        width: '100%',
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 28,
        letterSpacing: 0.2,
    },
    selectedTagsSection: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
    },
    selectedTagsLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#666',
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    selectedTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectedChip: { marginRight: 0, marginBottom: 0 },
    tagSearchInput: { marginBottom: 16 },
    tagsList: { flex: 1, marginBottom: 16 },
    tagItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    tagItemSelected: { backgroundColor: '#f0f0f0', opacity: 0.6 },
    tagItemText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0.15,
    },
    tagItemTextSelected: { color: '#666' },
    tagSelectedIndicator: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
    emptyTagsContainer: { padding: 20, alignItems: 'center' },
    emptyTagsText: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 16,
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    createTagButton: { backgroundColor: '#2196F3', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    createTagButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0.15,
    },
    closeTagsButton: { marginTop: 8 },
});
