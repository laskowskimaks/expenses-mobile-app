import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';
import CategoryExpenseList from '@/components/CategoryExpenseList';

export default function ExpenseDetailsScreen() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const params = useLocalSearchParams();

    const chartData = params.data ? JSON.parse(params.data) : [];
    const total = params.total ? parseFloat(params.total) : 0;
    const periodText = params.periodText || 'Szczegóły wydatków';
    const startDate = params.startDate ? new Date(params.startDate) : null;
    const endDate = params.endDate ? new Date(params.endDate) : null;

    const handleCategoryPress = (category) => {
        if (!startDate || !endDate) return;

        const startDateTimestamp = Math.floor(startDate.getTime() / 1000);
        const endDateTimestamp = Math.floor(endDate.getTime() / 1000);

        router.push({
            pathname: '/(tabs)/transactionListScreen',
            params: {
                filterCategoryId: category.id,
                filterDateFrom: startDateTimestamp,
                filterDateTo: endDateTimestamp,
            }
        });
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