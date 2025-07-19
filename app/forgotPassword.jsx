import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordScreen() {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleResetPassword = async () => {
        setMessage('');
        if (!email) {
            setMessage('Proszę wpisać adres e-mail.');
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(email);
            setMessage('Jeśli konto istnieje, e-mail z linkiem do resetowania hasła został wysłany. Sprawdź swoją skrzynkę pocztową.');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                setMessage('Jeśli konto istnieje, e-mail z linkiem do resetowania hasła został wysłany. Sprawdź swoją skrzynkę pocztową.');
            } else if (error.code === 'auth/invalid-email') {
                setMessage('Wprowadzono nieprawidłowy format adresu e-mail.');
            } else {
                setMessage('Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Zresetuj swoje hasło</Text>
            <Text style={styles.instructions}>
                Wprowadź adres e-mail powiązany z Twoim kontem, a wyślemy Ci link do zresetowania hasła.
            </Text>
            <TextInput
                placeholder="E-mail"
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
            />
            {message ? <Text style={styles.messageText}>{message}</Text> : null}

            <Button title="Wyślij link" onPress={handleResetPassword} disabled={isLoading} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    instructions: {
        textAlign: 'center',
        color: 'gray',
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    messageText: {
        textAlign: 'center',
        marginBottom: 15,
        color: 'green',
    }
});