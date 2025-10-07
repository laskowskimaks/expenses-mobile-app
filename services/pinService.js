import { generateSalt, hashData } from '../utils/hashUtils';
import { upsertSetting, deleteSetting, _getSetting } from './settingService';

export const getHashedPin = (db) => _getSetting(db, 'pin');
export const getPinSalt = (db) => _getSetting(db, 'pinSalt');

export const verifyPin = async (db, plainPin) => {
  try {
    const storedHashedPin = await getHashedPin(db);
    const storedPinSalt = await getPinSalt(db);
    if (!storedHashedPin || !storedPinSalt) return false;

    const hashedInputPin = await hashData(plainPin, storedPinSalt);
    return hashedInputPin === storedHashedPin;
  } catch (error) {
    console.error('[pinService:verifyPin] Błąd podczas weryfikacji PINu:', error);
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
    console.error('[pinService:savePin] Błąd podczas zapisu PINu:', error);
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
    console.error('[pinService:removePin] Błąd podczas usuwania PINu:', error);
    return false;
  }
};