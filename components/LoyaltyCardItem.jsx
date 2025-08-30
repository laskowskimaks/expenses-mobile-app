import React, { memo } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

const LoyaltyCardItem = ({ item, onPress }) => {
    const theme = useTheme();

    if (item.id === 'add-button') {
        return (
            <Pressable style={styles.container} onPress={onPress}>
                <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                    <Card.Content>
                        <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>Dodaj +</Text>
                    </Card.Content>
                </Card>
            </Pressable>
        );
    }

    return (
        <Pressable style={styles.container} onPress={onPress}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.nameText} numberOfLines={2}>{item.name}</Text>
                    {item.notes ? <Text style={styles.notesText} numberOfLines={1}>{item.notes}</Text> : null}
                </Card.Content>
            </Card>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 6,
    },
    card: {
        flex: 1,
        minHeight: 120,
    },
    nameText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 13,
        color: '#666',
    },
    addButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default memo(LoyaltyCardItem);