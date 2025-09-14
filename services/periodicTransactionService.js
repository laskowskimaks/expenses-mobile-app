import { periodicTransactions, transactions, categories, periodicTransactionTags, tags, transactionTags } from '@/database/schema';
import { eq, lte, sql, desc, and, not, inArray, gt, or } from 'drizzle-orm';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { eventEmitter } from '@/utils/eventEmitter';
import { getRandomColor } from './tagService';

const calculateNextOccurrence = (currentTimestamp, interval, unit) => {
    const currentDate = new Date(currentTimestamp * 1000);
    const nextDate = addIntervalToDate(currentDate, interval, unit);
    return Math.floor(nextDate.getTime() / 1000);
};

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

const normalizeToLocalDayStart = (timestampSec) => {
    const d = new Date(timestampSec * 1000);
    d.setHours(0, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
};

const normalizeToSameTime = (timestampSec, targetDayTimestamp) => {
    const originalDate = new Date(timestampSec * 1000);
    const targetDay = new Date(targetDayTimestamp * 1000);

    targetDay.setHours(
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds(),
        originalDate.getMilliseconds()
    );

    return Math.floor(targetDay.getTime() / 1000);
};

const calculateOccurrencesFromDB = async (db, periodicTransactionId, periodicTransaction) => {
    try {
        const currentDayStart = getCurrentTimestamp();
        const pastResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(transactions)
            .where(and(
                eq(transactions.periodicTransactionId, periodicTransactionId),
                sql`${transactions.transactionDate} <= ${currentDayStart}`
            ))
            .get();

        let totalOccurrences = null;
        if (periodicTransaction.endDate !== null) {
            totalOccurrences = 0;
            let countDate = new Date(periodicTransaction.startDate * 1000);
            countDate.setHours(0, 0, 0, 0);

            const endDateNormalized = new Date(periodicTransaction.endDate * 1000);
            endDateNormalized.setHours(0, 0, 0, 0);

            while (countDate <= endDateNormalized) {
                totalOccurrences++;
                countDate = addIntervalToDate(countDate, periodicTransaction.repeatInterval, periodicTransaction.repeatUnit);
                countDate.setHours(0, 0, 0, 0);
                if (totalOccurrences > 10000) break;
            }
        }

        return {
            pastOccurrences: parseInt(pastResult.count) || 0,
            totalOccurrences: totalOccurrences
        };
    } catch (error) {
        console.error('[calculateOccurrencesFromDB] Błąd:', error);
        return { pastOccurrences: 0, totalOccurrences: null };
    }
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
                tags: sql`json_group_array(json_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color}) ORDER BY lower(${tags.name}))`.mapWith(String),
            })
            .from(periodicTransactions)
            .leftJoin(categories, eq(periodicTransactions.categoryId, categories.id))
            .leftJoin(periodicTransactionTags, eq(periodicTransactions.id, periodicTransactionTags.periodicTransactionId))
            .leftJoin(tags, eq(periodicTransactionTags.tagId, tags.id))
            .groupBy(periodicTransactions.id)
            .orderBy(desc(periodicTransactions.startDate));

        const processedResults = [];
        for (const row of results) {
            const occurrences = await calculateOccurrencesFromDB(db, row.id, row);
            processedResults.push({
                ...row,
                tags: row.tags ? JSON.parse(row.tags).filter(t => t.id !== null) : [],
                ...occurrences,
            });
        }

        return processedResults;
    } catch (error) {
        console.error("[PeriodicTransactionService] Błąd podczas pobierania transakcji cyklicznych:", error);
        throw error;
    }
};

const _handleTags = async (dbTransaction, tagNames, periodicTransactionId) => {
    if (tagNames && tagNames.length > 0) {
        const tagIds = [];
        for (const tagName of tagNames) {
            const trimmedTagName = tagName.trim();
            if (!trimmedTagName) continue;

            let tag = await dbTransaction.select({ id: tags.id }).from(tags).where(eq(tags.name, trimmedTagName)).limit(1);
            let tagId = tag[0]?.id;

            if (!tagId) {
                const newTag = await dbTransaction.insert(tags).values({ name: trimmedTagName, color: getRandomColor() }).returning({ insertedId: tags.id });
                tagId = newTag[0].insertedId;
                eventEmitter.emit('tagAdded', { id: tagId, name: trimmedTagName });
            }
            tagIds.push(tagId);
        }
        if (tagIds.length > 0) {
            const tagsToInsert = tagIds.map(tagId => ({ periodicTransactionId, tagId }));
            await dbTransaction.insert(periodicTransactionTags).values(tagsToInsert);
        }
        return tagIds;
    }
    return [];
};

export const addPeriodicTransaction = async (dbOrDbTransaction, periodicTransactionData) => {
    if (!dbOrDbTransaction) {
        return { success: false, message: "Błąd bazy danych." };
    }
    try {
        const isDbTransaction = typeof dbOrDbTransaction.commit === 'function';

        const performTransaction = async (dbTransaction) => {
            const normalizedAmount = String(periodicTransactionData.amount || '0').replace(',', '.').replace(/[^0-9.]/g, '');
            let finalAmount = parseFloat(normalizedAmount);
            if (isNaN(finalAmount) || finalAmount <= 0) throw new Error('Kwota musi być liczbą większą od 0');
            if (periodicTransactionData.type === 'expenditure') finalAmount = -Math.abs(finalAmount);

            const startTimestamp = Math.floor(periodicTransactionData.startDate.getTime() / 1000);
            const endTimestamp = periodicTransactionData.endDate ? Math.floor(periodicTransactionData.endDate.getTime() / 1000) : null;
            const categoryId = periodicTransactionData.categoryId;

            if (!categoryId) throw new Error(`ID kategorii nie została przekazana.`);
            if (endTimestamp && endTimestamp <= startTimestamp) throw new Error('Data zakończenia musi być późniejsza niż data początku.');
            if (periodicTransactionData.repeatInterval < 1) throw new Error('Interwał powtarzania musi być większy od 0.');

            const newPeriodicTransaction = await dbTransaction.insert(periodicTransactions).values({
                amount: finalAmount,
                title: periodicTransactionData.title,
                repeatInterval: parseInt(periodicTransactionData.repeatInterval),
                repeatUnit: periodicTransactionData.repeatUnit,
                startDate: startTimestamp,
                nextOccurrenceDate: startTimestamp,
                endDate: endTimestamp,
                notes: periodicTransactionData.description || null,
                categoryId: categoryId,
            }).returning({ insertedId: periodicTransactions.id });

            const newPeriodicTransactionId = newPeriodicTransaction[0].insertedId;
            await _handleTags(dbTransaction, periodicTransactionData.tags, newPeriodicTransactionId);

            return { success: true, periodicTransactionId: newPeriodicTransactionId };
        };

        return isDbTransaction ? await performTransaction(dbOrDbTransaction) : await dbOrDbTransaction.transaction(performTransaction);
    } catch (error) {
        console.error("[PeriodicTransactionService] Błąd podczas dodawania transakcji cyklicznej:", error);
        return { success: false, message: error.message || "Wystąpił nieoczekiwany błąd." };
    }
};


export const processPeriodicTransactions = async (dbTransaction) => {
    try {
        const currentTimestamp = getCurrentTimestamp();
        const overduePeriodicTransactions = await dbTransaction
            .select()
            .from(periodicTransactions)
            .leftJoin(categories, eq(periodicTransactions.categoryId, categories.id))
            .where(lte(periodicTransactions.nextOccurrenceDate, currentTimestamp));

        if (overduePeriodicTransactions.length === 0) {
            return { success: true, addedCount: 0, addedTransactions: [], message: 'Brak zaległych transakcji okresowych' };
        }

        let addedTransactionsCount = 0;
        const addedTransactions = [];

        for (const { periodic_transactions: pt } of overduePeriodicTransactions) {
            try {
                let nextOccurrence = pt.nextOccurrenceDate;
                const maxIterations = 1000;
                let iterations = 0;
                const currentDayStart = normalizeToLocalDayStart(currentTimestamp);
                const endDayStart = pt.endDate ? normalizeToLocalDayStart(pt.endDate) : null;

                while (normalizeToLocalDayStart(nextOccurrence) <= currentDayStart && iterations < maxIterations) {
                    iterations++;
                    if (endDayStart && normalizeToLocalDayStart(nextOccurrence) > endDayStart) {
                        break;
                    }

                    const transactionTimestamp = normalizeToSameTime(pt.startDate, nextOccurrence);

                    const newTransactionData = {
                        amount: pt.amount,
                        title: pt.title,
                        transactionDate: transactionTimestamp,
                        notes: pt.notes,
                        categoryId: pt.categoryId,
                        periodicTransactionId: pt.id
                    };

                    const newTransaction = await dbTransaction.insert(transactions).values(newTransactionData).returning();
                    const newTransactionId = newTransaction[0].id;

                    const pTags = await dbTransaction.select({ tagId: periodicTransactionTags.tagId })
                        .from(periodicTransactionTags)
                        .where(eq(periodicTransactionTags.periodicTransactionId, pt.id));

                    if (pTags.length > 0) {
                        await dbTransaction.insert(transactionTags)
                            .values(pTags.map(t => ({ transactionId: newTransactionId, tagId: t.tagId })));
                    }

                    addedTransactions.push({ ...newTransactionData, id: newTransactionId });
                    addedTransactionsCount++;
                    nextOccurrence = calculateNextOccurrence(nextOccurrence, pt.repeatInterval, pt.repeatUnit);
                }

                await dbTransaction.update(periodicTransactions)
                    .set({ nextOccurrenceDate: nextOccurrence })
                    .where(eq(periodicTransactions.id, pt.id));

            } catch (error) {
                console.error(`[PeriodicTransactionService] Błąd przy przetwarzaniu transakcji "${pt.title}":`, error);
            }
        }

        return { success: true, addedCount: addedTransactionsCount, addedTransactions, message: `Dodano ${addedTransactionsCount} automatycznych transakcji` };
    } catch (error) {
        console.error('[PeriodicTransactionService] Błąd podczas przetwarzania transakcji okresowych:', error);
        return { success: false, addedCount: 0, addedTransactions: [], message: 'Błąd podczas przetwarzania transakcji okresowych: ' + error.message };
    }
};

export const getPeriodicTransactionById = async (db, id) => {
    if (!db || !id) return null;
    try {
        const result = await db.select().from(periodicTransactions).where(eq(periodicTransactions.id, id)).get();
        if (!result) return null;

        const tagsResult = await db.select({
            id: tags.id,
            name: tags.name,
            color: tags.color
        }).from(periodicTransactionTags)
            .innerJoin(tags, eq(periodicTransactionTags.tagId, tags.id))
            .where(eq(periodicTransactionTags.periodicTransactionId, id))
            .orderBy(sql`lower(${tags.name})`);

        return { ...result, tags: tagsResult };
    } catch (error) {
        console.error(`[PeriodicTransactionService] Błąd pobierania transakcji cyklicznej o ID ${id}:`, error);
        return null;
    }
};

export const getPeriodicTransactionDefinition = async (db, id) => {
    if (!db || !id) return null;
    return await db.select().from(periodicTransactions).where(eq(periodicTransactions.id, id)).get();
};

export const endPeriodicSeries = async (dbTransaction, pt, newSeriesStartDate, mode = 'future') => {
    let cutoffDate;

    if (mode === 'end_series') {
        cutoffDate = new Date(newSeriesStartDate);
        cutoffDate.setHours(23, 59, 59, 999);
    } else {
        cutoffDate = new Date(newSeriesStartDate);
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        cutoffDate.setHours(23, 59, 59, 999);
    }

    let lastValidOccurrence = null;
    let currentOccurrence = pt.startDate;
    let occurrenceCount = 0;
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

    while (currentOccurrence <= cutoffTimestamp && occurrenceCount < 10000) {
        lastValidOccurrence = currentOccurrence;
        occurrenceCount++;
        currentOccurrence = calculateNextOccurrence(currentOccurrence, pt.repeatInterval, pt.repeatUnit);
    }

    if (lastValidOccurrence === null || lastValidOccurrence < pt.startDate) {
        const allTransactions = await dbTransaction
            .select({ id: transactions.id })
            .from(transactions)
            .where(eq(transactions.periodicTransactionId, pt.id));

        const allTransactionIds = allTransactions.map(t => t.id);

        if (allTransactionIds.length > 0) {
            await dbTransaction.delete(transactionTags)
                .where(inArray(transactionTags.transactionId, allTransactionIds));
            console.log(`[endPeriodicSeries] Usunięto tagi ${allTransactionIds.length} transakcji przed usunięciem całej serii`);
        }

        await dbTransaction.delete(transactions).where(eq(transactions.periodicTransactionId, pt.id));
        await dbTransaction.delete(periodicTransactionTags).where(eq(periodicTransactionTags.periodicTransactionId, pt.id));
        await dbTransaction.delete(periodicTransactions).where(eq(periodicTransactions.id, pt.id));
        return null;
    } else {
        const futureTransactions = await dbTransaction
            .select({ id: transactions.id })
            .from(transactions)
            .where(and(
                eq(transactions.periodicTransactionId, pt.id),
                gt(transactions.transactionDate, lastValidOccurrence)
            ));

        const futureTransactionIds = futureTransactions.map(t => t.id);

        if (futureTransactionIds.length > 0) {
            await dbTransaction.delete(transactionTags)
                .where(inArray(transactionTags.transactionId, futureTransactionIds));
            console.log(`[endPeriodicSeries] Usunięto tagi ${futureTransactionIds.length} przyszłych transakcji`);
        }

        await dbTransaction.delete(transactions)
            .where(and(
                eq(transactions.periodicTransactionId, pt.id),
                gt(transactions.transactionDate, lastValidOccurrence)
            ));

        console.log(`[endPeriodicSeries] Ustawiam endDate na: ${new Date(lastValidOccurrence * 1000).toISOString()}`);
        await dbTransaction.update(periodicTransactions)
            .set({ endDate: lastValidOccurrence })
            .where(eq(periodicTransactions.id, pt.id));
        return lastValidOccurrence;
    }
};

export const updatePeriodicTransaction = async ({ db, id, data, mode = 'all' }) => {
    try {
        await db.transaction(async (dbTransaction) => {
            if (mode === 'all') {
                const startDateTimestamp = Math.floor(data.startDate.getTime() / 1000);
                const periodicData = {
                    title: data.title,
                    amount: data.type === 'expenditure' ? -Math.abs(parseFloat(data.amount)) : Math.abs(parseFloat(data.amount)),
                    notes: data.description,
                    categoryId: data.categoryId,
                    repeatInterval: parseInt(data.repeatInterval),
                    repeatUnit: data.repeatUnit,
                    startDate: startDateTimestamp,
                    endDate: data.endDate ? Math.floor(data.endDate.getTime() / 1000) : null,
                    nextOccurrenceDate: startDateTimestamp,
                };

                const oldTransactions = await dbTransaction
                    .select({ id: transactions.id })
                    .from(transactions)
                    .where(eq(transactions.periodicTransactionId, id));

                const oldTransactionIds = oldTransactions.map(t => t.id);

                if (oldTransactionIds.length > 0) {
                    await dbTransaction.delete(transactionTags)
                        .where(inArray(transactionTags.transactionId, oldTransactionIds));
                    console.log(`[updatePeriodicTransaction] Usunięto tagi ${oldTransactionIds.length} starych transakcji (tryb 'all')`);
                }

                await dbTransaction.delete(transactions).where(eq(transactions.periodicTransactionId, id));
                await dbTransaction.update(periodicTransactions).set(periodicData).where(eq(periodicTransactions.id, id));
                await dbTransaction.delete(periodicTransactionTags).where(eq(periodicTransactionTags.periodicTransactionId, id));
                await _handleTags(dbTransaction, data.tags, id);
                await processPeriodicTransactions(dbTransaction);

            } else if (mode === 'future') {
                const oldPt = await getPeriodicTransactionDefinition(dbTransaction, id);
                if (!oldPt) throw new Error("Nie znaleziono oryginalnej transakcji cyklicznej.");

                const newEndDate = await endPeriodicSeries(dbTransaction, oldPt, data.startDate);

                if (newEndDate !== null) {
                    const futureTransactions = await dbTransaction
                        .select({ id: transactions.id })
                        .from(transactions)
                        .where(and(
                            eq(transactions.periodicTransactionId, id),
                            gt(transactions.transactionDate, newEndDate)
                        ));

                    const futureTransactionIds = futureTransactions.map(t => t.id);

                    if (futureTransactionIds.length > 0) {
                        await dbTransaction.delete(transactionTags)
                            .where(inArray(transactionTags.transactionId, futureTransactionIds));
                        console.log(`[updatePeriodicTransaction] Usunięto tagi ${futureTransactionIds.length} przyszłych transakcji (tryb 'future')`);
                    }

                    await dbTransaction.delete(transactions)
                        .where(and(
                            eq(transactions.periodicTransactionId, id),
                            gt(transactions.transactionDate, newEndDate)
                        ));
                }

                await addPeriodicTransaction(dbTransaction, data);
                await processPeriodicTransactions(dbTransaction);
            }
        });
        eventEmitter.emit('periodicTransactionChanged');
        return { success: true };
    } catch (error) {
        console.error(`[PeriodicTransactionService] Błąd aktualizacji transakcji cyklicznej ${id}:`, error);
        return { success: false, message: error.message || "Wystąpił błąd." };
    }
};

export const deletePeriodicTransaction = async ({ db, periodicTransactionId, mode = 'delete_all' }) => {
    try {
        if (mode === 'end') {
            const pt = await getPeriodicTransactionDefinition(db, periodicTransactionId);
            if (!pt) throw new Error("Nie znaleziono transakcji cyklicznej.");

            await db.transaction(async (dbTransaction) => {
                const newEndDate = await endPeriodicSeries(dbTransaction, pt, new Date(), 'end_series');

                if (newEndDate !== null) {
                    const futureTransactions = await dbTransaction
                        .select({ id: transactions.id })
                        .from(transactions)
                        .where(and(
                            eq(transactions.periodicTransactionId, periodicTransactionId),
                            gt(transactions.transactionDate, newEndDate)
                        ));

                    const futureTransactionIds = futureTransactions.map(t => t.id);

                    if (futureTransactionIds.length > 0) {
                        await dbTransaction.delete(transactionTags)
                            .where(inArray(transactionTags.transactionId, futureTransactionIds));
                        console.log(`[deletePeriodicTransaction] Usunięto tagi ${futureTransactionIds.length} przyszłych transakcji`);
                    }

                    await dbTransaction.delete(transactions)
                        .where(and(
                            eq(transactions.periodicTransactionId, periodicTransactionId),
                            gt(transactions.transactionDate, newEndDate)
                        ));
                }
            });
        } else if (mode === 'delete_all') {
            if (!periodicTransactionId) {
                return { success: false, message: "Brak ID transakcji cyklicznej." };
            }

            await db.transaction(async (dbTransaction) => {
                console.log(`[deletePeriodicTransaction] Usuwanie transakcji cyklicznej ${periodicTransactionId} i wszystkich powiązań`);

                const relatedTransactions = await dbTransaction
                    .select({ id: transactions.id })
                    .from(transactions)
                    .where(eq(transactions.periodicTransactionId, periodicTransactionId));

                const transactionIds = relatedTransactions.map(t => t.id);
                console.log(`[deletePeriodicTransaction] Znaleziono ${transactionIds.length} powiązanych transakcji:`, transactionIds);

                if (transactionIds.length > 0) {
                    await dbTransaction.delete(transactionTags)
                        .where(inArray(transactionTags.transactionId, transactionIds));
                    console.log(`[deletePeriodicTransaction] Usunięto tagi ${transactionIds.length} transakcji`);
                }

                await dbTransaction.delete(periodicTransactionTags)
                    .where(eq(periodicTransactionTags.periodicTransactionId, periodicTransactionId));
                console.log(`[deletePeriodicTransaction] Usunięto tagi transakcji cyklicznej`);

                await dbTransaction.delete(transactions)
                    .where(eq(transactions.periodicTransactionId, periodicTransactionId));
                console.log(`[deletePeriodicTransaction] Usunięto ${transactionIds.length} transakcji`);

                await dbTransaction.delete(periodicTransactions)
                    .where(eq(periodicTransactions.id, periodicTransactionId));
                console.log(`[deletePeriodicTransaction] Usunięto transakcję cykliczną`);
            });
        }

        eventEmitter.emit('periodicTransactionChanged');
        return { success: true };
    } catch (error) {
        console.error(`[PeriodicTransactionService] Błąd usuwania transakcji cyklicznej ${periodicTransactionId}:`, error);
        return { success: false, message: error.message || "Wystąpił błąd." };
    }
};