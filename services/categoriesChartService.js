import { transactions, categories } from '@/database/schema';
import { eq, sql, and, gte, lte, lt } from 'drizzle-orm';
import { getPeriodTimestamps, calculateDaysInPeriod } from './periodService';

export const getCategoryExpenseData = async (db, period) => {
  if (!db) {
    console.error('[categoriesChartService] Instancja bazy danych nie została przekazana.');
    return { dataForChart: [], totalExpenses: 0 };
  }

  try {
    const conditions = [lt(transactions.amount, 0)];

    if (period && period.startDate && period.endDate) {
      const { startTimestamp, endTimestamp } = getPeriodTimestamps(period);
      if (startTimestamp && endTimestamp) {
        conditions.push(gte(transactions.transactionDate, startTimestamp));
        conditions.push(lte(transactions.transactionDate, endTimestamp));
      }
    }

    const result = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.iconName,
        categoryColor: categories.color,
        totalAmount: sql`sum(abs(${transactions.amount}))`.mapWith(Number),
        transactionCount: sql`count(*)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(transactions.categoryId, categories.name, categories.iconName, categories.color);

    if (!result || result.length === 0) {
      return { dataForChart: [], totalExpenses: 0 };
    }

    let daysInPeriod;
    if (period && period.startDate && period.endDate) {
      const today = new Date();
      const effectiveEndDate = period.endDate > today ? today : period.endDate;
      daysInPeriod = calculateDaysInPeriod(period.startDate, effectiveEndDate);
    } else {
      daysInPeriod = 1;
    }

    const totalExpenses = result.reduce((sum, item) => sum + item.totalAmount, 0);

    const dataForChart = result.map(item => ({
      id: item.categoryId,
      x: item.categoryName,
      y: item.totalAmount,
      color: item.categoryColor,
      iconName: item.categoryIcon,
      transactionCount: item.transactionCount,
      avgDailyExpense: item.totalAmount / daysInPeriod,
    }));

    return { dataForChart, totalExpenses };

  } catch (error) {
    console.error('[categoriesChartService] Błąd podczas pobierania danych kategorii:', error);
    return { dataForChart: [], totalExpenses: 0 };
  }
};