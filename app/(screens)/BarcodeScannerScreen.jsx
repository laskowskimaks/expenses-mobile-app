import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '@/context/AuthContext';

export default function BarcodeScannerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isScanningActive, setIsScanningActive] = useState(false);
    const [unsupportedFormat, setUnsupportedFormat] = useState(null);
    const { setIsExternalActivity } = useAuth();

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleTakeCardPhoto = async () => {
        setIsExternalActivity(true);
        let manipResult = null;
        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 900 } }],
                    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
                );
                router.back();
                setTimeout(() => {
                    router.setParams({
                        barcodeData: null,
                        barcodeType: null,
                        imageUri: manipResult.uri,
                    });
                }, 100);
            }
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się przetworzyć zdjęcia. Spróbuj ponownie.');
            console.error('[BarcodeScannerScreen] Błąd ImageManipulator:', error);
        }
        setIsExternalActivity(false);
    };

    const handleBarCodeScanned = ({ type, data }) => {
        if (!isScanningActive || scanned) {
            return;
        }
        if (type === 'pdf417' || type === 'aztec' || type === 'datamatrix') {
            setScanned(true);
            setIsScanningActive(false);
            setUnsupportedFormat(type);
            return;
        }
        setScanned(true);
        setIsScanningActive(false);
        setUnsupportedFormat(null);
        console.log(`[BarcodeScannerScreen] Zeskanowano kod! Typ: ${type}, Dane: ${data}`);
        if (router.canGoBack()) {
            router.back();
            setTimeout(() => {
                router.setParams({
                    barcodeData: data,
                    barcodeType: type,
                    imageUri: null,
                });
            }, 100);
        }
    };

    if (!permission) {
        return <View style={styles.centered}><Text>Prośba o uprawnienia do aparatu...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.centered}>
                <Text style={styles.permissionText}>Brak dostępu do aparatu.</Text>
                <Text style={styles.permissionSubText}>Aby skanować kody, zezwól na dostęp w ustawieniach telefonu.</Text>
                <Button title="Wróć" onPress={() => router.back()} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: [
                        "aztec",
                        "ean13",
                        "ean8",
                        "qr",
                        "pdf417",
                        "upc_e",
                        "datamatrix",
                        "code39",
                        "code93",
                        "itf14",
                        "codabar",
                        "code128",
                        "upc_a"
                    ],
                }}
                style={StyleSheet.absoluteFillObject}
                facing="back"
            />
            <View style={[styles.closeButton, { top: insets.top + 10 }]}>
                <IconButton
                    icon="close"
                    mode="contained"
                    size={24}
                    onPress={() => router.back()}
                />
            </View>
            <View style={styles.overlay}>
                {!unsupportedFormat ? (
                    <>
                        <Text style={styles.overlayText}>Ustaw kod kreskowy w ramce</Text>
                        <View style={styles.scanFrame} />
                        {!isScanningActive ? (
                            <Button
                                title="Rozpocznij skanowanie"
                                onPress={() => { setIsScanningActive(true); setScanned(false); }}
                                color="#2196F3"
                            />
                        ) : (
                            <Text style={{ color: 'white', marginTop: 16 }}>Skanowanie aktywne...</Text>
                        )}
                    </>
                ) : (
                    <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.overlayText, { color: 'red', marginBottom: 12 }]}>Format "{unsupportedFormat}" nie jest obsługiwany w podglądzie. Możesz zrobić zdjęcie karty lub spróbować ponownie.</Text>
                        <Button
                            title="Zrób zdjęcie i dodaj"
                            onPress={handleTakeCardPhoto}
                            color="#2196F3"
                        />
                        <View style={{ height: 12 }} />
                        <Button
                            title="Spróbuj ponownie"
                            onPress={() => { setScanned(false); setIsScanningActive(false); setUnsupportedFormat(null); }}
                            color="#666"
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    permissionSubText: {
        textAlign: 'center',
        marginBottom: 16,
    },
    closeButton: {
        position: 'absolute',
        left: 10,
        zIndex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    scanFrame: {
        width: '80%',
        height: '30%',
        borderWidth: 3,
        borderColor: 'white',
        borderRadius: 20,
    },
});