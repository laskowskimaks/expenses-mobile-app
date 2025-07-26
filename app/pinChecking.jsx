import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { useRouter } from 'expo-router';
import { getHashedPin, getPinSalt } from '@/services/authService';
import { useNetworkStatus } from '../context/NetworkContext';
import { hashData } from '@/utils/hashUtils';

export default function PinCheckingScreen() {
    const { user, unlockApp, logout } = useAuth();
    const { isConnected } = useNetworkStatus();
    const { db } = useDb();
    const router = useRouter();
    const [pin, setPin] = useState('');

    const handleCheckPin = async () => {
        if (!pin || pin.length !== 4) {
            Alert.alert('Błąd', 'PIN musi składać się z 4 cyfr.');
            return;
        }

        if (!db || !user) {
            Alert.alert('Błąd', 'Aplikacja nie jest gotowa. Spróbuj ponownie.');
            return;
        }

        try {
            const storedHashedPin = await getHashedPin(db);
            const storedPinSalt = await getPinSalt(db);

            if (storedHashedPin && storedPinSalt) {
                const hashedInputPin = await hashData(pin, storedPinSalt);
                if (hashedInputPin === storedHashedPin) {
                    console.log('[PinChecking] PIN poprawny. Odblokowuję aplikację.');
                    unlockApp();
                    router.back();
                } else {
                    alert('Nieprawidłowy PIN');
                    setPin('');
                }
            } else {
                alert('Błąd konfiguracji PIN. Zaloguj się ponownie.');
                await logout();
            }
        } catch (e) {
            console.error('[PinChecking] Błąd podczas weryfikacji PINu:', e);
            alert('Wystąpił błąd podczas sprawdzania PINu.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wprowadź PIN, aby kontynuować</Text>
            <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                autoFocus={true}
                textAlign="center"
            />
            <Button title="Odblokuj" onPress={handleCheckPin} />
            <Pressable
                style={styles.forgotPinContainer}
                onPress={async () => {
                    if (!isConnected) {
                        Alert.alert(
                            "Brak internetu",
                            "Nie możesz zresetować PINu bez połączenia z internetem, bo możesz utracić dane. Połącz się z internetem i spróbuj ponownie."
                        );
                        return;
                    }
                    Alert.alert(
                        "Resetowanie PINu",
                        "Resetowanie PINu wymaga wylogowania. Czy na pewno chcesz kontynuować?",
                        [
                            { text: "Anuluj", style: "cancel" },
                            {
                                text: "Wyloguj i zresetuj PIN",
                                style: "destructive",
                                onPress: async () => {
                                    await logout();
                                }
                            }
                        ]
                    );
                }}
            >
                <Text style={styles.forgotPinText}>
                    Zapomniałem PINu
                </Text>
            </Pressable>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: 150,
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 24,
        letterSpacing: 15,
        marginBottom: 20,
    },
    forgotPinContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    forgotPinText: {
        color: '#007BFF',
        textDecorationLine: 'underline',
    }
});