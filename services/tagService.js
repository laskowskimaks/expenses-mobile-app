import { tags, transactionTags } from '@/database/schema';
import { eventEmitter } from '@/utils/eventEmitter';
import { eq } from 'drizzle-orm';

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

// Dodaj tag jeśli nie istnieje
export const ensureTagExists = async (db, tagName) => {
  try {
    const trimmedName = tagName.trim();
    if (!trimmedName) {
      throw new Error('Nazwa tagu nie może być pusta');
    }

    // Sprawdź czy tag już istnieje
    const existingTag = await db.select()
      .from(tags)
      .where(eq(tags.name, trimmedName))
      .limit(1);

    if (existingTag.length > 0) {
      console.log(`[TagService] Tag "${trimmedName}" już istnieje (ID: ${existingTag[0].id})`);
      return { tagId: existingTag[0].id, created: false };
    }

    // Dodaj nowy tag
    const newTag = await db.insert(tags).values({
      name: trimmedName
    }).returning();

    console.log(`[TagService] Utworzono nowy tag "${trimmedName}" (ID: ${newTag[0].id})`);
    return { tagId: newTag[0].id, created: true };

  } catch (error) {
    console.error('[TagService] Błąd podczas tworzenia tagu:', error);
    throw error;
  }
};

// Przetwórz wszystkie tagi dla transakcji
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
      // Tag nie istnieje - dodaj nowy do tabeli tags
      const newTag = await db.insert(tags).values({
        name: trimmedTagName
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