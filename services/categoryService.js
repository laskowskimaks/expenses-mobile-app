import { categories, transactions } from '../database/schema';
import { eq, and, sql, not } from 'drizzle-orm';

export const getAllCategories = async (db) => {
  if (!db) {
    console.error("[categoryService] Instancja bazy danych nie została przekazana.");
    return [];
  }
  try {
    const allCategories = await db.select().from(categories).orderBy(sql`lower(${categories.name})`);
    return allCategories;
  } catch (error) {
    console.error("[categoryService] Błąd podczas pobierania kategorii:", error);
    throw error;
  }
};

export const addCategory = async (db, categoryData) => {
  if (!db) return { success: false, message: 'Brak połączenia z bazą.' };
  try {
    const existing = await db.select().from(categories).where(sql`lower(${categories.name}) = ${categoryData.name.trim().toLowerCase()}`).get();
    if (existing) {
      return { success: false, message: 'Kategoria o tej nazwie już istnieje.' };
    }

    await db.insert(categories).values({
      name: categoryData.name.trim(),
      color: categoryData.color,
      iconName: categoryData.iconName,
      isDeletable: true,
    });
    return { success: true };
  } catch (error) {
    console.error("[categoryService] Błąd podczas dodawania kategorii:", error);
    return { success: false, message: 'Wystąpił nieoczekiwany błąd.' };
  }
};

export const updateCategory = async (db, id, categoryData) => {
  if (!db) return { success: false, message: 'Brak połączenia z bazą.' };
  try {
    const categoryToUpdate = await db.select().from(categories).where(eq(categories.id, id)).get();

    const updateData = { color: categoryData.color };
    if (categoryToUpdate.isDeletable) {
      const existing = await db.select().from(categories).where(and(
        sql`lower(${categories.name}) = ${categoryData.name.trim().toLowerCase()}`,
        not(eq(categories.id, id))
      )).get();

      if (existing) {
        return { success: false, message: 'Kategoria o tej nazwie już istnieje.' };
      }
      updateData.name = categoryData.name.trim();
      updateData.iconName = categoryData.iconName;
    }
    
    await db.update(categories).set(updateData).where(eq(categories.id, id));
    return { success: true };
  } catch (error) {
    console.error(`[categoryService] Błąd podczas aktualizacji kategorii ${id}:`, error);
    return { success: false, message: 'Wystąpił nieoczekiwany błąd.' };
  }
};

export const deleteCategory = async (db, id) => {
  if (!db) return { success: false, message: 'Brak połączenia z bazą.' };
  try {
    await db.transaction(async (tx) => {
      const categoryToDelete = await tx.select().from(categories).where(eq(categories.id, id)).get();
      if (!categoryToDelete) {
        throw new Error('Kategoria nie została znaleziona.');
      }
      if (!categoryToDelete.isDeletable) {
        throw new Error('Tej kategorii nie można usunąć.');
      }
      
      const otherCategory = await tx.select().from(categories).where(eq(categories.name, 'Inne')).get();
      if (!otherCategory) {
        throw new Error('Nie znaleziono domyślnej kategorii "Inne".');
      }

      await tx.update(transactions)
        .set({ categoryId: otherCategory.id })
        .where(eq(transactions.categoryId, id));
      
      await tx.delete(categories).where(eq(categories.id, id));
    });
    return { success: true };
  } catch (error) {
    console.error(`[categoryService] Błąd podczas usuwania kategorii ${id}:`, error);
    return { success: false, message: error.message || 'Wystąpił nieoczekiwany błąd.' };
  }
};