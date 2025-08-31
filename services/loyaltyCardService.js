import { loyaltyCards } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { eventEmitter } from '@/utils/eventEmitter';
import * as FileSystem from 'expo-file-system';

const IMAGES_DIR = FileSystem.documentDirectory + 'loyalty_card_images/';

const ensureImagesDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    console.log('[LoyaltyCardService] Tworzenie katalogu na obrazy kart...');
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
};

const saveImagePermanently = async (tempUri) => {
  if (!tempUri || !tempUri.startsWith('file://')) return null;
  await ensureImagesDirectoryExists();
  const filename = `card_${Date.now()}.jpg`;
  const permanentUri = IMAGES_DIR + filename;
  try {
    await FileSystem.copyAsync({
      from: tempUri,
      to: permanentUri,
    });
    return permanentUri;
  } catch (error) {
    console.error('[LoyaltyCardService] Błąd podczas zapisywania obrazu:', error);
    return null;
  }
};

const deleteImageFile = async (uri) => {
  if (uri && uri.startsWith('file://')) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (error) {
      console.error(`[LoyaltyCardService] Błąd podczas usuwania pliku obrazu ${uri}:`, error);
    }
  }
};

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
    let permanentImageUri = null;
    if (cardData.imageUri) {
      permanentImageUri = await saveImagePermanently(cardData.imageUri);
      if (!permanentImageUri) {
        return { success: false, message: 'Nie udało się zapisać zdjęcia karty.' };
      }
    }

    const result = await db.insert(loyaltyCards).values({
      name: cardData.name.trim(),
      notes: cardData.notes?.trim(),
      barcodeData: cardData.barcodeData,
      barcodeFormat: cardData.barcodeFormat,
      imageUri: permanentImageUri,
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
        const oldCard = await getLoyaltyCardById(db, cardId);
        let permanentImageUri = oldCard.imageUri;

        // Jeśli URI obrazu się zmieniło, zapisz nowy i usuń stary
        if (cardData.imageUri && cardData.imageUri !== oldCard.imageUri) {
            permanentImageUri = await saveImagePermanently(cardData.imageUri);
             if (!permanentImageUri) {
                return { success: false, message: 'Nie udało się zapisać nowego zdjęcia karty.' };
            }
            await deleteImageFile(oldCard.imageUri);
        }

        await db.update(loyaltyCards).set({
            name: cardData.name.trim(),
            notes: cardData.notes?.trim(),
            barcodeData: cardData.barcodeData,
            barcodeFormat: cardData.barcodeFormat,
            imageUri: permanentImageUri,
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
    const cardToDelete = await getLoyaltyCardById(db, cardId);
    if (cardToDelete && cardToDelete.imageUri) {
      await deleteImageFile(cardToDelete.imageUri);
    }

    await db.delete(loyaltyCards).where(eq(loyaltyCards.id, cardId));
    eventEmitter.emit('loyaltyCardsChanged');
    return { success: true };
  } catch (error) {
    console.error(`[LoyaltyCardService] Błąd podczas usuwania karty o ID ${cardId}:`, error);
    return { success: false, message: 'Nie udało się usunąć karty.' };
  }
};