import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDb } from '@/context/DbContext';
import { getAllLoyaltyCards } from '@/services/loyaltyCardService';
import LoyaltyCardItem from '@/components/cards/LoyaltyCardItem';
import { eventEmitter } from '@/utils/eventEmitter';

export default function CardsScreen() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const { db } = useDb();
    const router = useRouter();
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCards = useCallback(async () => {
        if (!db) return;
        try {
            const fetchedCards = await getAllLoyaltyCards(db);
            setCards(fetchedCards);
        } catch (error) {
            console.error("Failed to fetch cards:", error);
        }
    }, [db]);

    useEffect(() => {
        eventEmitter.on('loyaltyCardsChanged', fetchCards);
        return () => {
            eventEmitter.off('loyaltyCardsChanged', fetchCards);
        };
    }, [fetchCards]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await fetchCards();
            setIsLoading(false);
        };
        loadInitialData();
    }, [fetchCards]);


    const listData = useMemo(() => {
        if (isLoading) return [];
        return [...cards, { id: 'add-button', name: 'Dodaj +' }];
    }, [cards, isLoading]);

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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <FlashList
                data={listData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                estimatedItemSize={132}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<Text style={styles.header}>Karty lojalnościowe</Text>}
            />
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    listContent: {
        paddingHorizontal: 6,
        paddingBottom: 85,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        padding: 18,
        color: theme.colors.onSurface,
    },
});