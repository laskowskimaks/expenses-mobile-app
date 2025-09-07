import { tags, transactionTags } from '@/database/schema';
import { eventEmitter } from '@/utils/eventEmitter';
import { eq, and, sql, not, count } from 'drizzle-orm';

export const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84dc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b22f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

export const getRandomColor = () => {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
};

export const getAllTags = async (db) => {
  try {
    const allTags = await db.select().from(tags).orderBy(sql`lower(${tags.name})`);
    return allTags;
  } catch (error) {
    console.error('[TagService] Błąd podczas pobierania tagów:', error);
    return [];
  }
};

export const getAllTagsWithCount = async (db) => {
    if (!db) return [];
    try {
        const result = await db
            .select({
                id: tags.id,
                name: tags.name,
                color: tags.color,
                transactionCount: count(transactionTags.transactionId),
            })
            .from(tags)
            .leftJoin(transactionTags, eq(tags.id, transactionTags.tagId))
            .groupBy(tags.id, tags.name, tags.color)
            .orderBy(sql`lower(${tags.name})`);
        
        return result;
    } catch (error) {
        console.error("[tagService] Błąd podczas pobierania tagów z licznikiem:", error);
        throw error;
    }
};

export const addTag = async (db, tagData) => {
    if (!db) return { success: false, message: 'Brak połączenia z bazą.' };
    try {
        const existing = await db.select().from(tags).where(sql`lower(${tags.name}) = ${tagData.name.trim().toLowerCase()}`).get();
        if (existing) {
            return { success: false, message: 'Tag o tej nazwie już istnieje.' };
        }
        await db.insert(tags).values({
            name: tagData.name.trim(),
            color: tagData.color,
        });
        eventEmitter.emit('tagsChanged');
        return { success: true };
    } catch (error) {
        console.error("[tagService] Błąd podczas dodawania taga:", error);
        return { success: false, message: 'Wystąpił nieoczekiwany błąd.' };
    }
};

export const updateTag = async (db, id, tagData) => {
    if (!db) return { success: false, message: 'Brak połączenia z bazą.' };
    try {
        const existing = await db.select().from(tags).where(and(
            sql`lower(${tags.name}) = ${tagData.name.trim().toLowerCase()}`,
            not(eq(tags.id, id))
        )).get();

        if (existing) {
            return { success: false, message: 'Tag o tej nazwie już istnieje.' };
        }
        await db.update(tags).set({
            name: tagData.name.trim(),
            color: tagData.color,
        }).where(eq(tags.id, id));
        eventEmitter.emit('tagsChanged');
        return { success: true };
    } catch (error) {
        console.error(`[tagService] Błąd podczas aktualizacji taga ${id}:`, error);
        return { success: false, message: 'Wystąpił nieoczekiwany błąd.' };
    }
};

export const deleteTag = async (db, id) => {
    if (!db) return { success: false, message: 'Brak połączenia z bazą.' };
    try {
        await db.delete(tags).where(eq(tags.id, id));
        eventEmitter.emit('tagsChanged');
        return { success: true };
    } catch (error) {
        console.error(`[tagService] Błąd podczas usuwania taga ${id}:`, error);
        return { success: false, message: 'Wystąpił nieoczekiwany błąd.' };
    }
};

export const processTransactionTags = async (db, transactionId, tagNames) => {
  if (!tagNames || tagNames.length === 0) return [];

  const tagIds = [];

  for (const tagName of tagNames) {
    const trimmedTagName = tagName.trim();
    if (!trimmedTagName) continue;

    const existingTag = await db.select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, trimmedTagName))
      .limit(1);

    let tagId;

    if (existingTag.length > 0) {
      tagId = existingTag[0].id;
    } else {
      const newTag = await db.insert(tags).values({
        name: trimmedTagName,
        color: getRandomColor(),
      }).returning({ insertedId: tags.id });
      tagId = newTag[0].insertedId;
      eventEmitter.emit('tagsChanged');
    }
    tagIds.push(tagId);
  }

  const tagsToInsert = tagIds.map(tagId => ({
    transactionId: transactionId,
    tagId: tagId,
  }));

  await db.insert(transactionTags).values(tagsToInsert);
  return tagIds;
};