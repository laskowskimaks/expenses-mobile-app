import { useState } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Text, TextInput, Button, useTheme, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import InformationDialog from '@/components/dialogs/InformationDialog';
import { useDialog } from '@/utils/useDialog';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { forgotPassword } = useAuth();
    const { infoDialog, showInfoDialog, hideInfoDialog } = useDialog();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        Keyboard.dismiss();

        if (!email) {
            showInfoDialog({
                title: 'Błąd',
                content: 'Proszę wpisać adres e-mail.',
                type: 'error'
            });
            return;
        }
        if (!validateEmail(email)) {
            showInfoDialog({
                title: 'Błąd',
                content: 'Wprowadzono nieprawidłowy format adresu e-mail.',
                type: 'error'
            });
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(email);
            showInfoDialog({
                title: 'E-mail wysłany',
                content: 'Jeśli konto istnieje, e-mail z linkiem do resetowania hasła został wysłany. Sprawdź swoją skrzynkę pocztową.',
                type: 'success'
            });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                showInfoDialog({
                    title: 'E-mail wysłany',
                    content: 'Jeśli konto istnieje, e-mail z linkiem do resetowania hasła został wysłany. Sprawdź swoją skrzynkę pocztową.',
                    type: 'success'
                });
            } else if (error.code === 'auth/invalid-email') {
                showInfoDialog({
                    title: 'Błąd',
                    content: 'Wprowadzono nieprawidłowy adres e-mail.',
                    type: 'error'
                });
            } else {
                showInfoDialog({
                    title: 'Błąd',
                    content: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.',
                    type: 'error'
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={() => router.back()}
                    style={styles.backButton}
                />
            </View>
            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Title title="Zresetuj hasło" titleVariant="headlineMedium" />
                    <Card.Content>
                        <Text style={styles.instructions}>
                            Wprowadź adres e-mail powiązany z Twoim kontem, a wyślemy Ci link do zresetowania hasła.
                        </Text>
                        <TextInput
                            label="E-mail"
                            mode="outlined"
                            onChangeText={setEmail}
                            value={email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                        />

                        <Button
                            mode="contained"
                            onPress={handleResetPassword}
                            disabled={isLoading}
                            loading={isLoading}
                            style={styles.button}
                        >
                            Wyślij link
                        </Button>
                    </Card.Content>
                </Card>
            </View>
            <InformationDialog {...infoDialog} onDismiss={hideInfoDialog} />
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingTop: 8,
    },
    backButton: {
        margin: 0,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
    },
    instructions: {
        color: theme.colors.onSurfaceVariant,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    input: {
        marginBottom: 20,
    },
    button: {
        marginTop: 8,
    },
});