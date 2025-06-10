import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as schema from '@/database/schema';
import { checkAndRestoreBackup, performUpload } from '@/services/backupService';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/drizzle/migrations';
import { createUser } from '@/services/authService';
import { openDatabaseSync } from 'expo-sqlite';

export const DATABASE_NAME = 'database.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;

export const DbContext = createContext();

export const DbProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const sqliteConnectionRef = useRef(null);

    const clearDatabase = useCallback(async () => {
        setIsLoading(true);
        console.log('[DbContext] Zamykanie i czyszczenie bazy danych...');

        if (sqliteConnectionRef.current) {
            sqliteConnectionRef.current.closeSync();
            console.log('[DbContext] Połączenie z bazą zostało zamknięte.');
        }
        setDb(null);
        sqliteConnectionRef.current = null;

        try {
            await FileSystem.deleteAsync(DB_PATH, { idempotent: true });
            console.log('[DbContext] Lokalny plik bazy danych usunięty.');
        } catch (e) {
            console.error('[DbContext] Błąd podczas usuwania pliku bazy:', e);
        }

        setIsLoading(false);
    }, []);

    const initializeDatabase = useCallback(async () => {
        setIsLoading(true);
        console.log('[DbContext] Inicjalizacja bazy danych po logowaniu...');

        if (sqliteConnectionRef.current) {
            sqliteConnectionRef.current.closeSync();
        }
        setDb(null);
        sqliteConnectionRef.current = null;

        try {
            await checkAndRestoreBackup();
            const newSqliteConn = openDatabaseSync(DATABASE_NAME);
            const newDrizzleDb = drizzle(newSqliteConn, { schema });

            console.log('[DbContext] Uruchamianie migracji...');
            await migrate(newDrizzleDb, migrations);
            console.log('[DbContext] Migracje zakończone sukcesem.');

            sqliteConnectionRef.current = newSqliteConn;
            setDb(newDrizzleDb);
            console.log('[DbContext] Nowe połączenie z bazą danych zostało utworzone.');

        } catch (e) {
            console.error('[DbContext] Krytyczny błąd podczas inicjalizacji bazy:', e);
            await clearDatabase();
        }
        setIsLoading(false);
    }, [clearDatabase]);

    const handleNewRegistration = useCallback(async (email, password) => {
        setIsLoading(true);
        console.log(`[DbContext] Inicjalizacja bazy dla nowego użytkownika: ${email}`);

        await clearDatabase();

        try {
            const newSqliteConn = openDatabaseSync(DATABASE_NAME);
            const newDrizzleDb = drizzle(newSqliteConn, { schema });

            console.log('[DbContext] Uruchamianie migracji na nowej bazie...');
            await migrate(newDrizzleDb, migrations);
            console.log('[DbContext] Migracje zakończone sukcesem, tabele utworzone.');

            const created = await createUser(newDrizzleDb, email, password);
            if (!created) {
                throw new Error("Nie udało się dodać użytkownika do lokalnej bazy danych.");
            }
            console.log(`[DbContext] Użytkownik ${email} dodany pomyślnie.`);

            sqliteConnectionRef.current = newSqliteConn;
            setDb(newDrizzleDb);
            console.log('[DbContext] Nowa, pusta baza danych utworzona i uzupełniona.');

            await performUpload();
        } catch (e) {
            console.error('[DbContext] Krytyczny błąd podczas tworzenia nowej bazy:', e);
            setDb(null);
            sqliteConnectionRef.current = null;
        }
        setIsLoading(false);
    }, [clearDatabase]);

    const value = { db, isLoading, initializeDatabase, clearDatabase, handleNewRegistration };

    return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
};

export const useDb = () => useContext(DbContext);