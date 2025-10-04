import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Linking, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Button, Text, useTheme, Surface } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '@/context/AuthContext';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { useDialog } from '@/utils/useDialog';

const FRAME_WIDTH_PERCENT = 80;
const FRAME_HEIGHT_PERCENT = 30;

export default function BarcodeScannerScreen() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isScanningActive, setIsScanningActive] = useState(false);
    const [unsupportedFormat, setUnsupportedFormat] = useState(null);
    const { setIsExternalActivity } = useAuth();
    const scanAnimation = useRef(new Animated.Value(0)).current;
    const { dialog, showDialog, hideDialog } = useDialog();

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnimation, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnimation, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        if (isScanningActive) {
            animation.start();
        } else {
            animation.stop();
            scanAnimation.setValue(0);
        }

        return () => animation.stop();
    }, [isScanningActive, scanAnimation]);


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
                router.navigate({
                    pathname: '/(modals)/AddLoyaltyCardModal',
                    params: {
                        barcodeData: null,
                        barcodeType: null,
                        imageUri: manipResult.uri,
                    }
                });
            }
        } catch (error) {
            showDialog({
                title: 'Błąd',
                content: 'Nie udało się przetworzyć zdjęcia. Spróbuj ponownie.',
                confirmText: 'OK',
                onConfirm: () => { },
                dangerous: false
            });
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
        const openSettings = () => {
            if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
            } else {
                Linking.openSettings();
            }
        };
        return (
            <Surface style={styles.centered}>
                <Text variant="headlineSmall" style={styles.permissionText}>Brak dostępu do aparatu</Text>
                <Text variant="bodyMedium" style={styles.permissionSubText}>Aby skanować kody, zezwól na dostęp w ustawieniach telefonu.</Text>
                <Button mode="contained" onPress={openSettings} style={{ marginBottom: 12 }}>
                    Otwórz ustawienia
                </Button>
                <Button mode="outlined" onPress={() => router.back()}>
                    Wróć
                </Button>
            </Surface>
        );
    }

    const animatedStyle = {
        transform: [{
            translateY: scanAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
            })
        }]
    };

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["aztec", "ean13", "ean8", "qr", "pdf417", "upc_e", "datamatrix", "code39", "code93", "itf14", "codabar", "code128", "upc_a"],
                }}
                style={StyleSheet.absoluteFillObject}
                facing="back"
            />

            <View style={styles.overlay}>
                <View style={styles.overlayTop} />
                <View style={styles.overlayMiddle}>
                    <View style={styles.overlaySide} />
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.cornerTopLeft]} />
                        <View style={[styles.corner, styles.cornerTopRight]} />
                        <View style={[styles.corner, styles.cornerBottomLeft]} />
                        <View style={[styles.corner, styles.cornerBottomRight]} />
                        {isScanningActive && <Animated.View style={[styles.scannerLine, animatedStyle]} />}
                    </View>
                    <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />
            </View>

            <Surface style={[styles.closeButton, { top: insets.top + 10 }]}>
                <IconButton
                    icon="close"
                    size={24}
                    onPress={() => router.back()}
                    iconColor={theme.colors.onSurface}
                />
            </Surface>

            <View style={styles.bottomContainer}>
                {!unsupportedFormat ? (
                    <>
                        <Text style={styles.overlayText}>Ustaw kod kreskowy w ramce</Text>
                        {!isScanningActive ? (
                            <Button
                                mode="contained"
                                onPress={() => { setIsScanningActive(true); setScanned(false); }}
                            >
                                Rozpocznij skanowanie
                            </Button>
                        ) : (
                            <Text style={styles.scanningActiveText}>Skanowanie aktywne...</Text>
                        )}
                    </>
                ) : (
                    <Surface style={styles.unsupportedContainer}>
                        <Text style={styles.unsupportedText}>Format "{unsupportedFormat}" nie jest obsługiwany w podglądzie.</Text>
                        <Text style={styles.unsupportedSubText}>Możesz zrobić zdjęcie karty lub spróbować zeskanować inny kod.</Text>
                        <Button
                            mode="contained"
                            onPress={handleTakeCardPhoto}
                            style={{ width: '100%' }}
                        >
                            Zrób zdjęcie i dodaj
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => { setScanned(false); setIsScanningActive(false); setUnsupportedFormat(null); }}
                            style={{ marginTop: 12, width: '100%' }}
                        >
                            Spróbuj ponownie
                        </Button>
                    </Surface>
                )}
            </View>

            <ConfirmationDialog {...dialog} onDismiss={hideDialog} />
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: theme.colors.background,
    },
    permissionText: {
        textAlign: 'center',
        marginBottom: 8,
    },
    permissionSubText: {
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
        color: theme.colors.onSurfaceVariant,
    },
    closeButton: {
        position: 'absolute',
        left: 10,
        zIndex: 1,
        borderRadius: 50,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    overlayMiddle: {
        height: `${FRAME_HEIGHT_PERCENT}%`,
        flexDirection: 'row',
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    scanFrame: {
        width: `${FRAME_WIDTH_PERCENT}%`,
        position: 'relative',
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: 'white',
        borderWidth: 4,
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    scannerLine: {
        width: '100%',
        height: 2,
        backgroundColor: 'white',
        shadowColor: 'white',
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 30,
        paddingBottom: 40,
        alignItems: 'center',
    },
    overlayText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    scanningActiveText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
    },
    unsupportedContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness * 2,
        padding: 20,
        width: '100%',
        alignItems: 'center',
    },
    unsupportedText: {
        color: theme.colors.error,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    unsupportedSubText: {
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
        marginBottom: 20,
    },
});