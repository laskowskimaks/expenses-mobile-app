import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, useTheme, Text } from 'react-native-paper';
import { useDb } from '@/context/DbContext';
import { addTag, updateTag, deleteTag } from '@/services/tagService';
import { COLOR_PALETTE } from '@/services/tagService';
import { useDialog } from '@/utils/useDialog';
import ConfirmationDialog from '@/components/ConfirmationDialog';


const AddEditTag = ({ tag, onSave }) => {
    const theme = useTheme();
    const { db } = useDb();
    const { dialog, showDialog, hideDialog } = useDialog();
    const isEditMode = !!tag;

    const [name, setName] = useState(isEditMode ? tag.name : '');
    const [selectedColor, setSelectedColor] = useState(isEditMode ? tag.color : COLOR_PALETTE[0]);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Nazwa taga jest wymagana.');
            return;
        }
        setIsProcessing(true);
        setError('');

        const tagData = { name, color: selectedColor };
        const result = isEditMode
            ? await updateTag(db, tag.id, tagData)
            : await addTag(db, tagData);

        setIsProcessing(false);
        if (result.success) {
            onSave();
        } else {
            setError(result.message);
        }
    };

    const handleDelete = async () => {
        let message = `Czy na pewno chcesz usunąć tag "${tag.name}"?`;
        if (tag.transactionCount > 0) {
            const transactionText = tag.transactionCount === 1 ? 'transakcji' : 'transakcjach';
            message += ` Jest on używany w ${tag.transactionCount} ${transactionText} i zostanie z nich usunięty.`;
        }

        showDialog({
            title: "Potwierdź usunięcie",
            content: message,
            confirmText: "Usuń",
            onConfirm: async () => {
                setIsProcessing(true);
                const result = await deleteTag(db, tag.id);
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
            <ScrollView contentContainerStyle={styles.container}>
                <TextInput
                    mode="outlined"
                    label="Nazwa taga"
                    value={name}
                    onChangeText={setName}
                    style={{ marginBottom: 16 }}
                />

                <Text style={[styles.label, { color: theme.colors.onSurface }]}>Wybierz kolor</Text>
                <View style={styles.pickerContainer}>
                    {COLOR_PALETTE.map(color => (
                        <TouchableOpacity key={color} onPress={() => setSelectedColor(color)} style={[styles.colorCircle, { backgroundColor: color, borderWidth: selectedColor === color ? 3 : 0, borderColor: theme.colors.primary }]} />
                    ))}
                </View>

                <HelperText type="error" visible={!!error}>{error}</HelperText>

                <Button mode="contained" onPress={handleSave} loading={isProcessing} disabled={isProcessing} style={{ marginTop: 24 }}>
                    {isEditMode ? "Zapisz zmiany" : "Dodaj tag"}
                </Button>
                {isEditMode && (
                    <Button textColor={theme.colors.error} onPress={handleDelete} disabled={isProcessing} style={{ marginTop: 12 }}>
                        Usuń tag
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
});

export default AddEditTag;