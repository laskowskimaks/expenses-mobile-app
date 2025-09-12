import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useDb } from '@/context/DbContext';
import { getAllSettingsAsObject } from '@/services/authService';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getCategoryExpenseData } from '@/services/categoriesChartService';
import { getSummaryData } from '@/services/summaryService';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';
import BillingPeriodSelector from '@/components/BillingPeriodSelector';
import DateRangeModal from '@/components/DateRangeModal';
import SummaryCard from '@/components/SummaryCard';
import { getTransactionDateRange } from '@/services/transactionService';
import { calculatePeriod, getNextPeriod, getPreviousPeriod, formatPeriodForDisplay } from '@/services/periodService';
import CategoryExpenseList from '@/components/CategoryExpenseList';
import KeyIndicatorsCard from '@/components/KeyIndicatorsCard';
import { getKeyIndicatorsData } from '@/services/keyIndicatorsService';
import { eventEmitter } from '@/utils/eventEmitter';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HomeScreen() {
  const { user } = useAuth();
  const { db } = useDb();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [currentPeriod, setCurrentPeriod] = useState(null); // { startDate, endDate, type: 'billing' | 'custom' | 'all' }
  const [billingStartDay, setBillingStartDay] = useState('1');
  const [transactionBounds, setTransactionBounds] = useState({ minDate: null, maxDate: null });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState(0);

  const [chartData, setChartData] = useState({ data: [], total: 0 });
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({ expenses: 0, income: 0 });
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [indicatorsData, setIndicatorsData] = useState(null);
  const [isIndicatorsLoading, setIsIndicatorsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const refreshCoreData = async () => {
        if (!db) return;
        try {
          const settings = await getAllSettingsAsObject(db);
          const startDay = settings.billing_period_start_day || '1';
          const goal = parseFloat(settings.savings_goal) || 0;
          setBillingStartDay(startDay);
          setSavingsGoal(goal);

          const bounds = await getTransactionDateRange(db);
          setTransactionBounds(bounds);

          if (currentPeriod === null) {
            const initialPeriod = {
              ...calculatePeriod(new Date(), startDay),
              type: 'billing'
            };
            setCurrentPeriod(initialPeriod);
          }
        } catch (error) {
          console.error("[HomeScreen] Błąd podczas odświeżania danych bazowych:", error);
        } finally {
          setIsInitialLoading(false);
        }
      };

      refreshCoreData();
    }, [db])
  );

  const fetchDataForPeriod = useCallback(async (period = currentPeriod) => {
    if (!db || !period) return;

    setIsChartLoading(true);
    setIsSummaryLoading(true);
    setIsIndicatorsLoading(true);

    try {
      const periodForQuery = period.type === 'all' ? null : period;

      const [chartResult, summaryResult, indicatorsResult] = await Promise.all([
        getCategoryExpenseData(db, periodForQuery),
        getSummaryData(db, periodForQuery),
        getKeyIndicatorsData(db, period),
      ]);

      setChartData({ data: chartResult.dataForChart, total: chartResult.totalExpenses });
      setSummaryData({ expenses: summaryResult.totalExpenses, income: summaryResult.totalIncome });
      setIndicatorsData(indicatorsResult);

    } catch (error) {
      console.error("[HomeScreen] Błąd podczas pobierania danych dla okresu:", error);
      setChartData({ data: [], total: 0 });
      setSummaryData({ expenses: 0, income: 0 });
      setIndicatorsData(null);
    } finally {
      setIsChartLoading(false);
      setIsSummaryLoading(false);
      setIsIndicatorsLoading(false);
    }
  }, [db, currentPeriod]);

  useEffect(() => {
    fetchDataForPeriod();
  }, [fetchDataForPeriod]);

  useEffect(() => {
    if (!db) return;

    const handleTransactionChange = async () => {
      console.log('[HomeScreen] Odebrano event zmiany transakcji, odświeżam dane...');

      await fetchDataForPeriod();

      try {
        const bounds = await getTransactionDateRange(db);
        setTransactionBounds(bounds);
      } catch (error) {
        console.error("[HomeScreen] Błąd podczas odświeżania bounds:", error);
      }
    };

    eventEmitter.on('transactionAdded', handleTransactionChange);
    eventEmitter.on('transactionEdited', handleTransactionChange);
    eventEmitter.on('transactionDeleted', handleTransactionChange);
    eventEmitter.on('periodicTransactionChanged', handleTransactionChange);
    eventEmitter.on('periodicTransactionAdded', handleTransactionChange);

    return () => {
      eventEmitter.off('transactionAdded', handleTransactionChange);
      eventEmitter.off('transactionEdited', handleTransactionChange);
      eventEmitter.off('transactionDeleted', handleTransactionChange);
      eventEmitter.off('periodicTransactionChanged', handleTransactionChange);
      eventEmitter.off('periodicTransactionAdded', handleTransactionChange);
    };
  }, [db]);

  const handleConfirmDateRange = (newRange) => {
    if (newRange === null) {
      setCurrentPeriod({
        startDate: transactionBounds.minDate,
        endDate: transactionBounds.maxDate,
        type: 'all'
      });
    } else {
      setCurrentPeriod({
        startDate: newRange.startDate,
        endDate: newRange.endDate,
        type: 'custom'
      });
    }
    setIsDateModalVisible(false);
  };

  const handleClearDateRange = () => {
    const defaultPeriod = {
      ...calculatePeriod(new Date(), billingStartDay),
      type: 'billing'
    };
    setCurrentPeriod(defaultPeriod);
    setIsDateModalVisible(false);
  };

  const handlePreviousPeriod = () => {
    setCurrentPeriod(prev => ({ ...getPreviousPeriod(prev, billingStartDay), type: 'billing' }));
  };
  const handleNextPeriod = () => {
    setCurrentPeriod(prev => ({ ...getNextPeriod(prev, billingStartDay), type: 'billing' }));
  };
  const handleGoToStart = () => {
    if (transactionBounds.minDate) {
      setCurrentPeriod({ ...calculatePeriod(transactionBounds.minDate, billingStartDay), type: 'billing' });
    }
  };
  const handleGoToEnd = () => {
    setCurrentPeriod({ ...calculatePeriod(new Date(), billingStartDay), type: 'billing' });
  };

  const isNavigationDisabled = currentPeriod?.type === 'custom' || currentPeriod?.type === 'all';
  const previousPeriod = currentPeriod ? getPreviousPeriod(currentPeriod, billingStartDay) : null;
  const nextPeriod = currentPeriod ? getNextPeriod(currentPeriod, billingStartDay) : null;
  const isPreviousDisabled = isNavigationDisabled || !previousPeriod || (transactionBounds.minDate && previousPeriod.endDate < transactionBounds.minDate);
  const isNextDisabled = isNavigationDisabled || !nextPeriod || nextPeriod.startDate > new Date();
  const oldestPeriod = transactionBounds.minDate ? calculatePeriod(transactionBounds.minDate, billingStartDay) : null;
  const latestPeriod = calculatePeriod(new Date(), billingStartDay);
  const isGoToStartDisabled = isNavigationDisabled || !oldestPeriod || (currentPeriod && currentPeriod.startDate.getTime() <= oldestPeriod.startDate.getTime());
  const isGoToEndDisabled = isNavigationDisabled || !latestPeriod || (currentPeriod && currentPeriod.startDate.getTime() === latestPeriod.startDate.getTime());

  if (!user || isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView >
        <BillingPeriodSelector
          periodText={formatPeriodForDisplay(currentPeriod)}
          onPeriodTextPress={() => setIsDateModalVisible(true)}
          onPrevious={handlePreviousPeriod}
          onNext={handleNextPeriod}
          onGoToStart={handleGoToStart}
          onGoToEnd={handleGoToEnd}
          isPreviousDisabled={isPreviousDisabled}
          isNextDisabled={isNextDisabled}
          isGoToStartDisabled={isGoToStartDisabled}
          isGoToEndDisabled={isGoToEndDisabled}
        />

        <CategoryDonutChart
          data={chartData.data}
          total={chartData.total}
          isLoading={isChartLoading}
        />

        <SummaryCard
          expenses={summaryData.expenses}
          income={summaryData.income}
          isLoading={isSummaryLoading}
          savingsGoal={savingsGoal}
        />

        <KeyIndicatorsCard
          data={indicatorsData}
          isLoading={isIndicatorsLoading}
        />

        <CategoryExpenseList
          data={chartData.data}
          total={chartData.total}
          isLoading={isChartLoading}
        />
      </ScrollView>

      <DateRangeModal
        isVisible={isDateModalVisible}
        onDismiss={() => setIsDateModalVisible(false)}
        onConfirm={handleConfirmDateRange}
        onClear={handleClearDateRange}
        initialPeriod={currentPeriod}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 75,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});