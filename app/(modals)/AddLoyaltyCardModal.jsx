import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, ActivityIndicator, Icon } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { useDb } from '@/context/DbContext';
import { getLoyaltyCardById, addLoyaltyCard, updateLoyaltyCard } from '@/services/loyaltyCardService';
import LoyaltyCardPreview from './components/LoyaltyCardPreview';
import { useAuth } from '@/context/AuthContext';

export default function AddLoyaltyCardModal() {
    const theme = useTheme();
    const router = useRouter();
    const { db } = useDb();
    const { setIsExternalActivity } = useAuth();
    const params = useLocalSearchParams();

    const cardId = useMemo(() => params.cardId ? parseInt(params.cardId, 10) : null, [params.cardId]);
    const isEditMode = useMemo(() => !!cardId, [cardId]);

    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [barcodeData, setBarcodeData] = useState(null);
    const [barcodeFormat, setBarcodeFormat] = useState(null);
    const [imageUri, setImageUri] = useState(null);

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [imageWidth, setImageWidth] = useState(null);
    const [imageHeight, setImageHeight] = useState(null);

    useFocusEffect(
        useCallback(() => {
            setIsExternalActivity(false);
            if (params.imageUri && typeof params.imageUri === 'string' && params.imageUri !== 'null' && params.imageUri !== '') {
                setImageUri(params.imageUri);
                setBarcodeData(null);
                setBarcodeFormat(null);
            }
            if (params.barcodeData && params.barcodeData !== 'null' && params.barcodeData !== null && params.barcodeData !== undefined && params.barcodeData !== '') {
                setBarcodeData(params.barcodeData);
                setBarcodeFormat(params.barcodeType);
                setImageUri(null);
            }
        }, [params.imageUri, params.barcodeData, params.barcodeType])
    );

    useEffect(() => {
        if (isEditMode && db) {
            const loadCard = async () => {
                const card = await getLoyaltyCardById(db, cardId);
                if (card) {
                    setName(card.name);
                    setNotes(card.notes || '');
                    setBarcodeData(card.barcodeData);
                    setBarcodeFormat(card.barcodeFormat);
                    setImageUri(card.imageUri);
                } else {
                    Alert.alert('Błąd', 'Nie znaleziono karty.', [{ text: 'OK', onPress: () => router.back() }]);
                }
                setIsLoading(false);
            };
            loadCard();
        }
    }, [isEditMode, cardId, db]);

    const handleSave = async () => {
        if (!name.trim()) { Alert.alert('Błąd', 'Nazwa karty jest wymagana.'); return; }
        if (!barcodeData && !imageUri) { Alert.alert('Błąd', 'Musisz zeskanować lub dodać kod kreskowy.'); return; }
        setIsSaving(true);
        const cardData = { name, notes, barcodeData, barcodeFormat, imageUri };
        const result = isEditMode ? await updateLoyaltyCard(db, cardId, cardData) : await addLoyaltyCard(db, cardData);
        setIsSaving(false);
        if (result.success) { router.back(); } else { Alert.alert('Błąd', result.message || 'Nie udało się zapisać karty.'); }
    };

    const handleScanLive = () => {
        setIsExternalActivity(true);
        router.push('/(screens)/BarcodeScannerScreen');
    };

    const handlePickCardImage = async () => {
        setIsExternalActivity(true);
        let manipResult = null;
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 900 } }],
                    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
                );
                setImageUri(manipResult.uri);
                setBarcodeData(null);
                setBarcodeFormat(null);
            }
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się przetworzyć zdjęcia. Spróbuj ponownie.');
            console.error('[AddLoyaltyCardModal] Błąd ImageManipulator:', error);
        }
        setIsExternalActivity(false);
    };

    if (isLoading) { return <View style={styles.centered}><ActivityIndicator size="large" /></View>; }

    return (
        <>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.background }]}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Text variant="headlineMedium" style={styles.headerTitle}>{isEditMode ? 'Edytuj kartę' : 'Dodaj kartę'}</Text>
                    <TextInput mode="outlined" label="Nazwa karty" value={name} onChangeText={setName} style={styles.formField} />
                    <TextInput mode="outlined" label="Notatki (opcjonalne)" value={notes} onChangeText={setNotes} style={styles.formField} multiline />
                    <View style={styles.scanButtonsContainer}>
                        <Pressable style={styles.scanButton} onPress={handleScanLive} >
                            <Icon source="camera-outline" size={48} color={theme.colors.primary} />
                            <Text style={styles.scanButtonText}>Zeskanuj za pomocą kamery</Text>
                        </Pressable>

                        <Pressable style={styles.scanButton} onPress={handlePickCardImage}>
                            <Icon source="image" size={48} color={theme.colors.primary} />
                            <Text style={styles.scanButtonText}>Dodaj ze zdjęcia</Text>
                        </Pressable>
                    </View>
                    <LoyaltyCardPreview
                        barcodeData={barcodeData}
                        barcodeFormat={barcodeFormat}
                        imageUri={imageUri}
                        theme={theme}
                        imageWidth={imageWidth}
                        imageHeight={imageHeight}
                        onImageLoad={e => {
                            const { width, height } = e.nativeEvent.source;
                            setImageWidth(width);
                            setImageHeight(height);
                        }}
                        style={styles.barcodeContainer}
                    />
                </ScrollView>
                <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
                    <Button mode="outlined" onPress={() => router.back()} style={styles.flexOne}>Anuluj</Button>
                    <Button mode="contained" onPress={handleSave} style={[styles.flexOne, { marginLeft: 12 }]} loading={isSaving} disabled={isSaving}>{isEditMode ? 'Zapisz zmiany' : 'Dodaj kartę'}</Button>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '95%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
    scrollContainer: { flexGrow: 1, padding: 20 },
    headerTitle: { textAlign: 'center', marginBottom: 24 },
    formField: { marginBottom: 16 },
    scanButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 24 },
    scanButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center', width: '45%', minHeight: 110 },
    scanButtonText: { marginTop: 8, fontWeight: '500' },
    barcodeCard: { backgroundColor: 'white', marginTop: 16 },
    barcodeContainer: { alignItems: 'center', justifyContent: 'center', padding: 16, minHeight: 120 },
    errorText: { color: 'red', textAlign: 'center' },
    footer: { flexDirection: 'row', padding: 20, borderTopWidth: StyleSheet.hairlineWidth },
    flexOne: { flex: 1 },
});