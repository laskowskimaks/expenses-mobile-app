import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, ActivityIndicator, Icon } from 'react-native-paper';
import { formatCurrency } from '@/services/transactionService';

const SummaryCard = ({ expenses, income, isLoading, savingsGoal = 0 }) => {
    const theme = useTheme();

    const incomeColor = theme.dark ? '#66bb6a' : '#2e7d32';

    const styles = createStyles(theme, incomeColor);

    const renderSavingsGoalInfo = () => {
        if (!savingsGoal || savingsGoal <= 0) {
            return null;
        }

        const surplus = income - expenses;

        if (surplus < 0) {
            return (
                <View style={styles.savingsGoalContainer}>
                    <Icon source="alert-circle-outline" size={16} color={theme.colors.error} />
                    <Text style={[styles.savingsGoalText, styles.savingsGoalDeficit]}>
                        Deficyt: {formatCurrency(surplus)}
                    </Text>
                </View>
            );
        }

        const percentage = ((surplus / savingsGoal) * 100);
        const isAchieved = surplus >= savingsGoal;

        if (isAchieved) {
            return (
                <View style={styles.savingsGoalContainer}>
                    <Icon source="trophy-variant-outline" size={16} color={styles.savingsGoalAchieved.color} />
                    <Text style={[styles.savingsGoalText, styles.savingsGoalAchieved]}>
                        Cel osiągnięty: {formatCurrency(surplus)} / {formatCurrency(savingsGoal)} ({percentage.toFixed(0)}%)
                    </Text>
                </View>
            );
        } else {
            return (
                <View style={styles.savingsGoalContainer}>
                    <Icon source="piggy-bank-outline" size={16} color={styles.savingsGoalInProgress.color} />
                    <Text style={[styles.savingsGoalText, styles.savingsGoalInProgress]}>
                        Cel: {formatCurrency(surplus)} / {formatCurrency(savingsGoal)} ({percentage.toFixed(0)}%)
                    </Text>
                </View>
            );
        }
    };

    if (isLoading) {
        return (
            <Card style={styles.card}>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator animating={true} />
                </View>
            </Card>
        );
    }

    const total = expenses + income;
    const expensesPercentage = total > 0 ? (expenses / total) * 100 : 0;
    const incomePercentage = total > 0 ? (income / total) * 100 : 0;
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
                        <View style={styles.percentageTextContainer}>
                            <Text style={[styles.percentage, { textAlign: 'left' }]}>{expensesPercentage.toFixed(1)}%</Text>
                            <Text style={[styles.percentage, { textAlign: 'right' }]}>{incomePercentage.toFixed(1)}%</Text>
                        </View>
                    </View>
                )}

                {renderSavingsGoalInfo()}
            </Card.Content>
        </Card>
    );
};

const createStyles = (theme, incomeColor) => StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
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
        position: 'relative',
        height: 20,
    },
    progressBarContainer: {
        flexDirection: 'row',
        height: 20,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceVariant,
    },
    progressBarExpense: {
        backgroundColor: theme.colors.error,
    },
    progressBarIncome: {
        backgroundColor: incomeColor,
    },
    percentageTextContainer: {
        position: 'absolute',
        top: 0,
        left: 8,
        right: 8,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    percentage: {
        fontSize: 12,
        color: theme.colors.onPrimary,
        fontWeight: 'bold',
        flex: 1,
    },
    savingsGoalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        padding: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.elevation.level1,
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