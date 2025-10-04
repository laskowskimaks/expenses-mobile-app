import { getStorage, ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { auth } from '@/FirebaseConfig';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from '@/database/schema';
import { loyaltyCards } from '@/database/schema';
import { eq, isNotNull } from 'drizzle-orm';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_DB_DIR = FileSystem.documentDirectory + 'SQLite/';
const LOCAL_DB_PATH = LOCAL_DB_DIR + 'database.db';
const LOCAL_IMAGES_DIR = FileSystem.documentDirectory + 'loyalty_card_images/';
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;
const COMPRESSION_SIZE_THRESHOLD_BYTES = 200 * 1024; // 200 KB
export const DB_TIMESTAMP_KEY = 'DB_TIMESTAMP_KEY';

let uploadPromise = null;

async function _retryOperation(operation, attempt = 1) {
    try {
        return await operation();
    } catch (error) {
        if (attempt >= RETRY_COUNT) {
            console.error(`[BackupService:_retry] Operacja nieudana po ${RETRY_COUNT} próbach. Błąd:`, error);
            throw error;
        }
        console.warn(`[BackupService:_retry] Próba ${attempt} nieudana. Ponawiam za ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return _retryOperation(operation, attempt + 1);
    }
}

async function _openTempDbConnection(readOnly = true) {
    try {
        const tempSqliteConn = openDatabaseSync('database.db', { enableChangeListener: false, readOnly });
        const tempDrizzleDb = drizzle(tempSqliteConn, { schema });
        return { tempSqliteConn, tempDrizzleDb };
    } catch (e) {
        console.error("[BackupService] Nie udało się otworzyć tymczasowego połączenia z bazą:", e);
        return { tempSqliteConn: null, tempDrizzleDb: null };
    }
}

async function _ensureDirectoryExists(directoryPath) {
    try {
        const dirInfo = await FileSystem.getInfoAsync(directoryPath);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true });
        }
    } catch (error) {
        console.error(`[BackupService] Błąd podczas sprawdzania/tworzenia katalogu: ${directoryPath}`, error);
        throw error;
    }
}

async function _withTempDbConnection(asyncWork, readOnly = true) {
    let tempConn = null;
    try {
        const { tempDrizzleDb, tempSqliteConn } = await _openTempDbConnection(readOnly);
        if (!tempDrizzleDb) {
            throw new Error("Nie udało się otworzyć tymczasowego połączenia z bazą.");
        }
        tempConn = tempSqliteConn;
        return await asyncWork(tempDrizzleDb);
    } catch (error) {
        console.error("[BackupService] Błąd podczas pracy z tymczasową bazą danych:", error);
        throw error;
    } finally {
        if (tempConn && typeof tempConn.closeSync === 'function') {
            try {
                tempConn.closeSync();
            } catch (closeError) {
                console.error("[BackupService] Błąd podczas zamykania połączenia z bazą:", closeError);
            }
        }
    }
}

async function _findNewestRemoteBackup(userBackupsRef) {
    try {
        const listResult = await listAll(userBackupsRef);
        if (listResult.items.length === 0) {
            return null;
        }

        let newestBackup = { ref: null, timestamp: 0 };

        listResult.items.forEach(itemRef => {
            const nameParts = itemRef.name.split('_');
            if (nameParts.length === 3 && nameParts[0] === 'app' && nameParts[1] === 'database') {
                const timestamp = parseInt(nameParts[2].split('.')[0], 10);
                if (!isNaN(timestamp) && timestamp > newestBackup.timestamp) {
                    newestBackup = { ref: itemRef, timestamp };
                }
            }
        });

        return newestBackup.ref ? newestBackup : null;
    } catch (error) {
        console.error("[BackupService] Błąd podczas wyszukiwania najnowszego backupu:", error);
        throw error;
    }
}

export async function performUpload() {
    if (uploadPromise) {
        console.log("[BackupService:performUpload] Upload już trwa, czekam na zakończenie...");
        return await uploadPromise;
    }

    uploadPromise = _performUploadInternal();
    try {
        const result = await uploadPromise;
        return result;
    } catch (e) {
        console.error("[BackupService] Błąd podczas uploadu backupu:", e);
        return null;
    } finally {
        uploadPromise = null;
    }
}

async function _performUploadInternal() {
    const storage = getStorage();
    const userId = auth.currentUser?.uid;
    if (!userId) {
        console.error("[BackupService] Użytkownik nie jest zalogowany.");
        return;
    }

    console.log("[BackupService] Rozpoczynanie procesu backupu...");

    try {
        await _ensureDirectoryExists(LOCAL_DB_DIR);
        const localFileInfo = await FileSystem.getInfoAsync(LOCAL_DB_PATH);
        if (!localFileInfo.exists) {
            console.log("[BackupService] Lokalna baza danych nie istnieje. Nie ma czego backupować.");
            return;
        }

        const newBackupTimestamp = Date.now();
        const dbFileName = `app_database_${newBackupTimestamp}.db`;
        const dbStorageRef = ref(storage, `database_backups/${userId}/${dbFileName}`);
        const response = await fetch(LOCAL_DB_PATH);
        const fileData = await response.blob();

        await _retryOperation(() => uploadBytes(dbStorageRef, fileData, { contentType: 'application/octet-stream' }));
        console.log("[BackupService] Wysyłanie bazy danych zakończone sukcesem.");
        await AsyncStorage.setItem(DB_TIMESTAMP_KEY, newBackupTimestamp.toString());

    } catch (error) {
        console.error("[BackupService] Krytyczny błąd podczas uploadu pliku .db. Przerywam backup.", error);
        return;
    }

    try {
        await _withTempDbConnection(async (tempDb) => {
            console.log("[BackupService] Rozpoczynanie backupu obrazów kart lojalnościowych...");
            const cardsWithImages = await tempDb.select().from(loyaltyCards).where(isNotNull(loyaltyCards.imageUri));
            const remoteImagePaths = new Set();
            console.log(`[BackupService] Znaleziono ${cardsWithImages.length} kart z obrazami do backupu.`);

            for (const card of cardsWithImages) {
                if (!card.imageUri || !card.imageUri.startsWith('file://')) continue;

                const fileInfo = await FileSystem.getInfoAsync(card.imageUri, { size: true });
                if (!fileInfo.exists) {
                    console.warn(`[BackupService] Plik obrazu dla karty "${card.name}" (ID: ${card.id}) nie istnieje. Pomijam.`);
                    continue;
                }

                const remoteFileName = `${card.id}.jpg`;
                const imageStorageRef = ref(storage, `loyalty_card_images/${userId}/${remoteFileName}`);
                remoteImagePaths.add(imageStorageRef.fullPath);

                try {
                    let imageBlob;
                    if (fileInfo.size > COMPRESSION_SIZE_THRESHOLD_BYTES) {
                        console.log(`[BackupService] Obraz dla karty ID: ${card.id} jest duży (${(fileInfo.size / 1024).toFixed(1)} KB). Kompresuję...`);
                        const manipResult = await ImageManipulator.manipulateAsync(
                            card.imageUri, [], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                        );
                        const imageResponse = await fetch(manipResult.uri);
                        imageBlob = await imageResponse.blob();
                    } else {
                        console.log(`[BackupService] Obraz dla karty ID: ${card.id} jest wystarczająco mały (${(fileInfo.size / 1024).toFixed(1)} KB). Wysyłam bez kompresji.`);
                        const imageResponse = await fetch(card.imageUri);
                        imageBlob = await imageResponse.blob();
                    }
                    await _retryOperation(() => uploadBytes(imageStorageRef, imageBlob, { contentType: 'image/jpeg' }));
                    console.log(`[BackupService] Obraz dla karty ID: ${card.id} wysłany pomyślnie.`);
                } catch (e) {
                    console.error(`[BackupService] Błąd podczas wysyłania obrazu dla karty ID: ${card.id}.`, e);
                }
            }

            console.log("[BackupService] Czyszczenie starych obrazów w chmurze...");
            const userImagesRef = ref(storage, `loyalty_card_images/${userId}`);
            const remoteFiles = await listAll(userImagesRef);
            for (const itemRef of remoteFiles.items) {
                if (!remoteImagePaths.has(itemRef.fullPath)) {
                    console.log(`[BackupService] Usuwanie osieroconego obrazu: ${itemRef.fullPath}`);
                    try {
                        await deleteObject(itemRef);
                    } catch (e) {
                        console.error(`[BackupService] Błąd podczas usuwania pliku ${itemRef.fullPath}`, e);
                    }
                }
            }
        }, true);
        console.log("[BackupService] Proces backupu zakończony.");
    } catch (error) {
        console.error("[BackupService] Błąd podczas backupu obrazów:", error);
    }
}

export function isUploadInProgress() {
    return uploadPromise !== null;
}

export async function uploadBackupIfOlderThan(thresholdInMilliseconds = 7 * 24 * 60 * 60 * 1000) {
    const storage = getStorage();
    const userId = auth.currentUser?.uid;
    if (!userId) {
        console.warn("[ConditionalBackup] Użytkownik nie jest zalogowany.");
        return { uploaded: false, reason: "User not logged in" };
    }

    const userBackupsRef = ref(storage, `database_backups/${userId}`);
    let newestRemoteTimestamp = 0;

    try {
        console.log(`[ConditionalBackup] Sprawdzanie istniejących backupów dla użytkownika ${userId}`);
        const newestBackup = await _findNewestRemoteBackup(userBackupsRef);

        if (newestBackup) {
            newestRemoteTimestamp = newestBackup.timestamp;
            console.log(`[ConditionalBackup] Najnowszy zdalny backup ma timestamp: ${newestRemoteTimestamp}`);
        } else {
            console.log("[ConditionalBackup] Brak zdalnych backupów. Należy utworzyć pierwszy backup.");
        }
    } catch (error) {
        if (error.code === 'storage/object-not-found' || (error.message && error.message.includes("No object found"))) {
            console.log("[ConditionalBackup] Katalog backupów użytkownika nie istnieje. Należy utworzyć pierwszy backup.");
        } else {
            console.error("[ConditionalBackup] Błąd podczas listowania zdalnych backupów:", error);
            return { uploaded: false, reason: "Error listing remote backups" };
        }
    }

    const thresholdTimestamp = Date.now() - thresholdInMilliseconds;
    if (newestRemoteTimestamp < thresholdTimestamp) {
        console.log(`[ConditionalBackup] Najnowszy backup jest starszy niż próg. Rozpoczynam upload.`);
        try {
            const uploadResult = await performUpload();
            return { uploaded: !!uploadResult, reason: uploadResult ? "Backup successful." : "Upload process failed." };
        } catch (error) {
            console.error("[ConditionalBackup] Błąd podczas uploadu:", error);
            return { uploaded: false, reason: "Error during upload" };
        }
    } else {
        console.log(`[ConditionalBackup] Najnowszy zdalny backup jest wystarczająco świeży.`);
        return { uploaded: false, reason: "Existing backup is recent enough." };
    }
}

export async function checkAndRestoreBackup(userIdOverride) {
    const storage = getStorage();
    const userId = userIdOverride || auth.currentUser?.uid;
    if (!userId) {
        console.error("[RestoreService] Użytkownik nie jest zalogowany.");
        return false;
    }

    await _ensureDirectoryExists(LOCAL_DB_DIR);
    const userBackupsRef = ref(storage, `database_backups/${userId}`);
    console.log(`[RestoreService] Sprawdzanie backupów dla użytkownika ${userId}`);

    let dbRestored = false;
    let newestBackup;

    try {
        newestBackup = await _findNewestRemoteBackup(userBackupsRef);
        if (!newestBackup) {
            console.log("[RestoreService] Nie znaleziono zdalnych backupów bazy.");
            return false;
        }

        const lastRestoredTimestampStr = await AsyncStorage.getItem(DB_TIMESTAMP_KEY);
        const lastRestoredTimestamp = lastRestoredTimestampStr ? parseInt(lastRestoredTimestampStr, 10) : 0;

        console.log(`[RestoreService] Najnowszy zdalny backup: ${newestBackup.timestamp}, Ostatnio przywrócony: ${lastRestoredTimestamp}`);

        if (newestBackup.timestamp > lastRestoredTimestamp) {
            console.log(`[RestoreService] Zdalny backup jest nowszy. Rozpoczynam pobieranie...`);
            const downloadURL = await getDownloadURL(newestBackup.ref);
            await FileSystem.downloadAsync(downloadURL, LOCAL_DB_PATH + '.tmp');
            await FileSystem.moveAsync({ from: LOCAL_DB_PATH + '.tmp', to: LOCAL_DB_PATH });
            console.log(`[RestoreService] Baza danych została pobrana.`);
            dbRestored = true;
        } else {
            console.log("[RestoreService] Lokalny stan jest zsynchronizowany z najnowszym backupem.");
            return false;
        }
    } catch (error) {
        if (error.code !== 'storage/object-not-found') {
            console.error("[RestoreService] Błąd podczas pobierania bazy danych:", error);
        }
        return false;
    }

    if (!dbRestored) return false;

    try {
        await _withTempDbConnection(async (tempDb) => {
            console.log("[RestoreService] Rozpoczynanie przywracania obrazów...");
            await _ensureDirectoryExists(LOCAL_IMAGES_DIR);

            const cards = await tempDb.select().from(loyaltyCards).where(isNotNull(loyaltyCards.imageUri));
            const requiredLocalImages = new Set();
            console.log(`[RestoreService] Znaleziono ${cards.length} kart z obrazami do przywrócenia.`);

            for (const card of cards) {
                const remoteFileName = `${card.id}.jpg`;
                const newLocalPath = LOCAL_IMAGES_DIR + remoteFileName;
                requiredLocalImages.add(newLocalPath);
                const imageStorageRef = ref(storage, `loyalty_card_images/${userId}/${remoteFileName}`);

                try {
                    const downloadURL = await getDownloadURL(imageStorageRef);
                    await _retryOperation(() => FileSystem.downloadAsync(downloadURL, newLocalPath));

                    if (card.imageUri !== newLocalPath) {
                        await tempDb.update(loyaltyCards).set({ imageUri: newLocalPath }).where(eq(loyaltyCards.id, card.id));
                        console.log(`[RestoreService] Pobrany obraz dla karty ID ${card.id} i zaktualizowano ścieżkę.`);
                    }
                } catch (e) {
                    console.error(`[RestoreService] Nie udało się pobrać obrazu dla karty ID: ${card.id}.`, e);
                    await tempDb.update(loyaltyCards).set({ imageUri: null }).where(eq(loyaltyCards.id, card.id));
                }
            }

            const localFiles = await FileSystem.readDirectoryAsync(LOCAL_IMAGES_DIR);
            for (const fileName of localFiles) {
                const fullPath = LOCAL_IMAGES_DIR + fileName;
                if (!requiredLocalImages.has(fullPath)) {
                    console.log(`[RestoreService] Usuwanie nieużywanego lokalnego obrazu: ${fileName}`);
                    await FileSystem.deleteAsync(fullPath, { idempotent: true });
                }
            }
        }, false);

        await AsyncStorage.setItem(DB_TIMESTAMP_KEY, newestBackup.timestamp.toString());
        console.log(`[RestoreService] Pomyślnie przywrócono backup. Zapisano nowy znacznik czasu: ${newestBackup.timestamp}`);

    } catch (error) {
        console.error("[RestoreService] Błąd podczas przywracania obrazów:", error);
        return false;
    }

    return dbRestored;
}