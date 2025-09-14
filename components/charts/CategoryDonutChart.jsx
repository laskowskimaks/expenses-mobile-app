import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Card, Text, useTheme, Icon } from 'react-native-paper';
import { VictoryPie } from 'victory-native';
import { formatCurrency } from '@/services/transactionService';
import CategoryDonutChartSkeleton from '@/components/skeletons/CategoryDonutChartSkeleton';

const { width: screenWidth } = Dimensions.get('window');

const CategoryDonutChart = ({ data, total, isLoading, compact = false }) => {
    const theme = useTheme();
    const styles = createStyles(theme, compact);

    const [selectedSliceId, setSelectedSliceId] = useState(null);

    const chartSize = compact
        ? screenWidth * 0.58
        : screenWidth * 0.65;

    const baseInnerRadius = compact
        ? chartSize * 0.4
        : chartSize * 0.43;

    const selectedData = selectedSliceId ? data.find(d => d.id === selectedSliceId) : null;

    const renderCenterContent = () => {
        if (selectedData) {
            const percentage = total > 0 ? ((selectedData.y / total) * 100).toFixed(1) : 0;
            return (
                <View style={styles.centerLabelContainer}>
                    <Text style={styles.totalAmountText}>{formatCurrency(selectedData.y)}</Text>
                    <View style={styles.categoryDetailsContainer}>
                        <Icon
                            source={selectedData.iconName}
                            size={compact ? 18 : 22}
                            color={theme.colors.onSurface}
                        />
                        <Text style={styles.categoryNameText}>{selectedData.x}</Text>
                    </View>
                    <Text style={styles.percentageText}>{percentage}%</Text>
                </View>
            );
        }

        return (
            <View style={styles.centerLabelContainer}>
                <Text style={styles.totalAmountText}>{formatCurrency(total)}</Text>
                <Text style={styles.totalLabelText}>Wydatki</Text>
            </View>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return <CategoryDonutChartSkeleton compact={compact} />;
        }
        if (!data || data.length === 0) {
            return (
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>Brak wydatków do wyświetlenia</Text>
                </View>
            );
        }

        return (
            <View style={styles.chartContainer}>
                <VictoryPie
                    data={data}
                    x="x"
                    y="y"
                    colorScale={data.map(item => item.color)}
                    width={chartSize}
                    height={chartSize}
                    innerRadius={({ datum }) => {
                        if (selectedSliceId === null) {
                            return baseInnerRadius * 1.1;
                        } else if (datum.id === selectedSliceId) {
                            return baseInnerRadius * 1.1;
                        } else {
                            return baseInnerRadius;
                        }
                    }}
                    outerRadius={({ datum }) => {
                        if (selectedSliceId === null) {
                            return (chartSize / 2) + 15;
                        } else if (datum.id === selectedSliceId) {
                            return (chartSize / 2) + 15;
                        } else {
                            return chartSize / 2;
                        }
                    }}
                    padAngle={2}
                    labels={() => null}
                    animate={{ duration: 350, easing: "bounce" }}
                    style={{
                        data: {
                            fillOpacity: ({ datum }) => {
                                if (selectedSliceId === null) {
                                    return 1;
                                } else if (datum.id === selectedSliceId) {
                                    return 1;
                                } else {
                                    return 0.6;
                                }
                            },
                            stroke: theme.colors.surface,
                            strokeWidth: ({ datum }) => {
                                if (selectedSliceId === null) {
                                    return 3;
                                } else if (datum.id === selectedSliceId) {
                                    return 3;
                                } else {
                                    return 1;
                                }
                            },
                        },
                    }}
                    events={[{
                        target: "data",
                        eventHandlers: {
                            onPress: () => {
                                return [{
                                    target: "data",
                                    mutation: (props) => {
                                        const currentId = props.datum.id;
                                        setSelectedSliceId(prevId => prevId === currentId ? null : currentId);
                                        return null;
                                    }
                                }];
                            }
                        }
                    }]}
                />
                <Pressable
                    onPress={() => setSelectedSliceId(null)}
                    style={styles.pressableCenter}
                    pointerEvents="box-none"
                >
                    {renderCenterContent()}
                </Pressable>
            </View>
        );
    };

    return (
        <Card style={styles.card}>
            <Card.Content>
                {renderContent()}
            </Card.Content>
        </Card>
    );
};

const createStyles = (theme, compact) => StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: compact ? 4 : 16,
        marginTop: 4,
        backgroundColor: theme.colors.elevation.level1,
    },
    placeholderContainer: {
        height: compact ? screenWidth * 0.45 : screenWidth * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: compact ? 14 : 16,
    },
    chartContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: compact ? screenWidth * 0.45 : screenWidth * 0.7,
    },
    pressableCenter: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: '50%',
        height: '50%',
    },
    centerLabelContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalAmountText: {
        fontSize: compact ? 18 : 24,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    totalLabelText: {
        fontSize: compact ? 12 : 14,
        color: theme.colors.onSurfaceVariant,
    },
    categoryDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    categoryNameText: {
        fontSize: compact ? 14 : 16,
        marginLeft: 8,
        color: theme.colors.onSurface,
    },
    percentageText: {
        fontSize: compact ? 10 : 12,
        marginTop: 4,
        color: theme.colors.onSurfaceVariant,
    },
});

export default CategoryDonutChart;