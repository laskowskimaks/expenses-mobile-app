import { categories, settings } from '@/database/schema';

const DEFAULT_CATEGORIES = [
    { name: 'Żywność', color: '#ff9f43', iconName: 'food-fork-drink', isDeletable: false },
    { name: 'Dom', color: '#954535', iconName: 'home', isDeletable: false },
    { name: 'Transport', color: '#2c387e', iconName: 'car', isDeletable: false },
    { name: 'Zdrowie', color: '#24ff8e', iconName: 'heart-pulse', isDeletable: false },
    { name: 'Edukacja', color: '#8e44ad', iconName: 'school', isDeletable: false },
    { name: 'Rozrywka i kultura', color: '#e74c3c', iconName: 'theater', isDeletable: false },
    { name: 'Zakupy i ubrania', color: '#f1c40f', iconName: 'shopping', isDeletable: false },
    { name: 'Finanse', color: '#27ae60', iconName: 'finance', isDeletable: false },
    { name: 'Inne', color: '#bdc3c7', iconName: 'shape-outline', isDeletable: false },
];

const getDefaultSettings = (userId, email, hashedPassword, passwordSalt) => ([
    { key: 'userId', value: userId },
    { key: 'email', value: email },
    { key: 'password', value: hashedPassword },
    { key: 'passwordSalt', value: passwordSalt },
    { key: 'billing_period_start_day', value: '1' },
    { key: 'savings_goal', value: '0' },
    { key: 'pin', value: '' },
    { key: 'pinSalt', value: '' },
    { key: 'database_initialized_at', value: new Date().toISOString() },
]);

export const initializeNewUserDatabase = async (db, userId, email, hashedPassword, passwordSalt) => {
    try {
        const initialSettings = getDefaultSettings(userId, email, hashedPassword, passwordSalt);

        await db.transaction(async (tx) => {
            await tx.insert(settings).values(initialSettings);
            await tx.insert(categories).values(DEFAULT_CATEGORIES);
        });

        console.log('[DefaultData] Baza danych zainicjalizowana pomyślnie dla:', email);
        return true;
    } catch (error) {
        console.error('[DefaultData] Inicjalizacja bazy danych nie powiodła się:', error);
        throw error;
    }
};