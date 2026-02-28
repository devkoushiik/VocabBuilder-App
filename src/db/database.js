import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('vocabulary.db');

// Initialize database (create tables if they don't exist)
export const initDatabase = async () => {
  try {
    console.log('Initializing database...');



    // Create vocabulary table with correct schema
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        meaning TEXT NOT NULL,
        sortType TEXT NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        inDoneList INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Migration: add inDoneList column if it doesn't exist (for existing DBs)
    try {
      await db.execAsync('ALTER TABLE vocabulary ADD COLUMN inDoneList INTEGER DEFAULT 0');
    } catch (e) {
      // Column already exists, ignore
    }

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export { db };
