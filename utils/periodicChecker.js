import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadBackupIfOlderThan } from '@/services/backupService';

const LAST_CHECK_KEY = 'lastPeriodicTransactionCheck';
const LAST_BACKUP_CHECK_KEY = 'lastBackupCheck';
const CHECK_INTERVAL_HOURS = 6;
const BACKUP_CHECK_INTERVAL_HOURS = 24;

export const shouldCheckPeriodicTransactions = async () => {
  try {
    console.log('[PeriodicChecker] Sprawdzanie czy należy wykonać sprawdzenie transakcji okresowych...');

    const lastCheckStr = await AsyncStorage.getItem(LAST_CHECK_KEY);
    const lastCheckTimestamp = lastCheckStr ? parseInt(lastCheckStr) : 0;
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const intervalSeconds = CHECK_INTERVAL_HOURS * 60 * 60;
    const timeSinceLastCheck = currentTimestamp - lastCheckTimestamp;

    console.log(`[PeriodicChecker] Ostatnie sprawdzenie: ${lastCheckTimestamp > 0 ? new Date(lastCheckTimestamp * 1000).toISOString() : 'nigdy'}`);
    console.log(`[PeriodicChecker] Czas od ostatniego sprawdzenia: ${Math.floor(timeSinceLastCheck / 60)} minut`);
    console.log(`[PeriodicChecker] Próg: ${CHECK_INTERVAL_HOURS} godzin (${intervalSeconds} sekund)`);

    const shouldCheck = timeSinceLastCheck > intervalSeconds;
    console.log(`[PeriodicChecker] Czy sprawdzać? ${shouldCheck ? 'TAK' : 'NIE'}`);

    return shouldCheck;

  } catch (error) {
    console.error('[PeriodicChecker] Błąd podczas sprawdzania czasu:', error);
    return true;
  }
};

export const markPeriodicCheckCompleted = async () => {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000).toString();
    await AsyncStorage.setItem(LAST_CHECK_KEY, currentTimestamp);

    console.log(`[PeriodicChecker] Zapisano czas ostatniego sprawdzenia: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('[PeriodicChecker] Błąd podczas zapisywania czasu sprawdzenia:', error);
  }
};

export const resetPeriodicCheckTime = async () => {
  try {
    await AsyncStorage.removeItem(LAST_CHECK_KEY);
    console.log('[PeriodicChecker] Zresetowano czas ostatniego sprawdzenia');
  } catch (error) {
    console.error('[PeriodicChecker] Błąd podczas resetowania czasu:', error);
  }
};

export const getLastCheckInfo = async () => {
  try {
    const lastCheckStr = await AsyncStorage.getItem(LAST_CHECK_KEY);
    const lastCheckTimestamp = lastCheckStr ? parseInt(lastCheckStr) : 0;

    return {
      timestamp: lastCheckTimestamp,
      date: lastCheckTimestamp > 0 ? new Date(lastCheckTimestamp * 1000) : null,
      minutesAgo: lastCheckTimestamp > 0 ? Math.floor((Date.now() / 1000 - lastCheckTimestamp) / 60) : null
    };
  } catch (error) {
    console.error('[PeriodicChecker] Błąd podczas pobierania info:', error);
    return null;
  }
};

export const shouldCheckBackup = async () => {
  try {
    console.log('[PeriodicChecker] Sprawdzanie czy należy sprawdzić backup...');

    const lastCheckStr = await AsyncStorage.getItem(LAST_BACKUP_CHECK_KEY);
    const lastCheckTimestamp = lastCheckStr ? parseInt(lastCheckStr) : 0;
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const intervalSeconds = BACKUP_CHECK_INTERVAL_HOURS * 60 * 60;
    const timeSinceLastCheck = currentTimestamp - lastCheckTimestamp;

    const shouldCheck = timeSinceLastCheck > intervalSeconds;
    console.log(`[PeriodicChecker] Czy sprawdzać czy uplodowac nowy backup? ${shouldCheck ? 'TAK' : 'NIE'}`);

    return shouldCheck;

  } catch (error) {
    console.error('[PeriodicChecker] Błąd podczas sprawdzania czasu backup\'u:', error);
    return true;
  }
};

export const performBackupCheck = async () => {
  try {
    console.log('[PeriodicChecker] Sprawdzanie czy backup jest starszy niż 7 dni...');

    const backupResult = await uploadBackupIfOlderThan();

    const currentTimestamp = Math.floor(Date.now() / 1000);
    await AsyncStorage.setItem(LAST_BACKUP_CHECK_KEY, currentTimestamp.toString());

    console.log(`[PeriodicChecker] Wynik sprawdzenia backup'u:`, backupResult);

    return backupResult;
  } catch (error) {
    console.error('[PeriodicChecker] Błąd podczas sprawdzania backup\'u:', error);

    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      await AsyncStorage.setItem(LAST_BACKUP_CHECK_KEY, currentTimestamp.toString());
    } catch (saveError) {
      console.error('[PeriodicChecker] Błąd podczas zapisywania timestamp backup\'u:', saveError);
    }

    return { uploaded: false, reason: 'Error during backup check' };
  }
};

