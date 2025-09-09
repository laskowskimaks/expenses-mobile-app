import { transactions, categories } from '@/database/schema';
import { eq, lt, sql, isNotNull, and, gte, lte } from 'drizzle-orm';

export const getCategoryExpenseData = async (db, period) => {
    if (!db) {
        console.error('[categoriesChartService] Instancja bazy danych nie została przekazana.');
        return { dataForChart: [], totalExpenses: 0 };
    }

    try {
        const conditions = [
            lt(transactions.amount, 0),
            isNotNull(transactions.categoryId)
        ];

        if (period && period.startDate && period.endDate) {
            const startTimestamp = Math.floor(period.startDate.getTime() / 1000);
            const endTimestamp = Math.floor(period.endDate.getTime() / 1000);

            conditions.push(gte(transactions.transactionDate, startTimestamp));

            conditions.push(lte(transactions.transactionDate, endTimestamp));
        }

        const expenseByCategory = await db
            .select({
                categoryId: categories.id,
                categoryName: categories.name,
                categoryColor: categories.color,
                categoryIcon: categories.iconName,
                total: sql`sum(${transactions.amount})`.mapWith(Number),
            })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(and(...conditions))
            .groupBy(categories.id, categories.name, categories.color, categories.iconName);

        const totalExpenses = expenseByCategory.reduce((acc, row) => acc + Math.abs(row.total), 0);

        const dataForChart = expenseByCategory
            .filter(item => item.total < 0)
            .map(item => ({
                id: item.categoryId,
                x: item.categoryName,
                y: Math.abs(item.total),
                color: item.categoryColor,
                iconName: item.categoryIcon,
            }));

        return { dataForChart, totalExpenses };

    } catch (error) {
        console.error('[categoriesChartService] Błąd podczas pobierania danych o wydatkach:', error);
        return { dataForChart: [], totalExpenses: 0 };
    }
};