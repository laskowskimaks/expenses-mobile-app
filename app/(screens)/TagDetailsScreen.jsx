import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, useTheme, Text, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Foundation } from '@expo/vector-icons';
import { useDb } from '@/context/DbContext';
import { getCategoryDataForTag } from '@/services/summaryTagService';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';
import CategoryExpenseList from '@/components/lists/CategoryExpenseList';

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

export default function TagDetailsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { db } = useDb();

    const tagId = params.tagId !== undefined && !isNaN(Number(params.tagId)) ? parseInt(params.tagId, 10) : null;
    const tagName = params.tagName;
    const tagColor = params.tagColor;
    const periodText = params.periodText;

    const startDate = useMemo(() => {
        if (!params.startDate) return null;
        const d = new Date(params.startDate);
        return isValidDate(d) ? d : null;
    }, [params.startDate]);
    const endDate = useMemo(() => {
        if (!params.endDate) return null;
        const d = new Date(params.endDate);
        return isValidDate(d) ? d : null;
    }, [params.endDate]);
    const styles = createStyles(theme, tagColor);

    const [chartData, setChartData] = useState({ data: [], total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!db || tagId === null || !startDate || !endDate) {
                return;
            }
            setIsLoading(true);
            try {
                const period = { startDate, endDate };
                const result = await getCategoryDataForTag(db, tagId, period);
                setChartData({ data: result.dataForChart, total: result.totalExpenses });
            } catch (error) {
                console.error("[TagDetailsScreen] Błąd podczas pobierania danych:", error);
                setChartData({ data: [], total: 0 });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [db, tagId, startDate, endDate]);

    const handleShowAllExpenses = () => {
        if (!startDate || !endDate || tagId === null) return;
        try {
            const startDateTimestamp = Math.floor(startDate.getTime() / 1000);
            const endDateTimestamp = Math.floor(endDate.getTime() / 1000);

            router.push({
                pathname: '/(tabs)/transactionList',
                params: {
                    filterTagId: tagId,
                    filterDateFrom: startDateTimestamp,
                    filterDateTo: endDateTimestamp,
                }
            });
        } catch (error) {
            console.error("[TagDetailsScreen] Błąd podczas przechodzenia do listy transakcji:", error);
        }
    };

    const handleCategoryPress = (category) => {
        if (!startDate || !endDate || tagId === null) return;
        try {
            const startDateTimestamp = Math.floor(startDate.getTime() / 1000);
            const endDateTimestamp = Math.floor(endDate.getTime() / 1000);

            router.push({
                pathname: '/(tabs)/transactionList',
                params: {
                    filterTagId: tagId,
                    filterCategoryId: category.id,
                    filterDateFrom: startDateTimestamp,
                    filterDateTo: endDateTimestamp,
                }
            });
        } catch (error) {
            console.error("[TagDetailsScreen] Błąd podczas przechodzenia do listy transakcji z kategorią:", error);
        }
    };

    const HeaderTitle = () => (
        <View style={styles.chipContainer}>
            <Text style={styles.chipText}>{tagName}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header style={{ backgroundColor: theme.colors.background }} statusBarHeight={0}>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content
                    title={<HeaderTitle />}
                    subtitle={periodText}
                    style={styles.headerContent}
                />
                <Button
                    mode="text"
                    onPress={handleShowAllExpenses}
                    icon={({ size, color }) => <Foundation name="list" size={18} color={color} />}
                    labelStyle={styles.headerButtonText}
                    style={styles.headerButton}
                    uppercase={false}
                    textColor={theme.colors.onSurfaceVariant}
                >
                    <Text>   Pokaż transakcje</Text>
                </Button>
            </Appbar.Header>

            <ScrollView style={styles.scrollView}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <>
                        <CategoryDonutChart
                            data={chartData.data}
                            total={chartData.total}
                            isLoading={false}
                            compact={false}
                        />
                        <CategoryExpenseList
                            data={chartData.data}
                            total={chartData.total}
                            isLoading={false}
                            onCategoryPress={handleCategoryPress}
                        />
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme, tagColor) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerContent: {
        marginLeft: -4,
    },
    chipContainer: {
        borderColor: tagColor,
        backgroundColor: `${tagColor}20`,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignSelf: 'flex-start',
    },
    chipText: {
        color: tagColor,
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerButton: {
        marginRight: 8,
    },
    headerButtonText: {
        fontSize: 13,
        marginLeft: 6,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        height: 400,
        justifyContent: 'center',
        alignItems: 'center'
    }
});