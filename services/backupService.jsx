import { getStorage, ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { auth } from '@/FirebaseConfig';

const LOCAL_DB_DIR = FileSystem.documentDirectory + 'SQLite/';
const LOCAL_DB_PATH = LOCAL_DB_DIR + 'database.db';
const MAX_BACKUPS_TO_KEEP = 5;

//funkcja zapewniająca, że katalog SQLite istnieje lokalnie.
async function ensureDbDirectoryExists() {
    const dirInfo = await FileSystem.getInfoAsync(LOCAL_DB_DIR);
    if (!dirInfo.exists) {
        console.log("[BackupService] Tworzenie katalogu SQLite:", LOCAL_DB_DIR);
        await FileSystem.makeDirectoryAsync(LOCAL_DB_DIR, { intermediates: true });
    }
}

//funkcja wykonująca faktyczny upload lokalnej bazy danych do Firebase Storage.
export async function performUpload() {
    console.log("[BackupService:performUpload] Rozpoczynanie...");
    const storage = getStorage();
    const userId = auth.currentUser?.uid;

    if (!userId) {
        console.error("[BackupService:performUpload] Użytkownik nie jest zalogowany.");
        return undefined;
    }

    await ensureDbDirectoryExists();

    const localFileInfo = await FileSystem.getInfoAsync(LOCAL_DB_PATH);
    if (!localFileInfo.exists) {
        console.log("[BackupService:performUpload] Lokalna baza danych nie istnieje. Nie ma czego backupować.");
        return undefined;
    }

    const fileName = `app_database_${Date.now()}.db`;
    const storageRef = ref(storage, `database_backups/${userId}/${fileName}`);
    let fileData = null;

    try {
        const response = await fetch(LOCAL_DB_PATH);
        if (!response.ok) {
            console.error(`[BackupService:performUpload] Nie udało się odczytać pliku lokalnego: ${response.statusText}`);
            return undefined;
        }
        fileData = await response.blob();
    } catch (error) {
        console.error("[BackupService:performUpload] Błąd podczas odczytywania lokalnego pliku .db:", error);
        return undefined;
    }

    if (!fileData) {
        console.error("[BackupService:performUpload] Brak danych pliku do uploadu.");
        return undefined;
    }

    try {
        console.log("[BackupService:performUpload] Rozpoczynam upload pliku .db do Storage...");
        const uploadResult = await uploadBytes(storageRef, fileData, {
            contentType: 'application/octet-stream'
        });
        console.log("[BackupService:performUpload] Upload zakończony sukcesem. Plik:", uploadResult.ref.fullPath);

        // opcjonalnie: Usuń stare backupy, jeśli jest ich za dużo
        // await cleanupOldBackups(userId, MAX_BACKUPS_TO_KEEP);

        return uploadResult;
    } catch (error) {
        console.error("[BackupService:performUpload] Błąd podczas uploadu pliku .db do Storage:", error);
        return undefined;
    }
}

//funkcja do usuwania starych backupów, aby nie zajmować zbyt dużo miejsca.
// TODO zamienić na funkcje firebase
async function cleanupOldBackups(userId, backupsToKeep) {
    console.log(`[BackupService:cleanupOldBackups] Rozpoczynanie czyszczenia starych backupów dla użytkownika ${userId}, zachowując ${backupsToKeep} najnowszych.`);
    const storage = getStorage();
    const userBackupsRef = ref(storage, `database_backups/${userId}`);

    try {
        const listResult = await listAll(userBackupsRef);

        const backups = listResult.items.map(itemRef => {
            const nameParts = itemRef.name.split('_');
            let timestamp = 0;
            if (nameParts.length === 3 && nameParts[0] === 'app' && nameParts[1] === 'database') {
                timestamp = parseInt(nameParts[2].split('.')[0], 10);
            }
            return { ref: itemRef, name: itemRef.name, timestamp: isNaN(timestamp) ? 0 : timestamp };
        }).sort((a, b) => b.timestamp - a.timestamp); 

        if (backups.length > backupsToKeep) {
            const backupsToDelete = backups.slice(backupsToKeep);
            console.log(`[BackupService:cleanupOldBackups] Znaleziono ${backups.length} backupów. Usuwanie ${backupsToDelete.length} najstarszych.`);
            for (const backup of backupsToDelete) {
                try {
                    await deleteObject(backup.ref);
                    console.log(`[BackupService:cleanupOldBackups] Usunięto stary backup: ${backup.name}`);
                } catch (deleteError) {
                    console.error(`[BackupService:cleanupOldBackups] Błąd podczas usuwania backupu ${backup.name}:`, deleteError);
                }
            }
        } else {
            console.log(`[BackupService:cleanupOldBackups] Liczba backupów (${backups.length}) nie przekracza limitu (${backupsToKeep}). Nie ma potrzeby usuwania.`);
        }
    } catch (error) {
        console.error("[BackupService:cleanupOldBackups] Błąd podczas listowania backupów do czyszczenia:", error);
    }
}

//sprawdza datę ostatniego zdalnego backupu i jeśli jest starszy niż tydzień (lub nie istnieje), wykonuje nowy backup
export async function uploadBackupIfOlderThan(thresholdInMilliseconds = 7 * 24 * 60 * 60 * 1000) {
    const storage = getStorage();
    const userId = auth.currentUser?.uid;

    if (!userId) {
        console.warn("[ConditionalBackup] Użytkownik nie jest zalogowany. Nie można sprawdzić/wysłać backupu.");
        return { uploaded: false, reason: "User not logged in" };
    }

    const userBackupsRef = ref(storage, `database_backups/${userId}`);
    let newestRemoteTimestamp = 0;

    try {
        console.log(`[ConditionalBackup] Sprawdzanie istniejących backupów dla użytkownika ${userId}`);
        const listResult = await listAll(userBackupsRef);

        if (listResult.items.length > 0) {
            listResult.items.forEach(itemRef => {
                const nameParts = itemRef.name.split('_');
                if (nameParts.length === 3 && nameParts[0] === 'app' && nameParts[1] === 'database') {
                    const timestampStr = nameParts[2].split('.')[0];
                    const timestamp = parseInt(timestampStr, 10);
                    if (!isNaN(timestamp) && timestamp > newestRemoteTimestamp) {
                        newestRemoteTimestamp = timestamp;
                    }
                }
            });
            if (newestRemoteTimestamp > 0) {
                console.log(`[ConditionalBackup] Najnowszy znaleziony zdalny backup ma timestamp: ${newestRemoteTimestamp} (${new Date(newestRemoteTimestamp).toISOString()})`);
            } else {
                console.log("[ConditionalBackup] Nie znaleziono poprawnie sformatowanych backupów.");
            }
        } else {
            console.log("[ConditionalBackup] Brak zdalnych backupów. Należy utworzyć pierwszy backup.");
        }

    } catch (error) {
        if (error.code === 'storage/object-not-found' || (error.message && error.message.includes("No object found"))) {
            console.log("[ConditionalBackup] Katalog backupów użytkownika nie istnieje (prawdopodobnie nowy użytkownik). Należy utworzyć pierwszy backup.");
        } else {
            console.error("[ConditionalBackup] Błąd podczas listowania zdalnych backupów:", error);
            return { uploaded: false, reason: "Error listing remote backups" };
        }
    }

    const thresholdTimestamp = Date.now() - thresholdInMilliseconds;

    if (newestRemoteTimestamp < thresholdTimestamp) {
        console.log(`[ConditionalBackup] Najnowszy backup (lub brak) jest starszy niż próg (lub nie istnieje). Timestamp: ${newestRemoteTimestamp} vs ${thresholdTimestamp}. Rozpoczynam upload.`);
        const uploadResult = await performUpload();
        if (uploadResult) {
            return { uploaded: true, reason: `Backup was older than threshold (${thresholdInMilliseconds / (1000 * 60 * 60 * 24)} days) or missing.` };
        } else {
            return { uploaded: false, reason: "Upload process failed." };
        }
    } else {
        console.log(`[ConditionalBackup] Najnowszy zdalny backup jest wystarczająco świeży (timestamp: ${newestRemoteTimestamp}). Nie ma potrzeby wysyłania nowego.`);
        return { uploaded: false, reason: "Existing backup is recent enough." };
    }
}

//sprawdza, czy w Firebase Storage istnieje nowsza wersja bazy danych niż lokalna. Jeśli tak, pobiera ją i zastępuje lokalną bazę
export async function checkAndRestoreBackup(userIdOverride) {
    const storage = getStorage();
    const userId = userIdOverride || auth.currentUser?.uid;
    if (!userId) {
        console.error("[RestoreService] Użytkownik nie jest zalogowany. Nie można sprawdzić/przywrócić backupu.");
        return false;
    }

    await ensureDbDirectoryExists();

    const userBackupsRef = ref(storage, `database_backups/${userId}`);
    console.log(`[RestoreService] Sprawdzanie backupów dla użytkownika ${userId} w ${userBackupsRef.fullPath}`);

    try {
        const listResult = await listAll(userBackupsRef);

        if (listResult.items.length === 0) {
            console.log("[RestoreService] Brak backupów w Firebase Storage.");
            return false;
        }

        let newestBackupRef = null;
        let newestRemoteTimestamp = 0;

        listResult.items.forEach(itemRef => {
            const nameParts = itemRef.name.split('_');
            if (nameParts.length === 3 && nameParts[0] === 'app' && nameParts[1] === 'database') {
                const timestampStr = nameParts[2].split('.')[0];
                const timestamp = parseInt(timestampStr, 10);
                if (!isNaN(timestamp) && timestamp > newestRemoteTimestamp) {
                    newestRemoteTimestamp = timestamp;
                    newestBackupRef = itemRef;
                }
            }
        });

        if (!newestBackupRef) {
            console.log("[RestoreService] Nie znaleziono prawidłowo sformatowanych nazw backupów.");
            return false;
        }

        console.log(`[RestoreService] Najnowszy zdalny backup: ${newestBackupRef.name} (Timestamp: ${newestRemoteTimestamp})`);

        const localDbInfo = await FileSystem.getInfoAsync(LOCAL_DB_PATH);
        let localDbTimestamp = 0;

        if (localDbInfo.exists) {
            localDbTimestamp = Math.floor(localDbInfo.modificationTime * 1000);
            console.log(`[RestoreService] Lokalna baza danych istnieje. Czas modyfikacji: ${new Date(localDbTimestamp).toISOString()} (Timestamp: ${localDbTimestamp})`);
        } else {
            console.log("[RestoreService] Lokalna baza danych nie istnieje.");
        }

        if (newestRemoteTimestamp > localDbTimestamp) {
            console.log("[RestoreService] Zdalny backup jest nowszy (lub lokalny nie istnieje). Rozpoczynam pobieranie...");

            const downloadURL = await getDownloadURL(newestBackupRef);
            const tempFilePath = FileSystem.cacheDirectory + `temp_database_download_${Date.now()}.db`; // Użyj cacheDirectory dla plików tymczasowych

            console.log(`[RestoreService] Pobieranie z URL: ${downloadURL} do ${tempFilePath}`);
            const downloadResult = await FileSystem.downloadAsync(downloadURL, tempFilePath);
            console.log("[RestoreService] Pobieranie zakończone. Plik w:", downloadResult.uri);

            if (localDbInfo.exists) {
                try {
                    await FileSystem.deleteAsync(LOCAL_DB_PATH, { idempotent: true });
                    console.log("[RestoreService] Usunięto stary plik lokalnej bazy danych.");
                } catch (deleteError) {
                    console.error("[RestoreService] Błąd podczas usuwania starej lokalnej bazy danych:", deleteError);
                }
            }

            await FileSystem.moveAsync({
                from: downloadResult.uri,
                to: LOCAL_DB_PATH
            });
            console.log(`[RestoreService] Baza danych została przywrócona do ${LOCAL_DB_PATH}`);
            return true;
        } else {
            console.log("[RestoreService] Lokalna baza danych jest aktualna lub nowsza. Nie ma potrzeby przywracania.");
            return false;
        }

    } catch (error) {
        if (error.code === 'storage/object-not-found' || (error.message && error.message.includes("No object found"))) {
            console.warn(`[RestoreService] Katalog dla użytkownika ${userId} jeszcze nie istnieje lub jest pusty. To normalne dla nowych użytkowników lub jeśli nie ma backupów.`);
        } else {
            console.error("[RestoreService] Błąd podczas sprawdzania/przywracania backupu:", error);
        }
        return false;
    }
}