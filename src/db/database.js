import * as SQLite from 'expo-sqlite';

// Open the database
const db = SQLite.openDatabaseSync('vocabulary.db');

// Initialize database (create tables if they don't exist)
export const initDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Drop the old table if it exists (to fix column name issues)
    try {
      await db.execAsync('DROP TABLE IF EXISTS vocabulary');
      console.log('Dropped old table (if existed)');
    } catch (error) {
      console.log('No old table to drop');
    }

    // Create vocabulary table with correct schema
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        meaning TEXT NOT NULL,
        sortType TEXT NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export { db };
