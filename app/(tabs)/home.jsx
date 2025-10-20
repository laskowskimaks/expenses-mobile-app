import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useDb } from '@/context/DbContext';
import { getAllSettingsAsObject } from '@/services/settingService';
import { useTheme, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getCategoryExpenseData } from '@/services/categoriesChartService';
import { getSummaryData } from '@/services/summaryService';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';
import BillingPeriodSelector from '@/components/pickers/BillingPeriodSelector';
import DateRangeModal from '@/app/(modals)/DateRangeModal';
import SummaryCard from '@/components/cards/SummaryCard';
import { getTransactionDateRange, getTransactionsForPeriod } from '@/services/transactionService';
import { calculatePeriod, getNextPeriod, getPreviousPeriod, formatPeriodForDisplay } from '@/services/periodService';
import KeyIndicatorsCard from '@/components/cards/KeyIndicatorsCard';
import { getKeyIndicatorsData } from '@/services/keyIndicatorsService';
import { eventEmitter } from '@/utils/eventEmitter';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { getTagsSummaryData } from '@/services/summaryTagService';
import TagsSummaryCard from '@/components/cards/TagsSummaryCard';
import HomeSkeleton from '@/components/skeletons/HomeSkeleton';
import CategoryDonutChartSkeleton from '@/components/skeletons/CategoryDonutChartSkeleton';
import SummaryCardSkeleton from '@/components/skeletons/SummaryCardSkeleton';
import KeyIndicatorsCardSkeleton from '@/components/skeletons/KeyIndicatorsCardSkeleton';
import TagsSummaryCardSkeleton from '@/components/skeletons/TagsSummaryCardSkeleton';

export default function HomeScreen() {
  const { user } = useAuth();
  const { db } = useDb();
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [billingStartDay, setBillingStartDay] = useState('1');
  const [transactionBounds, setTransactionBounds] = useState({ minDate: null, maxDate: null });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState(0);

  const [chartData, setChartData] = useState({ data: [], total: 0 });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({ expenses: 0, income: 0 });
  const [indicatorsData, setIndicatorsData] = useState(null);
  const [tagsSummaryData, setTagsSummaryData] = useState([]);

  useEffect(() => {
    if (!db) return;

    const refreshCoreData = async () => {
      setIsInitialLoading(true);
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
  }, [db]);

  const fetchDataForPeriod = useCallback(async (period = currentPeriod) => {
    if (!db || !period) return;

    setIsDataLoading(true);

    try {
      const periodForQuery = period.type === 'all' ? null : period;

      let transactionsForPeriod;
      if (periodForQuery && periodForQuery.startDate && periodForQuery.endDate) {
        transactionsForPeriod = await getTransactionsForPeriod(db, periodForQuery.startDate, periodForQuery.endDate);
      } else {
        transactionsForPeriod = await getTransactionsForPeriod(db);
      }

      console.log(`[HomeScreen] Pobrano ${transactionsForPeriod.length} transakcji dla okresu ${period.type}`);

      const [chartResult, summaryResult, indicatorsResult, tagsResult] = await Promise.all([
        getCategoryExpenseData(db, periodForQuery),
        getSummaryData(db, periodForQuery),
        getKeyIndicatorsData(db, period),
        getTagsSummaryData(db, periodForQuery),
      ]);

      setChartData({ data: chartResult.dataForChart, total: chartResult.totalExpenses });
      setSummaryData({ expenses: summaryResult.totalExpenses, income: summaryResult.totalIncome });
      setIndicatorsData(indicatorsResult);
      setTagsSummaryData(tagsResult);

    } catch (error) {
      console.error("[HomeScreen] Błąd podczas pobierania danych dla okresu:", error);
      setChartData({ data: [], total: 0 });
      setSummaryData({ expenses: 0, income: 0 });
      setIndicatorsData(null);
      setTagsSummaryData([]);
    } finally {
      setIsDataLoading(false);
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

    const handleCategoriesChange = async () => {
      console.log('[HomeScreen] Odebrano event zmiany kategorii, odświeżam dane wykresów...');
      if (currentPeriod) {
        setIsDataLoading(true);

        try {
          const periodForQuery = currentPeriod.type === 'all' ? null : currentPeriod;

          const [chartResult, indicatorsResult] = await Promise.all([
            getCategoryExpenseData(db, periodForQuery),
            getKeyIndicatorsData(db, currentPeriod),
          ]);

          setChartData({ data: chartResult.dataForChart, total: chartResult.totalExpenses });
          setIndicatorsData(indicatorsResult);
        } catch (error) {
          console.error("[HomeScreen] Błąd podczas odświeżania po zmianie kategorii:", error);
        } finally {
          setIsDataLoading(false);
        }
      }
    };

    const handleTagsChange = async () => {
      console.log('[HomeScreen] Odebrano event zmiany tagów, odświeżam dane tagów...');
      if (currentPeriod) {
        setIsDataLoading(true);
        try {
          const periodForQuery = currentPeriod.type === 'all' ? null : currentPeriod;
          const tagsSummary = await getTagsSummaryData(db, periodForQuery);
          setTagsSummaryData(tagsSummary);
        } catch (error) {
          console.error("[HomeScreen] Błąd podczas odświeżania tagów:", error);
          setTagsSummaryData([]);
        } finally {
          setIsDataLoading(false);
        }
      }
    };

    const handleSettingsChange = async (payload) => {

      if (payload?.key === 'savings_goal') {
        setIsInitialLoading(true);
        try {
          const settings = await getAllSettingsAsObject(db);
          const goal = parseFloat(settings.savings_goal) || 0;
          setSavingsGoal(goal);
          await fetchDataForPeriod();
        } catch (error) {
          console.error("[HomeScreen] Błąd podczas odświeżania celu oszczędnościowego:", error);
        } finally {
          setIsInitialLoading(false);
        }
      }
      if (payload?.key === 'payment_day') {
        setIsInitialLoading(true);
        try {
          const settings = await getAllSettingsAsObject(db);
          const day = settings.billing_period_start_day || '1';
          setBillingStartDay(day);
          const newPeriod = {
            ...calculatePeriod(new Date(), day),
            type: 'billing'
          };
          setCurrentPeriod(newPeriod);

          await fetchDataForPeriod();
        } catch (error) {
          console.error("[HomeScreen] Błąd podczas odświeżania dnia rozpoczęcia okresu:", error);
        } finally {
          setIsInitialLoading(false);
        }
      }
    };

    eventEmitter.on('transactionAdded', handleTransactionChange);
    eventEmitter.on('transactionEdited', handleTransactionChange);
    eventEmitter.on('transactionDeleted', handleTransactionChange);
    eventEmitter.on('periodicTransactionChanged', handleTransactionChange);
    eventEmitter.on('periodicTransactionAdded', handleTransactionChange);
    eventEmitter.on('categoriesChanged', handleCategoriesChange);
    eventEmitter.on('tagsChanged', handleTagsChange);
    eventEmitter.on('settingsChanged', handleSettingsChange);

    return () => {
      eventEmitter.off('transactionAdded', handleTransactionChange);
      eventEmitter.off('transactionEdited', handleTransactionChange);
      eventEmitter.off('transactionDeleted', handleTransactionChange);
      eventEmitter.off('periodicTransactionChanged', handleTransactionChange);
      eventEmitter.off('periodicTransactionAdded', handleTransactionChange);
      eventEmitter.off('categoriesChanged', handleCategoriesChange);
      eventEmitter.off('tagsChanged', handleTagsChange);
      eventEmitter.off('settingsChanged', handleSettingsChange);

    };
  }, [db, fetchDataForPeriod, currentPeriod]);

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

  const handleChartDoubleClick = () => {
    if (!isDataLoading && chartData.data && chartData.data.length > 0 && currentPeriod) {
      router.push({
        pathname: '/(screens)/ExpenseDetailsScreen',
        params: {
          data: JSON.stringify(chartData.data),
          total: chartData.total,
          periodText: formatPeriodForDisplay(currentPeriod),
          startDate: currentPeriod.startDate.toISOString(),
          endDate: currentPeriod.endDate.toISOString(),
        }
      });
    }
  };

  const handleTagPress = (tag) => {
    if (!currentPeriod || !currentPeriod.startDate || !currentPeriod.endDate) return;

    router.push({
      pathname: '/(screens)/TagDetailsScreen',
      params: {
        tagId: tag.id,
        tagName: tag.name,
        tagColor: tag.color,
        periodText: formatPeriodForDisplay(currentPeriod),
        startDate: currentPeriod.startDate.toISOString(),
        endDate: currentPeriod.endDate.toISOString(),
      }
    });
  };

  const hasAnyTransactions = !isDataLoading && (
    summaryData.expenses > 0 ||
    summaryData.income > 0 ||
    chartData.total > 0 ||
    (indicatorsData && indicatorsData.transactionCount &&
      (indicatorsData.transactionCount.expenseCount > 0 || indicatorsData.transactionCount.incomeCount > 0))
  );

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
    return <HomeSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.stickyHeader}>
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
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView style={styles.scrollView}>
          <TapGestureHandler
            numberOfTaps={2}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.ACTIVE) {
                handleChartDoubleClick();
              }
            }}
          >
            <View>
              <CategoryDonutChart
                data={chartData.data}
                total={chartData.total}
                isLoading={isDataLoading}
                compact={true}
                skeleton={<CategoryDonutChartSkeleton compact={true} />}
              />
            </View>
          </TapGestureHandler>

          <SummaryCard
            expenses={summaryData.expenses}
            income={summaryData.income}
            isLoading={isDataLoading}
            savingsGoal={savingsGoal}
            skeleton={<SummaryCardSkeleton />}
          />

          <KeyIndicatorsCard
            data={indicatorsData}
            isLoading={isDataLoading}
            skeleton={<KeyIndicatorsCardSkeleton />}
          />

          <TagsSummaryCard
            data={tagsSummaryData}
            isLoading={isDataLoading}
            totalExpenses={chartData.total}
            onTagPress={handleTagPress}
            skeleton={<TagsSummaryCardSkeleton />}
          />
        </ScrollView>

        {!hasAnyTransactions && !isDataLoading && (
          <View style={styles.noTransactionsOverlay}>
            <View style={styles.noTransactionsContainer}>
              <Text style={styles.noTransactionsText}>
                Brak transakcji w tym okresie
              </Text>
              <Text style={styles.noTransactionsSubtext}>
                Dodaj pierwszą transakcję, aby zobaczyć statystyki
              </Text>
            </View>
          </View>
        )}
      </View>

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
  },
  stickyHeader: {
    backgroundColor: theme.colors.background,
    paddingTop: 8,
    paddingBottom: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 75,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  noTransactionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.dark
      ? 'rgba(0, 0, 0, 0.7)'
      : 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  noTransactionsContainer: {
    backgroundColor: theme.colors.surface,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginHorizontal: 32,
  },
  noTransactionsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  noTransactionsSubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});