import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, ProgressBar, Avatar } from 'react-native-paper';

const CategoryListItem = ({ iconName, name, color, amount, percentage }) => {
    const theme = useTheme();
    const styles = createStyles(theme, color);

    // Zabezpieczenie przed nieprawidłowymi wartościami progress
    const progressValue = Math.max(0, Math.min(1, percentage / 100));

    return (
        <Card style={styles.card}>
            <View style={styles.container}>
                <Avatar.Icon size={40} icon={iconName} style={styles.icon} color="#FFFFFF" />
                <View style={styles.detailsContainer}>
                    <Text variant="bodyLarge" style={styles.categoryName}>{name}</Text>
                    <View style={styles.progressRow}>
                        <Text variant="labelSmall" style={styles.percentageText}>{`${Math.round(percentage)}%`}</Text>
                        {/* Dodajemy View-kontener, który będzie tłem (torem) dla paska postępu */}
                        <View style={styles.progressBarContainer}>
                            <ProgressBar progress={progressValue} color={color} style={styles.progressBar} />
                        </View>
                    </View>
                </View>
                <Text variant="bodyLarge" style={styles.amountText}>
                    {`${amount.toFixed(2)} zł`}
                </Text>
            </View>
        </Card>
    );
};

const createStyles = (theme, color) => StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: theme.colors.elevation.level1,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    icon: {
        backgroundColor: color || theme.colors.primary,
        marginRight: 12,
    },
    detailsContainer: {
        flex: 1,
        marginRight: 12,
    },
    categoryName: {
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    percentageText: {
        minWidth: 35,
        color: theme.colors.onSurfaceVariant,
    },
    progressBarContainer: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.surfaceVariant,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 6,
    },
    amountText: {
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
});

export default CategoryListItem;