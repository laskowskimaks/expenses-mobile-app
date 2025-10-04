import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme, Text, IconButton } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDb } from '@/context/DbContext';
import { getAllTagsWithCount } from '@/services/tagService';
import TagList from './components/TagList';
import AddEditTag from './components/AddEditTag';

export default function ManageTagsModal() {
    const theme = useTheme();
    const router = useRouter();
    const { db } = useDb();
    const [tags, setTags] = useState([]);
    const [currentView, setCurrentView] = useState('list');
    const [selectedTag, setSelectedTag] = useState(null);
    const [error, setError] = useState(null);

    const fetchTags = useCallback(async () => {
        if (db) {
            try {
                const data = await getAllTagsWithCount(db);
                setTags(data);
                setError(null);
            } catch (err) {
                setError("Nie udało się pobrać tagów.");
            }
        }
    }, [db]);

    useFocusEffect(
        useCallback(() => {
            fetchTags();
        }, [fetchTags])
    );

    const handleAddNew = () => {
        setSelectedTag(null);
        setCurrentView('form');
    };

    const handleSelectTag = (tag) => {
        setSelectedTag(tag);
        setCurrentView('form');
    };

    const handleBackToList = async (saveError) => {
        setCurrentView('list');
        setSelectedTag(null);
        if (saveError) {
            setError(saveError);
            return;
        }
        await fetchTags();
    };

    const getTitle = () => {
        if (currentView === 'list') return "Zarządzaj tagami";
        if (selectedTag) return "Edytuj tag";
        return "Nowy tag";
    };

    return (
        <>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    {currentView === 'form' && (
                        <IconButton icon="arrow-left" size={24} onPress={handleBackToList} style={styles.backButton} />
                    )}
                    <Text variant="headlineMedium" style={styles.headerTitle}>{getTitle()}</Text>
                </View>

                {error && (
                    <View style={{ padding: 12 }}>
                        <Text style={{ color: theme.colors.error }}>{error}</Text>
                    </View>
                )}

                {currentView === 'list' ? (
                    <View style={styles.content}>
                        <TagList
                            tags={tags}
                            onSelectTag={handleSelectTag}
                            onAddNew={handleAddNew}
                        />
                    </View>
                ) : (
                    <View style={styles.content}>
                        <AddEditTag tag={selectedTag} onSave={handleBackToList} />
                    </View>
                )}

                {currentView === 'list' && (
                    <View style={styles.footer}>
                        <Pressable onPress={() => router.back()}>
                            <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Zamknij</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backButton: {
        position: 'absolute',
        left: 10,
    },
    headerTitle: {
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    }
});