import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, ActivityIndicator, Text, useTheme, Avatar } from 'react-native-paper';

const IndicatorColumn = ({ icon, label, subLabel, value }) => {
    const theme = useTheme();
    const styles = createColumnStyles(theme);

    return (
        <View style={styles.container}>
            <Avatar.Icon size={40} icon={icon} style={styles.icon} />
            <Text variant="bodySmall" style={styles.label} numberOfLines={2}>{label}</Text>
            <Text variant="labelSmall" style={styles.subLabel} numberOfLines={1}>{subLabel}</Text>
            <Text variant="titleMedium" style={styles.value}>{value}</Text>
        </View>
    );
};

const KeyIndicatorsCard = ({ data, isLoading }) => {
    const theme = useTheme();
    const styles = createCardStyles(theme);

    if (isLoading) {
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <ActivityIndicator />
                </Card.Content>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    const { averageDailyExpense, transactionCount, largestExpense } = data;

    return (
        <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
                <IndicatorColumn
                    icon="calendar-month"
                    label="Średnie dzienne wydatki"
                    value={`${averageDailyExpense.toFixed(2)} zł`}
                />

                <View style={styles.divider} />

                <IndicatorColumn
                    icon="swap-horizontal"
                    label="Liczba transakcji"
                    subLabel="Wydatki / Przychody"
                    value={`${transactionCount.expenseCount} / ${transactionCount.incomeCount}`}
                />

                <View style={styles.divider} />

                <IndicatorColumn
                    icon="cash"
                    label="Największy wydatek"
                    subLabel={largestExpense?.title}
                    value={largestExpense ? `${largestExpense.amount.toFixed(2)} zł` : '-'}
                />
            </Card.Content>
        </Card>
    );
};

const createCardStyles = (theme) => StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 0,
    },
    divider: {
        width: 1,
        height: '75%',
        backgroundColor: theme.colors.outlineVariant,
    }
});

const createColumnStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    icon: {
        backgroundColor: theme.colors.primaryContainer,
        marginBottom: 8,
    },
    label: {
        color: theme.colors.onSurface,
        textAlign: 'center',
        minHeight: 28,
    },
    subLabel: {
        color: theme.colors.onSurfaceVariant,
        textAlign: 'center',
        minHeight: 16,
        marginBottom: 4,
    },
    value: {
        color: theme.colors.onSurface,
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

export default KeyIndicatorsCard;