import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

import { useDb } from '@/context/DbContext';
import { getAllLoyaltyCards } from '@/services/loyaltyCardService';
import LoyaltyCardItem from '@/components/LoyaltyCardItem';
import { eventEmitter } from '@/utils/eventEmitter';

export default function CardsScreen() {
    const { db } = useDb();
    const router = useRouter();
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCards = useCallback(async () => {
        if (isLoading) {
            const fetchedCards = await getAllLoyaltyCards(db);
            setCards(fetchedCards);
            setIsLoading(false);
        } else {
            const fetchedCards = await getAllLoyaltyCards(db);
            setCards(fetchedCards);
        }
    }, [db, isLoading]);

    useEffect(() => {
        fetchCards();

        eventEmitter.on('loyaltyCardsChanged', fetchCards);
        return () => {
            eventEmitter.off('loyaltyCardsChanged', fetchCards);
        };
    }, [fetchCards]);

    const listData = useMemo(() => {
        return [...cards, { id: 'add-button', name: 'Dodaj +' }];
    }, [cards]);

    const handlePress = useCallback((item) => {
        if (item.id === 'add-button') {
            router.push('/(modals)/AddLoyaltyCardModal');
        } else {
            router.push({
                pathname: '/(modals)/CardDetailModal',
                params: { cardId: item.id }
            });
        }
    }, [router]);

    const renderItem = useCallback(({ item }) => (
        <LoyaltyCardItem item={item} onPress={() => handlePress(item)} />
    ), [handlePress]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlashList
                data={listData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                estimatedItemSize={132}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<Text style={styles.header}>Karty lojalnościowe</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 6,
        paddingBottom: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        padding: 18,
    },
});