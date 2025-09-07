import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme, Icon, Divider } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDateOnly, getCurrentTimestamp } from '@/utils/dateUtils';
import { formatCurrency } from '@/services/transactionService';

const formatInterval = (interval, unit) => {
    if (interval === 1) {
        switch (unit) {
            case 'day': return 'Codziennie';
            case 'week': return 'Co tydzień';
            case 'month': return 'Co miesiąc';
            case 'year': return 'Co rok';
        }
    }
    switch (unit) {
        case 'day': return `Co ${interval} dni`;
        case 'week': return `Co ${interval} tygodnie`;
        case 'month': return `Co ${interval} miesiące`;
        case 'year': return `Co ${interval} lata`;
    }
    return '';
};

const PeriodicTransactionItem = ({ transaction, onEdit, onDelete, maxVisibleTags = 3 }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);
    const swipeableRef = useRef(null);

    const handleEdit = () => {
        swipeableRef.current?.close();
        onEdit();
    };

    const handleDelete = () => {
        swipeableRef.current?.close();
        onDelete();
    };

    const renderRightActions = useCallback((progress, dragX) => {
        const trans = dragX.interpolate({ inputRange: [-160, 0], outputRange: [0, 160], extrapolate: 'clamp' });
        return (
            <Animated.View style={[styles.rightActionContainer, { transform: [{ translateX: trans }] }]}>
                <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                    <Icon source="pencil" size={28} color={theme.colors.primary} />
                    <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edytuj</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                    <Icon source="trash-can-outline" size={28} color={theme.colors.error} />
                    <Text style={[styles.actionText, { color: theme.colors.error }]}>Usuń</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    }, [theme, handleEdit, handleDelete]);

    const {
        title, amount, categoryName, categoryColor = '#888', categoryIcon,
        tags: rawTags = [], notes, repeatInterval, repeatUnit, startDate, nextOccurrenceDate, endDate,
        pastOccurrences, totalOccurrences
    } = transaction;

    const tags = Array.isArray(rawTags) ? rawTags : [];

    const isInactive = useMemo(() => endDate && endDate < getCurrentTimestamp(), [endDate]);

    const { displayedTags, remainingTags } = useMemo(() => {
        const displayed = expanded ? tags : tags.slice(0, maxVisibleTags);
        const remaining = expanded ? 0 : Math.max(0, tags.length - maxVisibleTags);
        return { displayedTags: displayed, remainingTags: remaining };
    }, [expanded, tags, maxVisibleTags]);

    const amountColor = amount < 0 ? theme.colors.error : 'green';
    const gradientColors = [categoryColor, `${categoryColor}00`];

    return (
        <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
            <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => setExpanded(!expanded)}
                style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.gradientBackground}
                />
                <View style={[styles.contentArea, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.topSection}>
                        <View style={styles.leftPart}>
                            <View style={[styles.categoryIconWrapper, { backgroundColor: categoryColor }]}>
                                <Icon source={categoryIcon || 'shape'} size={32} color="white" />
                            </View>
                        </View>
                        <View style={styles.middlePart}>
                            <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
                            <Text style={[styles.categoryText, { color: theme.colors.onSurfaceVariant }]}>{categoryName || 'Inne'}</Text>
                        </View>
                        <View style={styles.rightPart}>
                            <Text style={[styles.amountText, { color: amountColor }]}>{formatCurrency(amount)}</Text>
                            <View style={styles.intervalRow}>
                                <Icon source="calendar-sync" size={14} color={theme.colors.onSurfaceVariant} />
                                <Text style={[styles.intervalText, { color: theme.colors.onSurfaceVariant }]}>
                                    {formatInterval(repeatInterval, repeatUnit)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {expanded && notes && (
                        <View style={styles.descriptionSection}>
                            <Text style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]}>{notes}</Text>
                        </View>
                    )}

                    {tags.length > 0 && (
                        <View style={styles.tagsSection}>
                            {displayedTags.map((t) => (
                                <View key={t.id} style={[styles.tag, { borderColor: t.color, backgroundColor: `${t.color}20` }]}>
                                    <Text style={[styles.tagText, { color: t.color }]}>{t.name}</Text>
                                </View>
                            ))}
                            {remainingTags > 0 && (
                                <View style={[styles.tag, { borderColor: theme.colors.onSurfaceVariant, backgroundColor: theme.colors.surfaceVariant }]}>
                                    <Text style={[styles.tagText, { color: theme.colors.onSurfaceVariant }]}>+{remainingTags}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {expanded && (
                        <View style={styles.expandedDetails}>
                            <Divider style={{ marginVertical: 12, backgroundColor: theme.colors.outlineVariant }} />
                            <View style={styles.detailsGrid}>
                                <View style={styles.detailsColumn}>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>Data rozpoczęcia:</Text>
                                        <Text style={[styles.dateValue, { color: theme.colors.onSurface }]}>{formatDateOnly(startDate)}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>Liczba wystąpień:</Text>
                                        <Text style={[styles.dateValue, { color: theme.colors.onSurface }]}>
                                            {totalOccurrences
                                                ? `${pastOccurrences} z ${totalOccurrences}`
                                                : pastOccurrences
                                            }
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.detailsColumn}>
                                    {endDate && (
                                        <View style={styles.detailItem}>
                                            <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>Data zakończenia:</Text>
                                            <Text style={[styles.dateValue, { color: theme.colors.onSurface }]}>{formatDateOnly(endDate)}</Text>
                                        </View>
                                    )}
                                    <View style={styles.detailItem}>
                                        <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>Kolejne powtórzenie:</Text>
                                        <Text style={[styles.dateValue, { color: theme.colors.onSurface }]}>
                                            {isInactive ? '-' : formatDateOnly(nextOccurrenceDate)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
                {isInactive && (
                    <View style={{
                        backgroundColor: theme.colors.errorContainer,
                        alignItems: 'center',
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        marginBottom: -5,
                    }}>
                        <Text style={{ color: theme.colors.onErrorContainer, fontWeight: 'bold' }}>
                            Transakcja zakończona
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Swipeable>
    );
};
const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        paddingVertical: 4,
    },
    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    contentArea: {
        borderRadius: 18,
        padding: 8,
        marginLeft: 6,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftPart: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    middlePart: {
        flex: 1,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    rightPart: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
    },
    intervalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    intervalText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '500'
    },
    descriptionSection: {
        marginTop: 12,
        paddingHorizontal: 8,
    },
    notesText: {
        lineHeight: 18,
        fontSize: 13,
    },
    tagsSection: {
        marginTop: 10,
        paddingHorizontal: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 6,
        marginBottom: 6,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    expandedDetails: {
        marginTop: 8,
        paddingHorizontal: 8,
    },
    detailsGrid: {
        flexDirection: 'row',
    },
    detailsColumn: {
        flex: 1,
    },
    detailItem: {
        marginBottom: 8,
    },
    dateLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    rightActionContainer: {
        width: 160,
        flexDirection: 'row',
        marginBottom: 12,
        borderRadius: 20,
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 14,
        marginTop: 4,
        fontWeight: '500',
    },
});

export default PeriodicTransactionItem;