import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { vocabulary } from './schema';

// Open the database
const expo = SQLite.openDatabaseSync('vocabulary.db');

// Create Drizzle instance
export const db = drizzle(expo);

// Initialize database (create tables if they don't exist)
export const initDatabase = async () => {
    try {
        console.log('Initializing database...');

        // Create vocabulary table
        await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        meaning TEXT NOT NULL,
        sort_type TEXT NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

export { vocabulary };
