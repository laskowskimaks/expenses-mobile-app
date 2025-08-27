import { transactions, categories, tags, transactionTags, periodicTransactions } from '@/database/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { processTransactionTags } from './tagService';
import { addPeriodicTransaction, processPeriodicTransactions } from './periodicTransactionService';
import { eventEmitter } from '@/utils/eventEmitter';

let activePromise = null;

export function resetTransactionMutex() {
  activePromise = null;
}

export async function getAllTransactionsSortedSafe(db) {
  if (activePromise) {
    console.log('[TransactionService] Fetch już trwa, używam istniejącego Promise...');
    return activePromise;
  }
  activePromise = getAllTransactionsSorted(db);

  try {
    const result = await activePromise;
    return result;
  } finally {
    activePromise = null;
  }
}

export const getAllTransactionsSorted = async (db) => {
  if (!db) {
    console.error('[TransactionService] Baza danych jest null - nie można pobrać transakcji');
    return [];
  }

  try {
    console.log('[TransactionService] Pobieranie wszystkich transakcji (zoptymalizowane)...');

    const allTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        title: transactions.title,
        transactionDate: transactions.transactionDate,
        notes: transactions.notes,
        location: transactions.location,
        periodicTransactionId: transactions.periodicTransactionId,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.iconName,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.transactionDate));

    const allTransactionTags = await db
      .select({
        transactionId: transactionTags.transactionId,
        tagId: tags.id,
        tagName: tags.name,
        tagColor: tags.color,
      })
      .from(transactionTags)
      .innerJoin(tags, eq(transactionTags.tagId, tags.id));

    const tagsByTransaction = allTransactionTags.reduce((acc, tagRow) => {
      if (!acc[tagRow.transactionId]) acc[tagRow.transactionId] = [];
      acc[tagRow.transactionId].push({
        id: tagRow.tagId,
        name: tagRow.tagName,
        color: tagRow.tagColor,
      });
      return acc;
    }, {});

    const transactionsWithTags = allTransactions.map(tx => ({
      ...tx,
      tags: tagsByTransaction[tx.id] || []
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
      const normalizedAmount = String(transactionData.amount || '0')
        .replace(',', '.')
        .replace(/[^0-9.]/g, '');

      let finalAmount = parseFloat(normalizedAmount);

      if (isNaN(finalAmount) || finalAmount <= 0) {
        throw new Error('Kwota musi być liczbą większą od 0');
      }

      if (transactionData.type === 'expenditure') {
        finalAmount = -Math.abs(finalAmount);
      }

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
        periodicTransactionId: transactionData.periodicTransactionId ?? null
      }).returning({ insertedId: transactions.id });

      const newTransactionId = newTransaction[0].insertedId;

      if (transactionData.tags && transactionData.tags.length > 0) {
        await processTransactionTags(tx, newTransactionId, transactionData.tags);
      }

      return { success: true, transactionId: newTransactionId };
    });

    console.log(`[transactionService] Pomyślnie dodano transakcję o ID: ${result.transactionId}`);
    resetTransactionMutex();
    return result;

  } catch (error) {
    console.error("[transactionService] Błąd podczas dodawania transakcji:", error);
    return { success: false, message: error.message || "Wystąpił nieoczekiwany błąd." };
  }
};

export const getTransactionById = async (db, transactionId) => {
    if (!db || !transactionId) return null;
    try {
        const rows = await db
            .select()
            .from(transactions)
            .where(eq(transactions.id, transactionId))
            .limit(1);

        if (!rows || rows.length === 0) return null;
        let tx = rows[0];

        const tagRows = await db
            .select({
                id: tags.id,
                name: tags.name,
                color: tags.color,
            })
            .from(transactionTags)
            .innerJoin(tags, eq(transactionTags.tagId, tags.id))
            .where(eq(transactionTags.transactionId, transactionId));

        let periodicPattern = null;
        if (tx.periodicTransactionId) {
            const patternRows = await db
                .select()
                .from(periodicTransactions)
                .where(eq(periodicTransactions.id, tx.periodicTransactionId))
                .limit(1);
            if (patternRows.length > 0) {
                periodicPattern = patternRows[0];
            }
        }

        return { ...tx, tags: tagRows, periodicPattern };
    } catch (err) {
        console.error('[transactionService] getTransactionById error', err);
        return null;
    }
};

export const updateTransaction = async (db, transactionId, data, options = { mode: 'single' }) => {
    if (!db) return { success: false, message: 'Brak połączenia z bazą danych.' };
  
    try {
      await db.transaction(async (tx) => {
        const normalizedAmount = parseFloat(String(data.amount || '0').replace(',', '.'));
        if (isNaN(normalizedAmount) || normalizedAmount <= 0) {
          throw new Error('Kwota musi być dodatnią liczbą.');
        }
        const finalAmount = data.type === 'expenditure' ? -Math.abs(normalizedAmount) : Math.abs(normalizedAmount);
        const transactionTimestamp = Math.floor(data.date.getTime() / 1000);
  
        if (options.mode === 'single') {
          await tx.update(transactions)
            .set({
              amount: finalAmount,
              title: data.title,
              transactionDate: transactionTimestamp,
              notes: data.description,
              location: data.location,
              categoryId: data.categoryId,
              periodicTransactionId: null,
            })
            .where(eq(transactions.id, transactionId));
  
          await tx.delete(transactionTags).where(eq(transactionTags.transactionId, transactionId));
          if (data.tags && data.tags.length > 0) {
            await processTransactionTags(tx, transactionId, data.tags);
          }
        } else if (options.mode === 'future') {
          const originalTx = await getTransactionById(tx, transactionId);
          if (!originalTx || !originalTx.periodicTransactionId) {
            throw new Error("Transakcja nie jest częścią serii lub nie została znaleziona.");
          }
  
          const dayBefore = originalTx.transactionDate - 1; 
          await tx.update(periodicTransactions)
            .set({ endDate: dayBefore })
            .where(eq(periodicTransactions.id, originalTx.periodicTransactionId));
  
          await tx.delete(transactions)
            .where(and(
              eq(transactions.periodicTransactionId, originalTx.periodicTransactionId),
              gte(transactions.transactionDate, originalTx.transactionDate)
            ));
          
          const newPeriodicData = {
              type: data.type,
              title: data.title,
              categoryId: data.categoryId,
              amount: finalAmount,
              repeatInterval: data.repeatInterval,
              repeatUnit: data.repeatUnit,
              startDate: data.date,
              endDate: data.endDate,
              description: data.description,
              location: data.location,
              tags: data.tags,
          };
          
          const res = await addPeriodicTransaction(tx, newPeriodicData);
          if (!res.success) {
            throw new Error(res.message || "Nie udało się utworzyć nowej serii cyklicznej.");
          }
          
          await processPeriodicTransactions(tx);
        }
      });
      resetTransactionMutex();
      eventEmitter.emit('transactionEdited', {}); 
      return { success: true };
    } catch (err) {
      console.error('[transactionService] updateTransaction error', err);
      return { success: false, message: err.message || 'Błąd podczas aktualizacji transakcji.' };
    }
};
  
export const deleteTransaction = async (db, transactionId, options = { mode: 'single' }) => {
    if (!db) return { success: false, message: 'Brak połączenia z bazą danych.' };

    try {
        await db.transaction(async (tx) => {
        const targetTx = await tx.select()
            .from(transactions)
            .where(eq(transactions.id, transactionId)).limit(1);

        if (targetTx.length === 0) throw new Error('Transakcja nie istnieje.');

        const { periodicTransactionId, transactionDate } = targetTx[0];

        if (options.mode === 'single' || !periodicTransactionId) {
            await tx.delete(transactions).where(eq(transactions.id, transactionId));
        } else if (options.mode === 'future') {
            const dayBefore = transactionDate - 1;
            await tx.update(periodicTransactions)
                .set({ endDate: dayBefore })
                .where(eq(periodicTransactions.id, periodicTransactionId));

            await tx.delete(transactions)
                .where(and(
                    eq(transactions.periodicTransactionId, periodicTransactionId),
                    gte(transactions.transactionDate, transactionDate)
                ));
        }
        });
        resetTransactionMutex();
        return { success: true };
    } catch (err) {
        console.error('[transactionService] deleteTransaction error', err);
        return { success: false, message: err.message || 'Błąd podczas usuwania transakcji.' };
    }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  }).format(amount);
};