import { transactions, periodicTransactions, categories } from '@/database/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const getAllTransactionsSorted = async (db) => {
  try {
    console.log('[TransactionService] Pobieranie wszystkich transakcji...');

    const regularTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        title: transactions.title,
        transactionDate: transactions.transactionDate,
        notes: transactions.notes,
        location: transactions.location,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.iconName,
        type: sql`'regular'`.as('type')
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.transactionDate));

    console.log(`[TransactionService] Pobrano ${regularTransactions.length} transakcji z tabeli transactions`);

    return regularTransactions;

  } catch (error) {
    console.error('[TransactionService] Błąd podczas pobierania transakcji:', error);
    return [];
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  }).format(amount);
};

export const formatDate = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Brak daty';
  }
  
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp * 1000));
  } catch (error) {
    console.error('[formatDate] Błąd formatowania:', error);
    return 'Błąd formatowania';
  }
};

export const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);
export const dateToTimestamp = (date) => Math.floor(date.getTime() / 1000);