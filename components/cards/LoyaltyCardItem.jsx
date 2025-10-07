import React, { memo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

const LoyaltyCardItem = ({ item, onPress }) => {
    const theme = useTheme();

    if (item.id === 'add-button') {
        return (
            <Pressable style={styles.container} onPress={onPress}>
                <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                            Dodaj +
                        </Text>
                    </Card.Content>
                </Card>
            </Pressable>
        );
    }

    return (
        <Pressable style={styles.container} onPress={onPress}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text
                        variant="titleMedium"
                        numberOfLines={2}
                        style={[styles.nameText, { color: theme.colors.onSurface }]}
                    >
                        {item.name}
                    </Text>
                    {item.notes ? (
                        <Text
                            variant="bodySmall"
                            numberOfLines={1}
                            style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]}
                        >
                            {item.notes}
                        </Text>
                    ) : null}
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
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notesText: {
        marginTop: 4,
    },
});

export default memo(LoyaltyCardItem);