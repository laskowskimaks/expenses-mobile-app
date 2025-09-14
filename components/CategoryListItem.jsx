import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, ProgressBar, Avatar, IconButton } from 'react-native-paper';

const CategoryListItem = ({
    iconName,
    name,
    color,
    amount,
    percentage,
    transactionCount,
    avgDailyExpense,
    onPress
}) => {
    const theme = useTheme();
    const styles = createStyles(theme, color);

    const progressValue = Math.max(0, Math.min(1, percentage / 100));

    return (
        <Card style={styles.card}>
            <View style={styles.container}>
                <Avatar.Icon size={40} icon={iconName} style={styles.icon} color="#FFFFFF" />
                <View style={styles.detailsContainer}>
                    <Text variant="bodyLarge" style={styles.categoryName}>{name}</Text>
                    <View style={styles.progressRow}>
                        <Text variant="labelSmall" style={styles.percentageText}>{`${Math.round(percentage)}%`}</Text>
                        <View style={styles.progressBarContainer}>
                            <ProgressBar progress={progressValue} color={color} style={styles.progressBar} />
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <Text variant="labelSmall" style={styles.statsText}>
                            {transactionCount} {transactionCount === 1 ? 'transakcja' : transactionCount < 5 ? 'transakcje' : 'transakcji'}
                        </Text>
                        <Text variant="labelSmall" style={styles.statsText}>
                            Śr. {avgDailyExpense.toFixed(2)} zł/dzień
                        </Text>
                    </View>
                </View>
                <Text variant="bodyLarge" style={styles.amountText}>
                    {`${amount.toFixed(2)} zł`}
                </Text>
                {onPress && (
                    <IconButton
                        icon="chevron-right"
                        size={28}
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={onPress}
                        style={styles.chevronButton}
                    />
                )}
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
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 4,
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
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    statsText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 11,
    },
    amountText: {
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginRight: 4,
    },
    chevronButton: {
        margin: 0,
    }
});

export default CategoryListItem;