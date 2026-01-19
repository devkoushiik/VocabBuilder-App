import { db } from './database';

/**
 * Add a new vocabulary entry
 */
export const addVocabulary = async (data) => {
    try {
        const { name, meaning, sortType, month, year } = data;
        const now = Math.floor(Date.now() / 1000);

        const result = await db.runAsync(
            `INSERT INTO vocabulary (name, meaning, sortType, month, year, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name.trim(), meaning.trim(), sortType.toUpperCase(), month, year, now, now]
        );

        // Get the inserted record
        const inserted = await db.getFirstAsync(
            'SELECT * FROM vocabulary WHERE id = ?',
            [result.lastInsertRowId]
        );

        return inserted;
    } catch (error) {
        console.error('Error adding vocabulary:', error);
        throw new Error('Failed to add vocabulary');
    }
};

/**
 * Get vocabulary with filters and pagination
 */
export const getVocabulary = async (params = {}) => {
    try {
        const {
            sortType,
            month,
            year,
            search,
            limit = 10,
            page = 1,
        } = params;

        // Build WHERE clause
        const conditions = [];
        const values = [];

        if (sortType) {
            const sortTypes = sortType.split(',').map(s => s.trim().toUpperCase());
            const placeholders = sortTypes.map(() => '?').join(',');
            conditions.push(`sortType IN (${placeholders})`);
            values.push(...sortTypes);
        }

        if (month) {
            conditions.push('month = ?');
            values.push(month);
        }

        if (year) {
            conditions.push('year = ?');
            values.push(year);
        }

        if (search) {
            conditions.push('name LIKE ?');
            values.push(`%${search}%`);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) as count FROM vocabulary ${whereClause}`;
        const countResult = await db.getFirstAsync(countQuery, values);
        const total = countResult?.count || 0;

        // Get grand total (ignoring filters)
        const grandTotalResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM vocabulary');
        const grandTotal = grandTotalResult?.count || 0;

        // Get paginated data
        const offset = (page - 1) * limit;
        const dataQuery = `
      SELECT * FROM vocabulary 
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `;

        const data = await db.getAllAsync(dataQuery, [...values, limit, offset]);

        return {
            data: data || [],
            meta: {
                totalItems: total,
                grandTotal,
                totalPages: Math.ceil(total / limit) || 1,
                currentPage: page,
                limit,
            },
        };
    } catch (error) {
        console.error('Error getting vocabulary:', error);
        throw new Error('Failed to get vocabulary');
    }
};

/**
 * Update a vocabulary entry
 */
export const updateVocabulary = async (id, data) => {
    try {
        const { name, meaning, sortType, month, year } = data;
        const now = Math.floor(Date.now() / 1000);

        await db.runAsync(
            `UPDATE vocabulary 
       SET name = ?, meaning = ?, sortType = ?, month = ?, year = ?, updatedAt = ?
       WHERE id = ?`,
            [name.trim(), meaning.trim(), sortType.toUpperCase(), month, year, now, id]
        );

        const updated = await db.getFirstAsync(
            'SELECT * FROM vocabulary WHERE id = ?',
            [id]
        );

        if (!updated) {
            throw new Error('Vocabulary not found');
        }

        return updated;
    } catch (error) {
        console.error('Error updating vocabulary:', error);
        throw new Error('Failed to update vocabulary');
    }
};

/**
 * Delete a vocabulary entry
 */
export const deleteVocabulary = async (id) => {
    try {
        const result = await db.runAsync(
            'DELETE FROM vocabulary WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            throw new Error('Vocabulary not found');
        }
    } catch (error) {
        console.error('Error deleting vocabulary:', error);
        throw new Error('Failed to delete vocabulary');
    }
};

/**
 * Delete all vocabulary entries
 */
export const clearAllVocabulary = async () => {
    try {
        const countResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM vocabulary');
        const totalBefore = countResult?.count || 0;

        await db.runAsync('DELETE FROM vocabulary');

        return { deletedCount: totalBefore };
    } catch (error) {
        console.error('Error clearing all vocabulary:', error);
        throw new Error('Failed to clear all vocabulary');
    }
};

/**
 * Get flashcards (same as getVocabulary but can have different logic if needed)
 */
export const getFlashcards = getVocabulary;

/**
 * Get distinct years from vocabulary
 */
export const getAvailableYears = async () => {
    try {
        const result = await db.getAllAsync('SELECT DISTINCT year FROM vocabulary ORDER BY year DESC');
        return result.map(row => row.year);
    } catch (error) {
        console.error('Error getting years:', error);
        return [];
    }
};
