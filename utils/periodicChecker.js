import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_CHECK_KEY = 'lastPeriodicTransactionCheck';
const CHECK_INTERVAL_HOURS = 6; // sprawdzanie co 6 godzin

//Sprawdzanie czy należy wykonać sprawdzenie transakcji okresowych
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

// Zapisywanie aktualnego czasu jako ostatnie sprawdzenie
export const markPeriodicCheckCompleted = async () => {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000).toString();
    await AsyncStorage.setItem(LAST_CHECK_KEY, currentTimestamp);
    
    console.log(`[PeriodicChecker] Zapisano czas ostatniego sprawdzenia: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('[PeriodicChecker] Błąd podczas zapisywania czasu sprawdzenia:', error);
  }
};

// Resetowanie czasu ostatniego sprawdzenia (wymusza sprawdzenie przy następnym starcie)
export const resetPeriodicCheckTime = async () => {
  try {
    await AsyncStorage.removeItem(LAST_CHECK_KEY);
    console.log('[PeriodicChecker] Zresetowano czas ostatniego sprawdzenia');
  } catch (error) {
    console.error('[PeriodicChecker] Błąd podczas resetowania czasu:', error);
  }
};

// Pobieranie informacji o ostatnim sprawdzeniu (do debugowania)
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