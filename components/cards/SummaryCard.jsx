import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Icon, IconButton, Divider } from 'react-native-paper';
import { formatCurrency } from '@/services/transactionService';
import SummaryCardSkeleton from '@/components/skeletons/SummaryCardSkeleton';

const SummaryCard = ({ expenses, income, isLoading, savingsGoal = 0 }) => {
    const theme = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    const incomeColor = theme.dark ? '#66bb6a' : '#2e7d32';
    const styles = createStyles(theme, incomeColor);

    const renderBalanceInfo = () => {
        const balance = income - expenses;
        const isPositive = balance >= 0;
        const balanceColor = isPositive ? incomeColor : theme.colors.error;

        return (
            <View style={styles.expandedSectionContainer}>
                <Icon
                    source={isPositive ? "arrow-up-bold-outline" : "arrow-down-bold-outline"}
                    size={20}
                    color={balanceColor}
                />
                <Text style={styles.balanceLabel}>Bilans:</Text>
                <Text style={[styles.balanceAmount, { color: balanceColor }]}>
                    {isPositive ? '+' : ''}{formatCurrency(balance)}
                </Text>
            </View>
        );
    };

    const renderSavingsGoalInfo = () => {
        if (!savingsGoal || savingsGoal <= 0) {
            return null;
        }

        const surplus = income - expenses;
        const percentage = ((surplus / savingsGoal) * 100);
        const isAchieved = surplus >= savingsGoal;

        if (surplus < 0) {
            return (
                <View style={styles.expandedSectionContainer}>
                    <Icon source="alert-circle-outline" size={18} color={theme.colors.error} />
                    <Text style={[styles.savingsGoalText, styles.savingsGoalDeficit]}>
                        Deficyt: {formatCurrency(surplus)}
                    </Text>
                </View>
            );
        }

        if (isAchieved) {
            return (
                <View style={styles.expandedSectionContainer}>
                    <Icon source="trophy-variant-outline" size={18} color={styles.savingsGoalAchieved.color} />
                    <Text style={[styles.savingsGoalText, styles.savingsGoalAchieved]}>
                        Cel: {formatCurrency(surplus)} / {formatCurrency(savingsGoal)} ({percentage.toFixed(0)}%)
                    </Text>
                </View>
            );
        } else {
            return (
                <View style={styles.expandedSectionContainer}>
                    <Icon source="piggy-bank-outline" size={18} color={styles.savingsGoalInProgress.color} />
                    <Text style={[styles.savingsGoalText, styles.savingsGoalInProgress]}>
                        Cel: {formatCurrency(surplus)} / {formatCurrency(savingsGoal)} ({percentage.toFixed(0)}%)
                    </Text>
                </View>
            );
        }
    };

    if (isLoading) {
        return <SummaryCardSkeleton />;
    }

    const total = expenses + income;
    const showBar = expenses > 0 || income > 0;

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.summaryContainer}>
                    <View style={[styles.column, styles.alignLeft]}>
                        <Text style={styles.labelExpense}>Wydatki</Text>
                        <Text variant="headlineSmall" style={styles.amount}>{formatCurrency(expenses)}</Text>
                    </View>
                    <View style={[styles.column, styles.alignRight]}>
                        <Text style={styles.labelIncome}>Wpływy</Text>
                        <Text variant="headlineSmall" style={styles.amount}>{formatCurrency(income)}</Text>
                    </View>
                </View>

                {showBar && (
                    <View style={styles.progressBarWrapper}>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarExpense, { flex: expenses }]} />
                            <View style={[styles.progressBarIncome, { flex: income }]} />
                        </View>
                    </View>
                )}

                {isExpanded && (
                    <View>
                        <Divider style={styles.divider} />
                        {(!savingsGoal || savingsGoal <= 0)
                            ? renderBalanceInfo()
                            : renderSavingsGoalInfo()
                        }
                    </View>
                )}

                <View style={styles.chevronContainer}>
                    <IconButton
                        icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                        onPress={() => setIsExpanded(!isExpanded)}
                        size={24}
                    />
                </View>

            </Card.Content>
        </Card>
    );
};

const createStyles = (theme, incomeColor) => StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 4,
        backgroundColor: theme.colors.elevation.level2,
    },
    loaderContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    column: {
        flex: 1,
    },
    alignLeft: {
        alignItems: 'flex-start',
    },
    alignRight: {
        alignItems: 'flex-end',
    },
    labelExpense: {
        color: theme.colors.error,
        marginBottom: 4,
    },
    labelIncome: {
        color: incomeColor,
        marginBottom: 4,
    },
    amount: {
        color: theme.colors.onSurface,
        fontWeight: 'bold',
    },
    progressBarWrapper: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceVariant,
    },
    progressBarContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    progressBarExpense: {
        backgroundColor: theme.colors.error,
    },
    progressBarIncome: {
        backgroundColor: incomeColor,
    },
    chevronContainer: {
        alignItems: 'center',
        marginTop: -8,
        marginBottom: -20,
    },
    divider: {
        marginTop: 12,
        marginBottom: 8,
    },
    expandedSectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.elevation.level1,
    },
    balanceLabel: {
        marginHorizontal: 8,
        fontSize: 16,
        color: theme.colors.onSurfaceVariant,
    },
    balanceAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    savingsGoalText: {
        marginLeft: 8,
        fontSize: 14,
    },
    savingsGoalDeficit: {
        color: theme.colors.error,
    },
    savingsGoalInProgress: {
        color: theme.colors.primary,
    },
    savingsGoalAchieved: {
        color: incomeColor,
    },
});

export default SummaryCard;