import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, ProgressBar, Icon, Card } from 'react-native-paper';
import { formatCurrency } from '@/services/transactionService';

const TagSummaryItem = ({ item, totalExpenses, onPress }) => {
    const theme = useTheme();
    const styles = createStyles(theme);

    const { name, color, totalAmount, transactionCount, largestExpense, categories } = item;
    const progress = totalExpenses > 0 ? Math.max(0, Math.min(1, totalAmount / totalExpenses)) : 0;

    const displayedCategories = categories.slice(0, 3);
    const remainingCategoriesCount = Math.max(0, categories.length - 3);

    return (
        <Card style={styles.card} onPress={() => onPress && onPress(item)}>
            <View style={styles.container}>
                <View style={styles.topRow}>
                    <View style={styles.topLeft}>
                        <View style={[styles.tagNameContainer, { borderColor: color, backgroundColor: `${color}20` }]}>
                            <Text style={[styles.tagName, { color: color }]}>{name}</Text>
                        </View>
                        <View style={styles.categoriesIconsContainer}>
                            {displayedCategories.map(cat => (
                                <View key={cat.id} style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                                    <Icon source={cat.iconName} size={16} color="#ffffff" />
                                </View>
                            ))}
                            {remainingCategoriesCount > 0 && (
                                <View style={[styles.remainingBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                                    <Text style={[styles.remainingText, { color: theme.colors.onSurfaceVariant }]}>+{remainingCategoriesCount}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Text style={[styles.totalAmount, { color: theme.colors.onSurface }]}>{formatCurrency(totalAmount)}</Text>
                </View>

                <View style={styles.bottomRow}>
                    <View style={styles.progressSection}>
                        <Text style={styles.progressText}>{`${(progress * 100).toFixed(0)}%`}</Text>
                        <View style={styles.progressBarContainer}>
                            <ProgressBar progress={progress} color={color} style={styles.progressBar} />
                        </View>
                    </View>
                    <View style={styles.statsContainer}>
                        <Text style={styles.statText}>{`${transactionCount} ${transactionCount === 1 ? 'transakcja' : transactionCount < 5 ? 'transakcje' : 'transakcji'}`}</Text>
                        <Text style={styles.statText}>Największy: {formatCurrency(largestExpense)}</Text>
                    </View>
                </View>
            </View>
        </Card>
    );
};

const createStyles = (theme) => StyleSheet.create({
    card: {
        marginBottom: 8,
        backgroundColor: theme.colors.elevation.level1,
    },
    container: {
        padding: 12,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    topLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
        flexWrap: 'wrap',
        gap: 8,
    },
    tagNameContainer: {
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    categoriesIconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
        borderWidth: 1.5,
        borderColor: theme.colors.surface
    },
    remainingBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    remainingText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    tagName: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingLeft: 4,
    },
    progressSection: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    progressText: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        marginRight: 6,
        minWidth: 30,
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
    },
    statsContainer: {
        alignItems: 'flex-end',
    },
    statText: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
});

export default TagSummaryItem;