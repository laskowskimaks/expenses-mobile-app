import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, useTheme, Text, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Foundation } from '@expo/vector-icons';
import { useDb } from '@/context/DbContext';
import { getCategoryDataForTag } from '@/services/summaryTagService';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';
import CategoryExpenseList from '@/components/CategoryExpenseList';

export default function TagDetailsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { db } = useDb();

    //console.log('[TagDetailsScreen] Renderowanie z parametrami:', params);

    const tagId = parseInt(params.tagId, 10);
    const tagName = params.tagName;
    const tagColor = params.tagColor;
    const periodText = params.periodText;

    const startDate = useMemo(() => params.startDate ? new Date(params.startDate) : null, [params.startDate]);
    const endDate = useMemo(() => params.endDate ? new Date(params.endDate) : null, [params.endDate]);
    const styles = createStyles(theme, tagColor);

    const [chartData, setChartData] = useState({ data: [], total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!db || !tagId || !startDate || !endDate) {
                //console.log('[TagDetailsScreen] Pomijam pobieranie - brak danych (db, tagId, daty)');
                return;
            }
            //console.log(`[TagDetailsScreen] Rozpoczynam pobieranie danych dla taga ID: ${tagId}`);
            setIsLoading(true);
            try {
                const period = { startDate, endDate };
                const result = await getCategoryDataForTag(db, tagId, period);
                setChartData({ data: result.dataForChart, total: result.totalExpenses });
            } catch (error) {
                console.error("[TagDetailsScreen] Błąd podczas pobierania danych:", error);
                setChartData({ data: [], total: 0 });
            } finally {
                //console.log('[TagDetailsScreen] Zakończono pobieranie danych.');
                setIsLoading(false);
            }
        };

        fetchData();
    }, [db, tagId, startDate, endDate]);

    const handleShowAllExpenses = () => {
        if (!startDate || !endDate) return;
        const startDateTimestamp = Math.floor(startDate.getTime() / 1000);
        const endDateTimestamp = Math.floor(endDate.getTime() / 1000);

        router.push({
            pathname: '/(tabs)/transactionListScreen',
            params: {
                filterTagId: tagId,
                filterDateFrom: startDateTimestamp,
                filterDateTo: endDateTimestamp,
            }
        });
    };

    const handleCategoryPress = (category) => {
        if (!startDate || !endDate) return;
        const startDateTimestamp = Math.floor(startDate.getTime() / 1000);
        const endDateTimestamp = Math.floor(endDate.getTime() / 1000);

        router.push({
            pathname: '/(tabs)/transactionListScreen',
            params: {
                filterTagId: tagId,
                filterCategoryId: category.id,
                filterDateFrom: startDateTimestamp,
                filterDateTo: endDateTimestamp,
            }
        });
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