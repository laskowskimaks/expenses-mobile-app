import { periodicTransactions, transactions, categories, periodicTransactionTags, tags, transactionTags } from '@/database/schema';
import { eq, lte } from 'drizzle-orm';
import { getCurrentTimestamp } from '@/utils/dateUtils';

export const addPeriodicTransaction = async (db, periodicTransactionData) => {
    if (!db) {
        console.error("[PeriodicTransactionService] Instancja bazy danych nie została przekazana.");
        return { success: false, message: "Błąd bazy danych." };
    }

    try {
        const result = await db.transaction(async (tx) => {
            const normalizedAmount = String(periodicTransactionData.amount || '0')
                .replace(',', '.')
                .replace(/[^0-9.]/g, '');

            let finalAmount = parseFloat(normalizedAmount);

            // Walidacja czy to prawidłowa liczba
            if (isNaN(finalAmount) || finalAmount <= 0) {
                throw new Error('Kwota musi być liczbą większą od 0');
            }

            if (periodicTransactionData.type === 'expenditure') {
                finalAmount = -Math.abs(finalAmount);
            }

            // Konwersja dat na timestampy (sekundy)
            const startTimestamp = Math.floor(periodicTransactionData.startDate.getTime() / 1000);
            const endTimestamp = periodicTransactionData.endDate
                ? Math.floor(periodicTransactionData.endDate.getTime() / 1000)
                : null;

            const categoryId = periodicTransactionData.categoryId;
            if (!categoryId) {
                throw new Error(`ID kategorii nie zostało przekazane.`);
            }

            // Walidacja dat
            if (endTimestamp && endTimestamp <= startTimestamp) {
                throw new Error('Data zakończenia musi być późniejsza niż data początku.');
            }

            // Walidacja interwału
            if (periodicTransactionData.repeatInterval < 1) {
                throw new Error('Interwał powtarzania musi być większy od 0.');
            }

            // Dodaj transakcję cykliczną
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

            // Obsługa tagów dla transakcji cyklicznej
            if (periodicTransactionData.tags && periodicTransactionData.tags.length > 0) {
                console.log(`[PeriodicTransactionService] Przetwarzanie ${periodicTransactionData.tags.length} tagów...`);

                const tagIds = [];

                for (const tagName of periodicTransactionData.tags) {
                    const trimmedTagName = tagName.trim();
                    if (!trimmedTagName) continue;

                    // Sprawdź czy tag już istnieje w bazie
                    const existingTag = await tx.select({ id: tags.id })
                        .from(tags)
                        .where(eq(tags.name, trimmedTagName))
                        .limit(1);

                    let tagId;

                    if (existingTag.length > 0) {
                        tagId = existingTag[0].id;
                        console.log(`[PeriodicTransactionService] Znaleziono istniejący tag "${trimmedTagName}" (ID: ${tagId})`);
                    } else {
                        const newTag = await tx.insert(tags).values({
                            name: trimmedTagName
                        }).returning({ insertedId: tags.id });

                        tagId = newTag[0].insertedId;
                        console.log(`[PeriodicTransactionService] Utworzono nowy tag "${trimmedTagName}" (ID: ${tagId})`);
                    }

                    tagIds.push(tagId);
                }

                // Dodaj powiązania transakcja-cykliczna-tag
                if (tagIds.length > 0) {
                    const tagsToInsert = tagIds.map(tagId => ({
                        periodicTransactionId: newPeriodicTransactionId,
                        tagId: tagId,
                    }));

                    try {
                        await tx.insert(periodicTransactionTags).values(tagsToInsert);
                        console.log(`[PeriodicTransactionService] Dodano ${tagsToInsert.length} powiązań transakcja-cykliczna-tag`);
                    } catch (tagError) {
                        console.error(`[PeriodicTransactionService] Błąd przy dodawaniu tagów:`, tagError);
                    }
                }
            }
            return { success: true, periodicTransactionId: newPeriodicTransactionId };
        });

        console.log(`[PeriodicTransactionService] Pomyślnie dodano transakcję cykliczną o ID: ${result.periodicTransactionId}`);
        return result;

    } catch (error) {
        console.error("[PeriodicTransactionService] Błąd podczas dodawania transakcji cyklicznej:", error);
        return { success: false, message: error.message || "Wystąpił nieoczekiwany błąd." };
    }
};

// Sprawdzanie i dodawanie zaległych transakcji okresowych
export const processPeriodicTransactions = async (db) => {
    try {
        console.log('[PeriodicTransactionService] Rozpoczynam sprawdzanie transakcji okresowych...');
        const currentTimestamp = getCurrentTimestamp();

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

                    // Sprawdź czy nie przekroczono daty końcowej
                    if (periodicTransaction.endDate && nextOccurrence > periodicTransaction.endDate) {
                        console.log(`[PeriodicTransactionService] Osiągnięto datę końcową dla "${periodicTransaction.title}"`);
                        break;
                    }

                    // Utwórz transakcję dla tej daty
                    const newTransactionData = {
                        amount: periodicTransaction.amount,
                        title: periodicTransaction.title,
                        transactionDate: nextOccurrence,
                        notes: periodicTransaction.notes
                            ? `${periodicTransaction.notes}\n(transakcja dodana automatycznie)`
                            : `(transakcja dodana automatycznie)`,
                        location: null,
                        categoryId: periodicTransaction.categoryId
                    };

                    const insertResult = await db
                        .insert(transactions)
                        .values(newTransactionData)
                        .returning();

                    const newTransactionId = insertResult[0].id;

                    // Skopiuj tagi z szablonu cyklicznego do zwykłej transakcji
                    const periodicTags = await db
                        .select({
                            tagId: periodicTransactionTags.tagId,
                            tagName: tags.name
                        })
                        .from(periodicTransactionTags)
                        .innerJoin(tags, eq(periodicTransactionTags.tagId, tags.id))
                        .where(eq(periodicTransactionTags.periodicTransactionId, periodicTransaction.id));

                    // Dodaj tagi do wygenerowanej zwykłej transakcji
                    if (periodicTags.length > 0) {
                        const tagsToInsert = periodicTags.map(tag => ({
                            transactionId: newTransactionId,
                            tagId: tag.tagId,
                        }));

                        await db.insert(transactionTags).values(tagsToInsert);
                    }

                    addedTransactions.push({
                        ...newTransactionData,
                        id: newTransactionId,
                        categoryName: periodicTransaction.categoryName,
                        tags: periodicTags.map(tag => ({ id: tag.tagId, name: tag.tagName }))
                    });

                    addedTransactionsCount++;
                    transactionsAddedForThisTemplate++;

                    console.log(`[PeriodicTransactionService] Dodano "${periodicTransaction.title}" dla daty ${new Date(nextOccurrence * 1000).toLocaleDateString('pl-PL')}`);

                    // Oblicz następną datę wystąpienia
                    nextOccurrence = calculateNextOccurrence(
                        nextOccurrence,
                        periodicTransaction.repeatInterval,
                        periodicTransaction.repeatUnit
                    );
                }

                if (iterations >= maxIterations) {
                    console.warn(`[PeriodicTransactionService] Osiągnięto maksymalną liczbę iteracji (${maxIterations}) dla "${periodicTransaction.title}"`);
                }

                // Zaktualizuj szablon z ostatnią obliczoną datą
                await db.update(periodicTransactions)
                    .set({ nextOccurrenceDate: nextOccurrence })
                    .where(eq(periodicTransactions.id, periodicTransaction.id));

                console.log(`[PeriodicTransactionService] Dodano ${transactionsAddedForThisTemplate} transakcji dla szablonu "${periodicTransaction.title}"`);
                console.log(`[PeriodicTransactionService] Następne wystąpienie: ${new Date(nextOccurrence * 1000).toLocaleDateString('pl-PL')}`);

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