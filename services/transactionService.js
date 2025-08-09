import { transactions, categories, tags, transactionTags } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { processTransactionTags } from './tagService';

export const getAllTransactionsSorted = async (db) => {
  try {
    console.log('[TransactionService] Pobieranie wszystkich transakcji (zoptymalizowane)...');

    // Pobierz wszystkie transakcje
    const allTransactions = await db
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
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.transactionDate));

    // Pobierz wszystkie tagi jednym zapytaniem
    const allTransactionTags = await db
      .select({
        transactionId: transactionTags.transactionId,
        tagId: tags.id,
        tagName: tags.name
      })
      .from(transactionTags)
      .innerJoin(tags, eq(transactionTags.tagId, tags.id));

    // Zgrupuj tagi według transactionId
    const tagsByTransaction = allTransactionTags.reduce((acc, tag) => {
      if (!acc[tag.transactionId]) {
        acc[tag.transactionId] = [];
      }
      acc[tag.transactionId].push({
        id: tag.tagId,
        name: tag.tagName
      });
      return acc;
    }, {});

    // Dodaj tagi do transakcji
    const transactionsWithTags = allTransactions.map(transaction => ({
      ...transaction,
      tags: tagsByTransaction[transaction.id] || []
    }));

    console.log(`[TransactionService] Pobrano ${transactionsWithTags.length} transakcji z tagami (zoptymalizowane)`);
    return transactionsWithTags;

  } catch (error) {
    console.error('[TransactionService] Błąd podczas pobierania transakcji:', error);
    return [];
  }
};

export const addTransaction = async (db, transactionData) => {
  if (!db) {
    console.error("[transactionService] Instancja bazy danych nie została przekazana.");
    return { success: false, message: "Błąd bazy danych." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Bezpieczna konwersja kwoty na liczbę
      const normalizedAmount = String(transactionData.amount || '0')
        .replace(',', '.')
        .replace(/[^0-9.]/g, '');

      let finalAmount = parseFloat(normalizedAmount);

      // Walidacja czy to prawidłowa liczba
      if (isNaN(finalAmount) || finalAmount <= 0) {
        throw new Error('Kwota musi być liczbą większą od 0');
      }

      if (transactionData.type === 'expenditure') {
        finalAmount = -Math.abs(finalAmount);
      }

      // Konwersja daty na timestamp (sekundy)
      const transactionTimestamp = Math.floor(transactionData.date.getTime() / 1000);

      const categoryId = transactionData.categoryId;
      if (!categoryId) {
        throw new Error(`ID kategorii nie zostało przekazane.`);
      }

      const newTransaction = await tx.insert(transactions).values({
        amount: finalAmount,
        title: transactionData.title,
        transactionDate: transactionTimestamp,
        notes: transactionData.description,
        location: transactionData.location,
        categoryId: categoryId,
      }).returning({ insertedId: transactions.id });

      const newTransactionId = newTransaction[0].insertedId;

      // Helper funkcji dla tagów
      if (transactionData.tags && transactionData.tags.length > 0) {
        await processTransactionTags(tx, newTransactionId, transactionData.tags);
      }

      return { success: true, transactionId: newTransactionId };
    });

    console.log(`[transactionService] Pomyślnie dodano transakcję o ID: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error("[transactionService] Błąd podczas dodawania transakcji:", error);
    return { success: false, message: error.message || "Wystąpił nieoczekiwany błąd." };
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  }).format(amount);
};

