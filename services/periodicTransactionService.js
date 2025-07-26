import { periodicTransactions, transactions, categories } from '@/database/schema';
import { eq, lte } from 'drizzle-orm';
import { getCurrentTimestamp } from '@/utils/dateUtils';

// Sprawdzanie i dodawanie zaległych transakcji okresowych
export const processPeriodicTransactions = async (db) => {
    try {
        console.log('[PeriodicTransactionService] Rozpoczynam sprawdzanie transakcji okresowych...');
        const currentTimestamp = getCurrentTimestamp();

        // Pobieranie wszystkich aktywnych transakcji okresowych, które wymagają wykonania
        const overduePeriodicTransactions = await db
            .select({
                id: periodicTransactions.id,
                amount: periodicTransactions.amount,
                title: periodicTransactions.title,
                categoryId: periodicTransactions.categoryId,
                repeatInterval: periodicTransactions.repeatInterval,
                repeatUnit: periodicTransactions.repeatUnit,
                nextOccurrenceDate: periodicTransactions.nextOccurrenceDate,
                endDate: periodicTransactions.endDate,
                categoryName: categories.name
            })
            .from(periodicTransactions)
            .leftJoin(categories, eq(periodicTransactions.categoryId, categories.id))
            .where(
                lte(periodicTransactions.nextOccurrenceDate, currentTimestamp)
            );

        console.log(`[PeriodicTransactionService] Znaleziono ${overduePeriodicTransactions.length} zaległych transakcji okresowych`);

        if (overduePeriodicTransactions.length === 0) {
            return {
                success: true,
                addedCount: 0,
                addedTransactions: [],
                message: 'Brak zaległych transakcji okresowych'
            };
        }

        let addedTransactionsCount = 0;
        const addedTransactions = [];

        for (const periodicTransaction of overduePeriodicTransactions) {
            try {
                // Sprawdzenie czy transakcja nie wygasła
                if (periodicTransaction.endDate && periodicTransaction.endDate < currentTimestamp) {
                    console.log(`[PeriodicTransactionService] Transakcja "${periodicTransaction.title}" wygasła (${new Date(periodicTransaction.endDate * 1000).toLocaleDateString()}), pomijam`);
                    continue;
                }

                // Dodawanie transakcji do tabeli transactions
                const newTransactionData = {
                    amount: periodicTransaction.amount,
                    title: `${periodicTransaction.title} (auto)`,
                    transactionDate: periodicTransaction.nextOccurrenceDate,
                    notes: `Automatyczna transakcja z cyklu okresowego`,
                    location: null,
                    categoryId: periodicTransaction.categoryId
                };

                const insertResult = await db
                    .insert(transactions)
                    .values(newTransactionData)
                    .returning();

                if (insertResult && insertResult.length > 0) {
                    addedTransactions.push({
                        ...newTransactionData,
                        id: insertResult[0].id,
                        categoryName: periodicTransaction.categoryName
                    });
                } else {
                    throw new Error('Nie udało się dodać transakcji do bazy danych');
                }

                // Obliczanie następnej daty wystąpienia
                const nextOccurrence = calculateNextOccurrence(
                    periodicTransaction.nextOccurrenceDate,
                    periodicTransaction.repeatInterval,
                    periodicTransaction.repeatUnit
                );

                // Zaktualizowanie nextOccurrenceDate w tabeli periodic_transactions
                try {
                    await db.update(periodicTransactions)
                        .set({ nextOccurrenceDate: nextOccurrence })
                        .where(eq(periodicTransactions.id, periodicTransaction.id));

                    console.log(
                        `[PeriodicTransactionService] Zaktualizowano nextOccurrenceDate dla transakcji ID: ${periodicTransaction.id} na ${new Date(nextOccurrence * 1000).toLocaleDateString()}`
                    );
                } catch (updateError) {
                    console.error(`[PeriodicTransactionService] Błąd przy aktualizacji nextOccurrenceDate dla transakcji ID: ${periodicTransaction.id}:`, updateError);
                }

                addedTransactionsCount++;

                console.log(`[PeriodicTransactionService] Dodano: "${periodicTransaction.title}" (${periodicTransaction.amount} PLN), następna: ${new Date(nextOccurrence * 1000).toLocaleDateString()}`);

            } catch (error) {
                console.error(`[PeriodicTransactionService] Błąd przy przetwarzaniu transakcji "${periodicTransaction.title}":`, error);
            }
        }

        console.log(`[PeriodicTransactionService] Zakończono. Dodano ${addedTransactionsCount} nowych transakcji automatycznych.`);

        return {
            success: true,
            addedCount: addedTransactionsCount,
            addedTransactions,
            message: `Dodano ${addedTransactionsCount} automatycznych transakcji`
        };

    } catch (error) {
        console.error('[PeriodicTransactionService] Błąd podczas przetwarzania transakcji okresowych:', error);
        return {
            success: false,
            addedCount: 0,
            addedTransactions: [],
            message: 'Błąd podczas przetwarzania transakcji okresowych: ' + error.message
        };
    }
};

// Obliczanie następnej daty wystąpienia dla transakcji okresowej
const calculateNextOccurrence = (currentTimestamp, interval, unit) => {
    const currentDate = new Date(currentTimestamp * 1000);
    let nextDate = new Date(currentDate);

    switch (unit) {
        case 'day':
            nextDate.setDate(currentDate.getDate() + interval);
            break;
        case 'week':
            nextDate.setDate(currentDate.getDate() + (interval * 7));
            break;
        case 'month':
            nextDate.setMonth(currentDate.getMonth() + interval);
            break;
        case 'year':
            nextDate.setFullYear(currentDate.getFullYear() + interval);
            break;
        default:
            console.warn(`[PeriodicTransactionService] Nieznana jednostka czasu: ${unit}, używam domyślnie month`);
            nextDate.setMonth(currentDate.getMonth() + interval);
    }

    return Math.floor(nextDate.getTime() / 1000);
};