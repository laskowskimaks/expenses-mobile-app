import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Keyboard } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useNetworkStatus } from '@/context/NetworkContext';
import { useDialog } from '@/utils/useDialog';
import InformationDialog from '@/components/InformationDialog';
import { useDb } from '@/context/DbContext'; 

export default function ChangePasswordModal() {
    const theme = useTheme();
    const router = useRouter();
    const { changePassword } = useAuth();
    const { isConnected } = useNetworkStatus();
    const { infoDialog, showInfoDialog, hideInfoDialog } = useDialog();
    const { db } = useDb();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleInfoDialogDismiss = () => {
        hideInfoDialog();
        if (infoDialog.type === 'success') {
            router.back();
        }
    };

    const handleSave = async () => {
        Keyboard.dismiss();
        setError('');

        if (!isConnected) {
            setError('Do zmiany hasła wymagane jest połączenie z internetem.');
            return;
        }

        if (!db) {
            setError('Baza danych nie jest dostępna. Spróbuj ponownie później.');
            return;
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Wszystkie pola są wymagane.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Nowe hasło musi mieć co najmniej 6 znaków.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Nowe hasła nie są identyczne.');
            return;
        }

        setIsProcessing(true);
        try {
            const result = await changePassword(currentPassword, newPassword);
            if (result.success) {
                showInfoDialog({
                    title: 'Sukces',
                    content: 'Hasło zostało pomyślnie zmienione.',
                    type: 'success',
                });
            } else {
                if (result.message === 'auth/invalid-credential') {
                    showInfoDialog({
                        title: 'Nieprawidłowe hasło',
                        content: 'Sprawdź podane aktualne hasło i spróbuj ponownie.',
                        type: 'warning'
                    });
                } else {
                    setError(result.message || 'Wystąpił błąd podczas zmiany hasła.');
                }
            }
        } catch (e) {
            setError('Wystąpił nieoczekiwany błąd podczas zmiany hasła.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
                <View style={styles.contentContainer}>
                    <Text variant="headlineMedium" style={styles.headerTitle}>Zmień hasło</Text>

                    <TextInput
                        mode="outlined"
                        label="Aktualne hasło"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                        style={styles.input}
                    />

                    <TextInput
                        mode="outlined"
                        label="Nowe hasło"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        style={styles.input}
                    />

                    <TextInput
                        mode="outlined"
                        label="Potwierdź nowe hasło"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        style={styles.input}
                    />

                    <HelperText type="error" visible={!!error} style={styles.errorText}>{error}</HelperText>

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={isProcessing}
                        disabled={isProcessing}
                        style={styles.button}
                    >
                        Zapisz zmiany
                    </Button>
                </View>
                <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton}>
                    Anuluj
                </Button>
            </View>
            <InformationDialog {...infoDialog} onDismiss={handleInfoDialogDismiss} />
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
        overflow: 'hidden',
        padding: 20
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        textAlign: 'center',
        marginBottom: 24
    },
    input: {
        width: '100%',
        marginBottom: 12
    },
    errorText: {
        textAlign: 'center'
    },
    button: {
        marginTop: 20,
        width: '100%'
    },
    cancelButton: {
        marginBottom: 20,
        borderColor: 'transparent'
    },
});