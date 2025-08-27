import { periodicTransactions, transactions, categories, periodicTransactionTags, tags, transactionTags } from '@/database/schema';
import { eq, lte } from 'drizzle-orm';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { eventEmitter } from '@/utils/eventEmitter';
import { getRandomColor } from './tagService';

export const addPeriodicTransaction = async (dbOrTx, periodicTransactionData) => {
    if (!dbOrTx) {
        console.error("[PeriodicTransactionService] Instancja bazy danych nie została przekazana.");
        return { success: false, message: "Błąd bazy danych." };
    }

    try {
        const isTransaction = !!dbOrTx.constructor.name.match(/Transaction/);
        const performTransaction = async (tx) => {
            const normalizedAmount = String(periodicTransactionData.amount || '0')
                .replace(',', '.')
                .replace(/[^0-9.]/g, '');

            let finalAmount = parseFloat(normalizedAmount);

            if (isNaN(finalAmount) || finalAmount <= 0) {
                throw new Error('Kwota musi być liczbą większą od 0');
            }

            if (periodicTransactionData.type === 'expenditure') {
                finalAmount = -Math.abs(finalAmount);
            }

            const startTimestamp = Math.floor(periodicTransactionData.startDate.getTime() / 1000);
            const endTimestamp = periodicTransactionData.endDate
                ? Math.floor(periodicTransactionData.endDate.getTime() / 1000)
                : null;

            const categoryId = periodicTransactionData.categoryId;
            if (!categoryId) {
                throw new Error(`ID kategorii nie zostało przekazane.`);
            }

            if (endTimestamp && endTimestamp <= startTimestamp) {
                throw new Error('Data zakończenia musi być późniejsza niż data początku.');
            }

            if (periodicTransactionData.repeatInterval < 1) {
                throw new Error('Interwał powtarzania musi być większy od 0.');
            }

            const newPeriodicTransaction = await tx.insert(periodicTransactions).values({
                amount: finalAmount,
                title: periodicTransactionData.title,
                repeatInterval: periodicTransactionData.repeatInterval,
                repeatUnit: periodicTransactionData.repeatUnit,
                startDate: startTimestamp,
                nextOccurrenceDate: startTimestamp,
                endDate: endTimestamp,
                notes: periodicTransactionData.description || null,
                categoryId: categoryId,
            }).returning({ insertedId: periodicTransactions.id });

            const newPeriodicTransactionId = newPeriodicTransaction[0].insertedId;

            if (periodicTransactionData.tags && periodicTransactionData.tags.length > 0) {
                const tagIds = [];
                for (const tagName of periodicTransactionData.tags) {
                    const trimmedTagName = tagName.trim();
                    if (!trimmedTagName) continue;

                    const existingTag = await tx.select({ id: tags.id })
                        .from(tags)
                        .where(eq(tags.name, trimmedTagName))
                        .limit(1);

                    let tagId;

                    if (existingTag.length > 0) {
                        tagId = existingTag[0].id;
                    } else {
                        const newTag = await tx.insert(tags).values({
                            name: trimmedTagName,
                            color: getRandomColor()
                        }).returning({ insertedId: tags.id });
                        tagId = newTag[0].insertedId;
                        eventEmitter.emit('tagAdded', { id: tagId, name: trimmedTagName });
                    }
                    tagIds.push(tagId);
                }

                if (tagIds.length > 0) {
                    const tagsToInsert = tagIds.map(tagId => ({
                        periodicTransactionId: newPeriodicTransactionId,
                        tagId: tagId,
                    }));
                    await tx.insert(periodicTransactionTags).values(tagsToInsert);
                }
            }
            return { success: true, periodicTransactionId: newPeriodicTransactionId };
        };

        if (isTransaction) {
            return await performTransaction(dbOrTx);
        } else {
            return await dbOrTx.transaction(performTransaction);
        }

    } catch (error) {
        console.error("[PeriodicTransactionService] Błąd podczas dodawania transakcji cyklicznej:", error);
        return { success: false, message: error.message || "Wystąpił nieoczekiwany błąd." };
    }
};

export const processPeriodicTransactions = async (dbOrTx) => {
    try {
        console.log('[PeriodicTransactionService] Rozpoczynam sprawdzanie transakcji okresowych...');
        const currentTimestamp = getCurrentTimestamp();

        const overduePeriodicTransactions = await dbOrTx
            .select({
                id: periodicTransactions.id,
                amount: periodicTransactions.amount,
                title: periodicTransactions.title,
                categoryId: periodicTransactions.categoryId,
                repeatInterval: periodicTransactions.repeatInterval,
                repeatUnit: periodicTransactions.repeatUnit,
                nextOccurrenceDate: periodicTransactions.nextOccurrenceDate,
                endDate: periodicTransactions.endDate,
                notes: periodicTransactions.notes,
                categoryName: categories.name
            })
            .from(periodicTransactions)
            .leftJoin(categories, eq(periodicTransactions.categoryId, categories.id))
            .where(
                lte(periodicTransactions.nextOccurrenceDate, currentTimestamp)
            );

        console.log(`[PeriodicTransactionService] Znaleziono ${overduePeriodicTransactions.length} zaległych transakcji okresowych`);

        if (overduePeriodicTransactions.length === 0) {
            return { success: true, addedCount: 0, addedTransactions: [], message: 'Brak zaległych transakcji okresowych' };
        }

        let addedTransactionsCount = 0;
        const addedTransactions = [];

        for (const periodicTransaction of overduePeriodicTransactions) {
            try {
                if (periodicTransaction.endDate && periodicTransaction.endDate < currentTimestamp) {
                    console.log(`[PeriodicTransactionService] Transakcja "${periodicTransaction.title}" wygasła, pomijam`);
                    continue;
                }

                let nextOccurrence = periodicTransaction.nextOccurrenceDate;
                let transactionsAddedForThisTemplate = 0;
                const maxIterations = 1000;
                let iterations = 0;

                while (nextOccurrence <= currentTimestamp && iterations < maxIterations) {
                    iterations++;

                    if (periodicTransaction.endDate && nextOccurrence > periodicTransaction.endDate) {
                        console.log(`[PeriodicTransactionService] Osiągnięto datę końcową dla "${periodicTransaction.title}"`);
                        break;
                    }

                    const newTransactionData = {
                        amount: periodicTransaction.amount,
                        title: periodicTransaction.title,
                        transactionDate: nextOccurrence,
                        notes: periodicTransaction.notes ? `${periodicTransaction.notes}\n(transakcja dodana automatycznie)` : `(transakcja dodana automatycznie)`,
                        location: null,
                        categoryId: periodicTransaction.categoryId,
                        periodicTransactionId: periodicTransaction.id,
                    };

                    const insertResult = await dbOrTx
                        .insert(transactions)
                        .values(newTransactionData)
                        .returning();

                    const newTransactionId = insertResult[0].id;

                    const periodicTags = await dbOrTx
                        .select({
                            tagId: periodicTransactionTags.tagId,
                            tagName: tags.name,
                            tagColor: tags.color 
                        })
                        .from(periodicTransactionTags)
                        .innerJoin(tags, eq(periodicTransactionTags.tagId, tags.id))
                        .where(eq(periodicTransactionTags.periodicTransactionId, periodicTransaction.id));

                    if (periodicTags.length > 0) {
                        const tagsToInsert = periodicTags.map(tag => ({
                            transactionId: newTransactionId,
                            tagId: tag.tagId,
                        }));
                        await dbOrTx.insert(transactionTags).values(tagsToInsert);
                    }

                    addedTransactions.push({
                        ...newTransactionData,
                        id: newTransactionId,
                        categoryName: periodicTransaction.categoryName,
                        tags: periodicTags.map(tag => ({ id: tag.tagId, name: tag.tagName, color: tag.tagColor }))
                    });

                    addedTransactionsCount++;
                    transactionsAddedForThisTemplate++;

                    console.log(`[PeriodicTransactionService] Dodano "${periodicTransaction.title}" dla daty ${new Date(nextOccurrence * 1000).toLocaleDateString('pl-PL')}`);

                    nextOccurrence = calculateNextOccurrence(nextOccurrence, periodicTransaction.repeatInterval, periodicTransaction.repeatUnit);
                }

                if (iterations >= maxIterations) {
                    console.warn(`[PeriodicTransactionService] Osiągnięto maksymalną liczbę iteracji (${maxIterations}) dla "${periodicTransaction.title}"`);
                }

                await dbOrTx.update(periodicTransactions)
                    .set({ nextOccurrenceDate: nextOccurrence })
                    .where(eq(periodicTransactions.id, periodicTransaction.id));
            } catch (error) {
                console.error(`[PeriodicTransactionService] Błąd przy przetwarzaniu transakcji "${periodicTransaction.title}":`, error);
            }
        }

        console.log(`[PeriodicTransactionService] Zakończono. Dodano ${addedTransactionsCount} nowych transakcji automatycznych.`);

        return { success: true, addedCount: addedTransactionsCount, addedTransactions, message: `Dodano ${addedTransactionsCount} automatycznych transakcji` };

    } catch (error) {
        console.error('[PeriodicTransactionService] Błąd podczas przetwarzania transakcji okresowych:', error);
        return { success: false, addedCount: 0, addedTransactions: [], message: 'Błąd podczas przetwarzania transakcji okresowych: ' + error.message };
    }
};

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