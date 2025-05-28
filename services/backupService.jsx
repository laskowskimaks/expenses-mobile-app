import { getStorage, ref, uploadBytes, UploadResult } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { auth } from '@/FirebaseConfig';

export async function uploadBackup() {
    const storage = getStorage();
    const localFilePath = FileSystem.documentDirectory + 'SQLite/database.db'

    const userId = auth.currentUser.uid;
    const fileName = `app_database_${Date.now()}.db`;
    const storageRef = ref(storage, `database_backups/${userId}/${fileName}`);

    let fileData = null;

    try {
        console.log("[BackupService] Próbuję odczytać plik lokalny:", localFilePath);
        const response = await fetch(localFilePath);
        if (!response.ok) {
           console.error(`[BackupService] Nie udało się odczytać pliku lokalnego: ${response.statusText}`);
        }
        fileData = await response.blob();
        console.log("[BackupService] Plik lokalny odczytany jako Blob.");

    } catch (error) {
        console.error("[BackupService] Błąd podczas odczytywania lokalnego pliku .db:", error);
    }

    if (!fileData) {
        console.error("[BackupService] Brak danych pliku do uploadu.");
        return undefined;
    }

    try {
        console.log("[BackupService] Rozpoczynam upload pliku .db do Storage...");
        const uploadResult = await uploadBytes(storageRef, fileData);
        console.log("[BackupService] Upload zakończony sukcesem");
        // console.log("Upload zakończony sukcesem:", uploadResult);
        // console.log("Plik zapisany jako:", uploadResult.ref.fullPath);

        // URL do tego pliku po uploadzie
        // const downloadURL = await getDownloadURL(uploadResult.ref);
        // console.log("URL do pobrania pliku:", downloadURL);

        return uploadResult;

    } catch (error) {
        console.error("[BackupService] Błąd podczas uploadu pliku .db do Storage:", error);
    }
}
