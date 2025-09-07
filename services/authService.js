import { settings } from "@/database/schema";
import { eq } from 'drizzle-orm';
import { generateSalt, hashData } from '../utils/hashUtils';

export const upsertSetting = async (db, key, value) => {
  try {
    await db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
      .execute();
  } catch (error) {
    console.error(`[authService:upsertSetting] Błąd podczas zapisu '${key}':`, error);
    throw error;
  }
};

export const deleteSetting = async (db, key) => {
  try {
    await db.delete(settings).where(eq(settings.key, key)).execute();
  } catch (error) {
    console.error(`[authService:deleteSetting] Błąd podczas usuwania klucza '${key}':`, error);
    throw error;
  }
};


const _getSetting = async (db, key) => {
  try {
    const result = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).get();
    return result ? result.value : null;
  } catch (error) {
    console.error(`[authService:_getSetting] Błąd podczas pobierania klucza '${key}':`, error);
    return null;
  }
};

export const getUserEmail = (db) => _getSetting(db, 'email');
export const getHashedPin = (db) => _getSetting(db, 'pin');
export const getPinSalt = (db) => _getSetting(db, 'pinSalt');
export const getHashedPassword = (db) => _getSetting(db, 'password');
export const getPasswordSalt = (db) => _getSetting(db, 'passwordSalt');
export const getPaymentDay = (db) => _getSetting(db, 'billing_period_start_day');
export const getSavingsGoal = (db) => _getSetting(db, 'savings_goal');

export const verifyPin = async (db, plainPin) => {
  try {
    const storedHashedPin = await getHashedPin(db);
    const storedPinSalt = await getPinSalt(db);
    if (!storedHashedPin || !storedPinSalt) return false;

    const hashedInputPin = await hashData(plainPin, storedPinSalt);
    return hashedInputPin === storedHashedPin;
  } catch (error) {
    console.error('[authService:verifyPin] Błąd podczas weryfikacji PINu:', error);
    return false;
  }
};

export const savePin = async (db, plainPin) => {
  try {
    const pinSalt = generateSalt();
    const hashedPin = await hashData(plainPin, pinSalt);
    await upsertSetting(db, 'pin', hashedPin);
    await upsertSetting(db, 'pinSalt', pinSalt);
    return true;
  } catch (error) {
    console.error('[authService:savePin] Błąd podczas zapisu PINu:', error);
    return false;
  }
};

export const removePin = async (db) => {
  try {
    await Promise.all([
      deleteSetting(db, 'pin'),
      deleteSetting(db, 'pinSalt')
    ]);
    return true;
  } catch (error) {
    console.error('[authService:removePin] Błąd podczas usuwania PINu:', error);
    return false;
  }
};

export const updateLocalEmail = async (db, newEmail) => {
  try {
    await upsertSetting(db, 'email', newEmail);
    console.log(`[authService:updateLocalEmail] Pomyślnie zaktualizowano lokalny email na: ${newEmail}`);
    return true;
  } catch (error) {
    console.error('[authService:updateLocalEmail] Błąd podczas aktualizacji lokalnego emaila:', error);
    return false;
  }
};

export const getAllSettingsAsObject = async (db) => {
  try {
    const allSettings = await db.select().from(settings).all();
    if (!allSettings || allSettings.length === 0) {
      return null;
    }
    return allSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  } catch (error) {
    console.error('[authService:getAllSettingsAsObject] Błąd podczas pobierania wszystkich ustawień:', error);
    return null;
  }
};

export const createUser = async (db, userId, email, plainPassword) => {
  try {
    const passwordSalt = generateSalt();
    const hashedPassword = await hashData(plainPassword, passwordSalt);

    return {
      success: true,
      data: {
        userId,
        email,
        hashedPassword,
        passwordSalt,
      },
    };
  } catch (error) {
    console.error('[authService] Przygotowanie danych użytkownika nie powiodło się:', error);
    return { success: false, error };
  }
};