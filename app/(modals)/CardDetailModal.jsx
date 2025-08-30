import React, { useState, useEffect, useCallback, } from 'react';
import { View, StyleSheet, Pressable, Alert, ScrollView, Platform } from 'react-native';
import { Text, useTheme, ActivityIndicator, Button, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Brightness from 'expo-brightness';

import { useDb } from '@/context/DbContext';
import { getLoyaltyCardById, deleteLoyaltyCard } from '@/services/loyaltyCardService';
import LoyaltyCardPreview from '../components/LoyaltyCardPreview';

export default function CardDetailModal() {
    const theme = useTheme();
    const router = useRouter();
    const { db } = useDb();
    const params = useLocalSearchParams();
    const cardId = params.cardId ? parseInt(params.cardId, 10) : null;

    const [card, setCard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageWidth, setImageWidth] = useState(null);
    const [imageHeight, setImageHeight] = useState(null);

    useFocusEffect(
        useCallback(() => {
            let originalBrightness = 0.5;
            let permissionGranted = false;
            const setMaxBrightness = async () => {
                if (Platform.OS === 'android' || (await Brightness.requestPermissionsAsync()).status === 'granted') {
                    permissionGranted = true;
                    try {
                        originalBrightness = await Brightness.getBrightnessAsync();
                        await Brightness.setBrightnessAsync(1);
                    } catch (e) { console.warn("Nie można ustawić jasności ekranu:", e); }
                }
            };
            setMaxBrightness();
            return () => {
                if (permissionGranted) {
                    Brightness.setBrightnessAsync(originalBrightness);
                }
            };
        }, [])
    );

    useEffect(() => {
        if (cardId && db) {
            const loadCard = async () => {
                setIsLoading(true);
                const fetchedCard = await getLoyaltyCardById(db, cardId);
                setCard(fetchedCard);
                setIsLoading(false);
            };
            loadCard();
        }
    }, [cardId, db]);

    const handleEdit = () => {
        router.back();
        router.push({ pathname: '/(modals)/AddLoyaltyCardModal', params: { cardId: card.id } });
    };

    const handleDelete = () => {
        Alert.alert("Potwierdź usunięcie", `Czy na pewno chcesz usunąć kartę "${card.name}"?`,
            [
                { text: "Anuluj", style: "cancel" },
                {
                    text: "Usuń", style: "destructive", onPress: async () => {
                        const result = await deleteLoyaltyCard(db, card.id);
                        if (result.success) { router.back(); }
                        else { Alert.alert("Błąd", result.message || "Nie udało się usunąć karty."); }
                    },
                },
            ]
        );
    };

    if (isLoading) { return <View style={styles.centered}><ActivityIndicator size="large" /></View>; }
    if (!card) { return (<View style={styles.centered}><Text>Nie znaleziono karty.</Text><Button onPress={() => router.back()} style={{ marginTop: 16 }}>Wróć</Button></View>); }

    return (
        <>
            <Pressable style={styles.backdrop} onPress={() => router.back()} />
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Text variant="headlineLarge" style={styles.headerTitle}>{card.name}</Text>

                    <LoyaltyCardPreview
                        barcodeData={card.barcodeData}
                        barcodeFormat={card.barcodeFormat}
                        imageUri={card.imageUri}
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

                    {card.notes && (<Text style={styles.notes}>{card.notes}</Text>)}
                </ScrollView>
                <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
                    <IconButton icon="pencil" size={28} onPress={handleEdit} />
                    <IconButton icon="trash-can-outline" size={28} onPress={handleDelete} iconColor={theme.colors.error} />
                    <Button mode="contained" onPress={() => router.back()} style={styles.flexOne}>Zamknij</Button>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
    scrollContainer: { padding: 20, paddingBottom: 40 },
    headerTitle: { textAlign: 'center', marginBottom: 24, fontWeight: 'bold' },
    barcodeCard: { marginBottom: 24, paddingVertical: 20, backgroundColor: 'white' },
    barcodeContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, minHeight: 120 },
    barcodeImage: { width: '100%', height: 150 },
    errorText: { textAlign: 'center', color: 'red', marginVertical: 20 },
    notes: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
    footer: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
    flexOne: { flex: 1, marginLeft: 12 },
});