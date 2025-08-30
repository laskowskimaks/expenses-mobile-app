import { loyaltyCards } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { eventEmitter } from '@/utils/eventEmitter';

export const getAllLoyaltyCards = async (db) => {
  if (!db) return [];
  try {
    const cards = await db.select().from(loyaltyCards).orderBy(loyaltyCards.name);
    return cards;
  } catch (error) {
    console.error('[LoyaltyCardService] Błąd podczas pobierania kart:', error);
    return [];
  }
};

export const getLoyaltyCardById = async (db, cardId) => {
    if (!db || !cardId) return null;
    try {
        const result = await db.select().from(loyaltyCards).where(eq(loyaltyCards.id, cardId)).limit(1);
        return result[0] || null;
    } catch (error) {
        console.error(`[LoyaltyCardService] Błąd podczas pobierania karty o ID ${cardId}:`, error);
        return null;
    }
};

export const addLoyaltyCard = async (db, cardData) => {
  if (!db) return { success: false, message: 'Błąd bazy danych.' };
  try {
    const result = await db.insert(loyaltyCards).values({
      name: cardData.name.trim(),
      notes: cardData.notes?.trim(),
      barcodeData: cardData.barcodeData,
      barcodeFormat: cardData.barcodeFormat,
      imageUri: cardData.imageUri,
    }).returning({ insertedId: loyaltyCards.id });
    
    const newCardId = result[0]?.insertedId;
    eventEmitter.emit('loyaltyCardsChanged');
    return { success: true, cardId: newCardId };
  } catch (error) {
    console.error('[LoyaltyCardService] Błąd podczas dodawania karty:', error);
    return { success: false, message: 'Nie udało się dodać karty.' };
  }
};

export const updateLoyaltyCard = async (db, cardId, cardData) => {
    if (!db || !cardId) return { success: false, message: 'Brak danych.' };
    try {
        await db.update(loyaltyCards).set({
            name: cardData.name.trim(),
            notes: cardData.notes?.trim(),
            barcodeData: cardData.barcodeData,
            barcodeFormat: cardData.barcodeFormat,
            imageUri: cardData.imageUri,
        }).where(eq(loyaltyCards.id, cardId));

        eventEmitter.emit('loyaltyCardsChanged');
        return { success: true };
    } catch (error) {
        console.error(`[LoyaltyCardService] Błąd podczas aktualizacji karty o ID ${cardId}:`, error);
        return { success: false, message: 'Nie udało się zaktualizować karty.' };
    }
};

export const deleteLoyaltyCard = async (db, cardId) => {
  if (!db || !cardId) return { success: false, message: 'Brak ID karty.' };
  try {
    await db.delete(loyaltyCards).where(eq(loyaltyCards.id, cardId));
    eventEmitter.emit('loyaltyCardsChanged');
    return { success: true };
  } catch (error) {
    console.error(`[LoyaltyCardService] Błąd podczas usuwania karty o ID ${cardId}:`, error);
    return { success: false, message: 'Nie udało się usunąć karty.' };
  }
};