import { transactions, categories, tags, transactionTags } from '@/database/schema';
import { eq, and, gte, lte, lt, sql } from 'drizzle-orm';
import { getPeriodTimestamps, calculateDaysInPeriod } from './periodService';

export const getTagsSummaryData = async (db, period) => {
  if (!db) {
    console.error('[summaryTagService] Instancja bazy danych nie została przekazana.');
    return [];
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

    const taggedExpensesInPeriod = await db
      .select({
        tagId: tags.id,
        tagName: tags.name,
        tagColor: tags.color,
        amount: transactions.amount,
        categoryId: categories.id,
        categoryIcon: categories.iconName,
        categoryColor: categories.color,
      })
      .from(transactions)
      .innerJoin(transactionTags, eq(transactions.id, transactionTags.transactionId))
      .innerJoin(tags, eq(transactionTags.tagId, tags.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions));

    if (!taggedExpensesInPeriod || taggedExpensesInPeriod.length === 0) {
      return [];
    }

    const tagsSummary = {};

    for (const row of taggedExpensesInPeriod) {
      const { tagId, tagName, tagColor, amount, categoryId, categoryIcon, categoryColor } = row;
      const expenseAmount = Math.abs(amount);

      if (!tagsSummary[tagId]) {
        tagsSummary[tagId] = {
          id: tagId,
          name: tagName,
          color: tagColor,
          totalAmount: 0,
          transactionCount: 0,
          largestExpense: 0,
          categories: {},
        };
      }

      const tag = tagsSummary[tagId];
      tag.totalAmount += expenseAmount;
      tag.transactionCount += 1;
      if (expenseAmount > tag.largestExpense) {
        tag.largestExpense = expenseAmount;
      }

      if (!tag.categories[categoryId]) {
        tag.categories[categoryId] = {
          id: categoryId,
          iconName: categoryIcon,
          color: categoryColor,
          totalAmount: 0,
        };
      }
      tag.categories[categoryId].totalAmount += expenseAmount;
    }

    const result = Object.values(tagsSummary)
      .map(tag => ({
        ...tag,
        categories: Object.values(tag.categories).sort((a, b) => b.totalAmount - a.totalAmount),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return result;

  } catch (error) {
    console.error('[summaryTagService] Błąd podczas pobierania danych podsumowania tagów:', error);
    return [];
  }
};

export const getCategoryDataForTag = async (db, tagId, period) => {
  if (!db) {
    console.error('[summaryTagService] Instancja bazy danych nie została przekazana.');
    return { dataForChart: [], totalExpenses: 0 };
  }

  try {
    const conditions = [
      lt(transactions.amount, 0),
      eq(transactionTags.tagId, tagId)
    ];

    if (period && period.startDate && period.endDate) {
      const { startTimestamp, endTimestamp } = getPeriodTimestamps(period);
      if (startTimestamp && endTimestamp) {
        conditions.push(gte(transactions.transactionDate, startTimestamp));
        conditions.push(lte(transactions.transactionDate, endTimestamp));
      }
    }

    const result = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        categoryIcon: categories.iconName,
        categoryColor: categories.color,
        totalAmount: sql`sum(abs(${transactions.amount}))`.mapWith(Number),
        transactionCount: sql`count(*)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(transactionTags, eq(transactions.id, transactionTags.transactionId))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(categories.id, categories.name, categories.iconName, categories.color);

    if (!result || result.length === 0) {
      return { dataForChart: [], totalExpenses: 0 };
    }

    const daysInPeriod = period ? calculateDaysInPeriod(period.startDate, period.endDate) : 1;
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
    console.error('[summaryTagService] Błąd podczas pobierania danych kategorii dla taga:', error);
    return { dataForChart: [], totalExpenses: 0 };
  }
};