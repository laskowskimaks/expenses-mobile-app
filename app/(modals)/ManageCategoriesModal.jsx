import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme, Text, IconButton } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDb } from '@/context/DbContext';
import { getAllCategories } from '@/services/categoryService';
import CategoryList from '../../components/lists/CategoryList';
import AddEditCategory from '../../components/AddEditCategory';

export default function ManageCategoriesModal() {
    const theme = useTheme();
    const router = useRouter();
    const { db } = useDb();
    const [categories, setCategories] = useState([]);
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [error, setError] = useState(null);

    const fetchCategories = useCallback(async () => {
        if (db) {
            try {
                const data = await getAllCategories(db);
                setCategories(data);
                setError(null);
            } catch (err) {
                setError("Nie udało się pobrać kategorii.");
            }
        }
    }, [db]);

    useFocusEffect(
        useCallback(() => {
            fetchCategories();
        }, [fetchCategories])
    );

    const handleAddNew = () => {
        setSelectedCategory(null);
        setCurrentView('form');
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        setCurrentView('form');
    };

    const handleBackToList = async (saveError) => {
        setCurrentView('list');
        setSelectedCategory(null);
        if (saveError) {
            setError(saveError);
            return;
        }
        await fetchCategories();
    };

    const getTitle = () => {
        if (currentView === 'list') return "Zarządzaj kategoriami";
        if (selectedCategory) return "Edytuj kategorię";
        return "Nowa kategoria";
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
                        <CategoryList
                            categories={categories}
                            onSelectCategory={handleSelectCategory}
                            onAddNew={handleAddNew}
                        />
                    </View>
                ) : (
                    <View style={styles.content}>
                        <AddEditCategory
                            category={selectedCategory}
                            onSave={(err) => handleBackToList(err)}
                        />
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