import { tags, transactionTags } from '@/database/schema';
import { eventEmitter } from '@/utils/eventEmitter';
import { eq } from 'drizzle-orm';

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84dc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b22f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

export const getRandomColor = () => {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
};

export const getAllTags = async (db) => {
  try {
    console.log('[TagService] Pobieranie wszystkich tagów...');
    const allTags = await db.select().from(tags).orderBy(tags.name);
    console.log(`[TagService] Pobrano ${allTags.length} tagów`);
    return allTags;
  } catch (error) {
    console.error('[TagService] Błąd podczas pobierania tagów:', error);
    return [];
  }
};

// wszystkie tagi dla transakcji
export const processTransactionTags = async (db, transactionId, tagNames) => {
  if (!tagNames || tagNames.length === 0) return [];

  const tagIds = [];

  for (const tagName of tagNames) {
    const trimmedTagName = tagName.trim();
    if (!trimmedTagName) continue;

    // Sprawdź czy tag już istnieje w bazie
    const existingTag = await db.select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, trimmedTagName))
      .limit(1);

    let tagId;

    if (existingTag.length > 0) {
      // Tag istnieje - użyj jego ID
      tagId = existingTag[0].id;
      console.log(`[TagService] Znaleziono istniejący tag "${trimmedTagName}" (ID: ${tagId})`);
    } else {
      // Tag nie istnieje - dodaj nowy do tabeli tags wraz z kolorem
      const newTag = await db.insert(tags).values({
        name: trimmedTagName,
        color: getRandomColor(),
      }).returning({ insertedId: tags.id });

      tagId = newTag[0].insertedId;
      console.log(`[TagService] Utworzono nowy tag "${trimmedTagName}" (ID: ${tagId})`);
      try {
        eventEmitter.emit('tagAdded', { id: tagId, name: trimmedTagName });
      } catch (e) {
        console.error('[TagService] Błąd podczas emitowania zdarzenia tagAdded:', e);
      }
    }

    tagIds.push(tagId);
  }

  // Dodaj powiązania transakcja-tag do tabeli transaction_tags
  if (tagIds.length > 0) {
    const tagsToInsert = tagIds.map(tagId => ({
      transactionId: transactionId,
      tagId: tagId,
    }));

    await db.insert(transactionTags).values(tagsToInsert);
    console.log(`[TagService] Dodano ${tagsToInsert.length} powiązań transakcja-tag`);
  }

  return tagIds;
};
