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

export const getAllSettingsAsObject = async (db) => {
  try {
    const allSettings = await db.select().from(settings).all();
    if (!allSettings || allSettings.length === 0) {
      return null;
    }
    // Transformacja tablicy klucz-wartość w jeden obiekt
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

    const initialSettings = [
      { key: 'userId', value: userId },
      { key: 'email', value: email },
      { key: 'password', value: hashedPassword },
      { key: 'passwordSalt', value: passwordSalt },

      { key: 'billing_period_start_day', value: '10' },
      { key: 'savings_goal', value: '0' },

      { key: 'pin', value: '' },
      { key: 'pinSalt', value: '' },
    ];

    await db.transaction(async (tx) => {
      for (const setting of initialSettings) {
        await upsertSetting(tx, setting.key, setting.value);
      }
    });

    console.log('[authService] Użytkownik utworzony:', email);
    return true;
  } catch (error) {
    console.error('[authService] Tworzenie użytkownika nie powiodło się:', error);

    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('[authService] email już zarejestrowany:', email);
      alert('Nazwa użytkownika już zajęta');
    } else {
      console.log('[authService] Błąd podczas tworzenia użytkownika:', error);
      alert('Wystąpił błąd podczas rejestracji.');
    }
    return false;
  }
};
