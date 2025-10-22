import { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput as RNTextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { useRouter } from 'expo-router';
import { getHashedPin, getPinSalt } from '@/services/pinService';
import { useNetworkStatus } from '../context/NetworkContext';
import { hashData } from '@/utils/hashUtils';
import { Text, Button, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog';
import InformationDialog from '@/components/dialogs/InformationDialog';
import { useDialog } from '@/utils/useDialog';

export default function PinCheckingScreen() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const { unlockApp, logout } = useAuth();
    const { isConnected } = useNetworkStatus();
    const { db } = useDb();
    const router = useRouter();
    const [pin, setPin] = useState('');
    const pinInputRef = useRef(null);
    const { dialog, showDialog, hideDialog, infoDialog, showInfoDialog, hideInfoDialog } = useDialog();

    const handleCheckPin = async () => {
        if (!pin || pin.length !== 4) {
            showInfoDialog({
                title: 'Błąd',
                content: 'PIN musi składać się z 4 cyfr.',
                type: 'error'
            });
            return;
        }

        if (!db) {
            showInfoDialog({
                title: 'Błąd',
                content: 'Aplikacja nie jest gotowa. Spróbuj ponownie.',
                type: 'error'
            });
            return;
        }

        try {
            const storedHashedPin = await getHashedPin(db);
            const storedPinSalt = await getPinSalt(db);

            if (storedHashedPin && storedPinSalt) {
                const hashedInputPin = await hashData(pin, storedPinSalt);
                if (hashedInputPin === storedHashedPin) {
                    unlockApp();
                    router.back();
                } else {
                    showDialog({
                        title: 'Nieprawidłowy PIN',
                        content: 'Wprowadzony PIN jest nieprawidłowy. Spróbuj ponownie.',
                        confirmText: 'OK',
                        onConfirm: () => setPin(''),
                        dangerous: false
                    });
                }
            } else {
                showDialog({
                    title: 'Błąd konfiguracji PIN',
                    content: 'Resetowanie aplikacji. Zaloguj się ponownie.',
                    confirmText: 'OK',
                    onConfirm: async () => await logout(),
                    dangerous: true
                });
            }
        } catch (e) {
            console.error('[PinChecking] Błąd podczas weryfikacji PINu:', e);
            showInfoDialog({
                title: 'Błąd',
                content: 'Wystąpił błąd podczas sprawdzania PINu.',
                type: 'error'
            });
        }
    };

    const handleForgotPin = async () => {
        if (!isConnected) {
            showInfoDialog({
                title: "Brak internetu",
                content: "Nie możesz zresetować PINu bez połączenia z internetem, bo możesz utracić dane. Połącz się z internetem i spróbuj ponownie.",
                type: 'warning'
            });
            return;
        }
        showDialog({
            title: "Resetowanie PINu",
            content: "Resetowanie PINu wymaga wylogowania. Spowoduje to usunięcie lokalnych danych i synchronizację z chmurą przy następnym logowaniu. Czy na pewno chcesz kontynuować?",
            confirmText: "Wyloguj i zresetuj",
            onConfirm: async () => {
                await logout();
                router.replace('/');
            },
            dangerous: true
        });
    };

    const pinDigits = Array.from({ length: 4 });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text variant="headlineSmall" style={styles.title}>Wprowadź kod PIN</Text>
                <Text variant="bodyMedium" style={styles.subtitle}>Aby odblokować aplikację</Text>

                <Pressable onPress={() => pinInputRef.current?.focus()}>
                    <View style={styles.pinContainer}>
                        {pinDigits.map((_, index) => (
                            <Surface key={index} style={[styles.pinBox, pin.length === index && styles.pinBoxFocused]} elevation={2}>
                                {pin[index] ? <View style={styles.pinDot} /> : null}
                            </Surface>
                        ))}
                    </View>
                </Pressable>

                <RNTextInput
                    ref={pinInputRef}
                    style={styles.hiddenInput}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    maxLength={4}
                    caretHidden
                    autoFocus
                />

                <Button mode="contained" onPress={handleCheckPin} style={styles.button}>
                    Odblokuj
                </Button>

                <Button mode="text" onPress={handleForgotPin} style={styles.forgotPinButton}>
                    Zapomniałem PINu
                </Button>
            </View>
            <ConfirmationDialog {...dialog} onDismiss={hideDialog} />
            <InformationDialog {...infoDialog} onDismiss={hideInfoDialog} />
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        marginBottom: 8,
        color: theme.colors.onSurface,
    },
    subtitle: {
        marginBottom: 40,
        color: theme.colors.onSurfaceVariant,
    },
    pinContainer: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    pinBox: {
        width: 50,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        borderRadius: theme.roundness,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    pinBoxFocused: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    pinDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.onSurface,
    },
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
    button: {
        width: '80%',
        marginTop: 20,
    },
    forgotPinButton: {
        marginTop: 20,
    },
});