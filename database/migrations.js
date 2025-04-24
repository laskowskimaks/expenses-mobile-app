export const runMigrations = async (db) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        salt TEXT NOT NULL
      );
    `);
    console.log('DB migrations complete');
  } catch (error) {
    console.log('[Migrations] Error initializing database:', error);
  }
};