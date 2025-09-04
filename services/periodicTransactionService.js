import { periodicTransactions, transactions, categories, periodicTransactionTags, tags, transactionTags } from '@/database/schema';
import { eq, lte, sql, desc } from 'drizzle-orm';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { eventEmitter } from '@/utils/eventEmitter';
import { getRandomColor } from './tagService';

const addIntervalToDate = (date, interval, unit) => {
    const d = new Date(date);
    switch (unit) {
        case 'day': d.setDate(d.getDate() + interval); break;
        case 'week': d.setDate(d.getDate() + (interval * 7)); break;
        case 'month': d.setMonth(d.getMonth() + interval); break;
        case 'year': d.setFullYear(d.getFullYear() + interval); break;
        default: d.setMonth(d.getMonth() + interval);
    }
    return d;
};

const calculateNextOccurrence = (currentTimestamp, interval, unit) => {
    const currentDate = new Date(currentTimestamp * 1000);
    const nextDate = addIntervalToDate(currentDate, interval, unit);
    return Math.floor(nextDate.getTime() / 1000);
};

const normalizeToLocalDayStart = (timestampSec) => {
    const d = new Date(timestampSec * 1000);
    d.setHours(0, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
};

const calculateOccurrences = (transaction) => {
    const { startDate, nextOccurrenceDate, endDate, repeatInterval, repeatUnit } = transaction;
    if (!startDate || !nextOccurrenceDate || !repeatInterval || !repeatUnit) {
        return { pastOccurrences: 0, totalOccurrences: null };
    }

    const startTs = Math.floor(startDate);
    const nextTs = Math.floor(nextOccurrenceDate);
    const endTs = endDate ? Math.floor(endDate) : null;

    let pastOccurrences = 0;
    let iterDate = new Date(startTs * 1000);

    while (Math.floor(iterDate.getTime() / 1000) < nextTs) {
        pastOccurrences++;
        iterDate = addIntervalToDate(iterDate, repeatInterval, repeatUnit);

        if (pastOccurrences > 100000) break;
    }

    let totalOccurrences = null;
    if (endTs !== null) {
        totalOccurrences = 0;
        let countDate = new Date(startTs * 1000);
        const endDayStart = normalizeToLocalDayStart(endTs);
        while (normalizeToLocalDayStart(Math.floor(countDate.getTime() / 1000)) <= endDayStart) {
            totalOccurrences++;
            countDate = addIntervalToDate(countDate, repeatInterval, repeatUnit);
            if (totalOccurrences > 100000) break;
        }
    }

    return { pastOccurrences, totalOccurrences };
};

export const getAllPeriodicTransactions = async (db) => {
    if (!db) return [];
    try {
        const results = await db
            .select({
                id: periodicTransactions.id,
                amount: periodicTransactions.amount,
                title: periodicTransactions.title,
                repeatInterval: periodicTransactions.repeatInterval,
                repeatUnit: periodicTransactions.repeatUnit,
                startDate: periodicTransactions.startDate,
                nextOccurrenceDate: periodicTransactions.nextOccurrenceDate,
                endDate: periodicTransactions.endDate,
                notes: periodicTransactions.notes,
                categoryId: periodicTransactions.categoryId,
                categoryName: categories.name,
                categoryColor: categories.color,
                categoryIcon: categories.iconName,
                tags: sql`json_group_array(json_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color}))`.mapWith(String),
            })
            .from(periodicTransactions)
            .leftJoin(categories, eq(periodicTransactions.categoryId, categories.id))
            .leftJoin(periodicTransactionTags, eq(periodicTransactions.id, periodicTransactionTags.periodicTransactionId))
            .leftJoin(tags, eq(periodicTransactionTags.tagId, tags.id))
            .groupBy(periodicTransactions.id)
            .orderBy(desc(periodicTransactions.startDate));

        return results.map(row => {
            const occurrences = calculateOccurrences(row);
            return {
                ...row,
                tags: row.tags ? JSON.parse(row.tags).filter(t => t.id !== null) : [],
                ...occurrences,
            }
        });
    } catch (error) {
        console.error("[PeriodicTransactionService] Błąd podczas pobierania transakcji cyklicznych:", error);
        throw error;
    }
};

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
        const currentDayStart = normalizeToLocalDayStart(currentTimestamp);

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
                let nextOccurrence = periodicTransaction.nextOccurrenceDate;
                const maxIterations = 1000;
                let iterations = 0;

                const getNextOccurrenceDayStart = () => normalizeToLocalDayStart(nextOccurrence);
                const endDayStart = periodicTransaction.endDate ? normalizeToLocalDayStart(periodicTransaction.endDate) : null;

                //console.log(`[PeriodicTransactionService][DEBUG] Processing "${periodicTransaction.title}" start nextOcc=${new Date(periodicTransaction.nextOccurrenceDate * 1000).toLocaleString()} end=${periodicTransaction.endDate ? new Date(periodicTransaction.endDate * 1000).toLocaleString() : 'null'}`);

                while (
                    getNextOccurrenceDayStart() <= currentDayStart &&
                    iterations < maxIterations &&
                    (!endDayStart || getNextOccurrenceDayStart() <= endDayStart)
                ) {
                    iterations++;

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
