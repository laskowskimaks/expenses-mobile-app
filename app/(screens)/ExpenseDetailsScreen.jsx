import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, useTheme, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';
import CategoryExpenseList from '@/components/CategoryExpenseList';

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

export default function ExpenseDetailsScreen() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const params = useLocalSearchParams();

    let chartData = [];
    let total = 0;
    let parseError = null;

    try {
        chartData = params.data ? JSON.parse(params.data) : [];
    } catch (err) {
        parseError = 'Nieprawidłowe dane wykresu.';
    }

    if (params.total) {
        const parsedTotal = parseFloat(params.total);
        total = isNaN(parsedTotal) ? 0 : parsedTotal;
    }

    const periodText = params.periodText || 'Szczegóły wydatków';

    const startDate = params.startDate ? new Date(params.startDate) : null;
    const endDate = params.endDate ? new Date(params.endDate) : null;
    const validStartDate = isValidDate(startDate) ? startDate : null;
    const validEndDate = isValidDate(endDate) ? endDate : null;

    const handleCategoryPress = (category) => {
        if (!validStartDate || !validEndDate) return;

        const startDateTimestamp = Math.floor(validStartDate.getTime() / 1000);
        const endDateTimestamp = Math.floor(validEndDate.getTime() / 1000);

        try {
            router.push({
                pathname: '/(tabs)/transactionListScreen',
                params: {
                    filterCategoryId: category.id,
                    filterDateFrom: startDateTimestamp,
                    filterDateTo: endDateTimestamp,
                }
            });
        } catch (error) {
            console.error('[ExpenseDetailsScreen] Błąd nawigacji:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header
                style={{ backgroundColor: theme.colors.background }}
                statusBarHeight={0}
            >
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={periodText} titleStyle={styles.headerTitle} />
            </Appbar.Header>

            <ScrollView style={styles.scrollView}>
                {parseError ? (
                    <View style={{ padding: 24 }}>
                        <Text style={{ color: theme.colors.error }}>{parseError}</Text>
                    </View>
                ) : (
                    <>
                        <CategoryDonutChart
                            data={chartData}
                            total={total}
                            isLoading={false}
                            compact={false}
                        />
                        <CategoryExpenseList
                            data={chartData}
                            total={total}
                            isLoading={false}
                            onCategoryPress={handleCategoryPress}
                        />
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: 18,
    },
    scrollView: {
        flex: 1,
    },
});