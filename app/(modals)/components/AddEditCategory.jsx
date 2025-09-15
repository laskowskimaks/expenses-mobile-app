import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, useTheme, Text, Icon } from 'react-native-paper';
import { useDb } from '@/context/DbContext';
import { addCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { useDialog } from '@/utils/useDialog';
import ConfirmationDialog from '@/components/ConfirmationDialog';

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
const ICONS = ['home', 'car', 'food-fork-drink', 'shopping', 'theater', 'school', 'heart-pulse', 'finance', 'shape-outline', 'airplane', 'train', 'bus', 'gas-station', 'cart', 'tshirt-crew', 'basketball', 'book-open-variant', 'briefcase', 'cash'];

const AddEditCategory = ({ category, onSave }) => {
    const theme = useTheme();
    const { db } = useDb();
    const { dialog, showDialog, hideDialog } = useDialog();
    const isEditMode = !!category;

    const [name, setName] = useState(isEditMode ? category.name : '');
    const [selectedColor, setSelectedColor] = useState(isEditMode ? category.color : COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(isEditMode ? category.iconName : ICONS[0]);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const isLockedForEditing = isEditMode && !category.isDeletable;

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Nazwa kategorii jest wymagana.');
            return;
        }
        setIsProcessing(true);
        setError('');

        const categoryData = { name, color: selectedColor, iconName: selectedIcon };
        const result = isEditMode
            ? await updateCategory(db, category.id, categoryData)
            : await addCategory(db, categoryData);

        setIsProcessing(false);
        if (result.success) {
            onSave();
        } else {
            setError(result.message);
        }
    };

    const handleDelete = async () => {
        showDialog({
            title: "Potwierdź usunięcie",
            content: `Czy na pewno chcesz usunąć kategorię "${category.name}"? Wszystkie transakcje z tą kategorią zostaną przypisane do kategorii "Inne".`,
            confirmText: "Usuń",
            onConfirm: async () => {
                setIsProcessing(true);
                const result = await deleteCategory(db, category.id);
                setIsProcessing(false);
                if (result.success) {
                    onSave();
                } else {
                    showDialog({
                        title: "Błąd",
                        content: result.message,
                        confirmText: "OK",
                        onConfirm: () => { },
                        dangerous: false
                    });
                }
            },
            dangerous: true
        });
    };

    return (
        <>
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
                <TextInput
                    mode="outlined"
                    label="Nazwa kategorii"
                    value={name}
                    onChangeText={setName}
                    style={{ marginBottom: 16 }}
                    disabled={isLockedForEditing}
                />

                <Text style={[styles.label, { color: theme.colors.onSurface }]}>Wybierz kolor</Text>
                <View style={styles.pickerContainer}>
                    {COLORS.map(color => (
                        <TouchableOpacity key={color} onPress={() => setSelectedColor(color)} style={[styles.colorCircle, { backgroundColor: color, borderWidth: selectedColor === color ? 3 : 0, borderColor: theme.colors.primary }]} />
                    ))}
                </View>

                <View pointerEvents={isLockedForEditing ? 'none' : 'auto'} style={{ opacity: isLockedForEditing ? 0.5 : 1 }}>
                    <Text style={[styles.label, { color: theme.colors.onSurface }]}>Wybierz ikonę</Text>
                    <View style={styles.pickerContainer}>
                        {ICONS.map(icon => (
                            <TouchableOpacity key={icon} onPress={() => setSelectedIcon(icon)} style={[styles.iconBox, { backgroundColor: selectedIcon === icon ? theme.colors.primaryContainer : theme.colors.surfaceVariant }]}>
                                <Icon source={icon} size={28} color={selectedIcon === icon ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <HelperText type="error" visible={!!error}>{error}</HelperText>

                <Button mode="contained" onPress={handleSave} loading={isProcessing} disabled={isProcessing} style={{ marginTop: 24 }}>
                    {isEditMode ? "Zapisz zmiany" : "Dodaj kategorię"}
                </Button>
                {isEditMode && category.isDeletable && (
                    <Button textColor={theme.colors.error} onPress={handleDelete} disabled={isProcessing} style={{ marginTop: 12 }}>
                        Usuń kategorię
                    </Button>
                )}
            </ScrollView>
            <ConfirmationDialog {...dialog} onDismiss={hideDialog} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        marginTop: 16
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        margin: 4,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
    },
});

export default AddEditCategory;