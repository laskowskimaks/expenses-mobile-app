import { transactions } from '@/database/schema';
import { sql, and, gte, lte, gt, lt, sum } from 'drizzle-orm';

export const getSummaryData = async (db, period) => {
    if (!db) {
        console.error('[summaryService] Instancja bazy danych nie została przekazana.');
        return { totalExpenses: 0, totalIncome: 0 };
    }

    try {
        const conditions = [];
        if (period && period.startDate && period.endDate) {
            const startTimestamp = Math.floor(period.startDate.getTime() / 1000);
            const endTimestamp = Math.floor(period.endDate.getTime() / 1000);
            conditions.push(gte(transactions.transactionDate, startTimestamp));
            conditions.push(lte(transactions.transactionDate, endTimestamp));
        }

        const expensesPromise = db
            .select({
                total: sum(transactions.amount).mapWith(Number)
            })
            .from(transactions)
            .where(and(lt(transactions.amount, 0), ...conditions));

        const incomePromise = db
            .select({
                total: sum(transactions.amount).mapWith(Number)
            })
            .from(transactions)
            .where(and(gt(transactions.amount, 0), ...conditions));

        const [expensesResult, incomeResult] = await Promise.all([expensesPromise, incomePromise]);

        const totalExpenses = Math.abs(expensesResult[0]?.total || 0);
        const totalIncome = incomeResult[0]?.total || 0;

        console.log(`[summaryService] Pomyślnie pobrano podsumowanie: Wydatki - ${totalExpenses}, Wpływy - ${totalIncome}`);

        return { totalExpenses, totalIncome };

    } catch (error) {
        console.error('[summaryService] Błąd podczas pobierania danych podsumowania:', error);
        return { totalExpenses: 0, totalIncome: 0 };
    }
};