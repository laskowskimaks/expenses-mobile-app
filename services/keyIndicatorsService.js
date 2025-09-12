import { transactions } from '@/database/schema';
import { lt, sql, and, gte, lte, asc } from 'drizzle-orm';
import { getSummaryData } from './summaryService';

const getDaysInPeriod = (period) => {
    if (!period || !period.startDate || !period.endDate) {
        return 1;
    }

    const today = new Date();
    const startDate = period.startDate;
    let endDateForCalculation;

    if (period.type === 'all') {
        endDateForCalculation = today;
    }
    else if (today >= startDate && today <= period.endDate) {
        endDateForCalculation = today;
    }
    else {
        endDateForCalculation = period.endDate;
    }

    const start = new Date(startDate);
    const end = new Date(endDateForCalculation);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
        return 1;
    }

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1;
};

const getAverageDailyExpense = async (db, period) => {
    const { totalExpenses } = await getSummaryData(db, period);
    if (totalExpenses === 0) {
        return 0;
    }
    const numberOfDays = getDaysInPeriod(period);
    return totalExpenses / numberOfDays;
};

const getTransactionCount = async (db, period) => {
    const conditions = [];
    if (period && period.startDate && period.endDate) {
        conditions.push(gte(transactions.transactionDate, Math.floor(period.startDate.getTime() / 1000)));
        conditions.push(lte(transactions.transactionDate, Math.floor(period.endDate.getTime() / 1000)));
    }

    const result = await db.select({
        expenseCount: sql`count(case when ${transactions.amount} < 0 then 1 end)`.mapWith(Number),
        incomeCount: sql`count(case when ${transactions.amount} > 0 then 1 end)`.mapWith(Number),
    }).from(transactions).where(and(...conditions));

    return result[0] || { expenseCount: 0, incomeCount: 0 };
};

const getLargestExpense = async (db, period) => {
    const conditions = [lt(transactions.amount, 0)];
    if (period && period.startDate && period.endDate) {
        conditions.push(gte(transactions.transactionDate, Math.floor(period.startDate.getTime() / 1000)));
        conditions.push(lte(transactions.transactionDate, Math.floor(period.endDate.getTime() / 1000)));
    }

    const result = await db.select({
        title: transactions.title,
        amount: transactions.amount,
    })
    .from(transactions)
    .where(and(...conditions))
    .orderBy(asc(transactions.amount))
    .limit(1);

    return result[0] ? { title: result[0].title, amount: Math.abs(result[0].amount) } : null;
};

export const getKeyIndicatorsData = async (db, period) => {
    if (!db) {
        console.error('[keyIndicatorsService] Instancja bazy danych nie została przekazana.');
        return null;
    }

    try {
        const [
            averageDailyExpense,
            transactionCount,
            largestExpense,
        ] = await Promise.all([
            getAverageDailyExpense(db, period),
            getTransactionCount(db, period),
            getLargestExpense(db, period),
        ]);

        return {
            averageDailyExpense,
            transactionCount,
            largestExpense,
        };

    } catch (error) {
        console.error('[keyIndicatorsService] Błąd podczas pobierania kluczowych wskaźników:', error);
        return null;
    }
};