import { categories } from '../database/schema';

export const getAllCategories = async (db) => {
  if (!db) {
    console.error("[categoryService] Instancja bazy danych nie została przekazana.");
    return [];
  }

  try {
    console.log("[categoryService] Pobieranie wszystkich kategorii...");

    const allCategories = await db.select().from(categories);

    console.log(`[categoryService] Pomyślnie pobrano ${allCategories.length} kategorii.`);
    return allCategories;
  } catch (error) {
    console.error("[categoryService] Błąd podczas pobierania kategorii:", error);
    throw error;
  }
};