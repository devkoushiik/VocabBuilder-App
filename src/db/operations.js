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
            excludeDoneList = false,
            doneListOnly = false,
        } = params;

        // Build WHERE clause
        const conditions = [];
        const values = [];

        if (excludeDoneList) {
            conditions.push('(inDoneList = 0 OR inDoneList IS NULL)');
        }

        if (doneListOnly) {
            conditions.push('inDoneList = 1');
        }

        if (sortType && String(sortType).trim()) {
            const sortTypes = String(sortType).split(',')
                .map(s => s.trim().toUpperCase())
                .filter(s => s.length === 1 && /[A-Z]/.test(s));
            if (sortTypes.length > 0) {
                const placeholders = sortTypes.map(() => '?').join(',');
                conditions.push(`sortType IN (${placeholders})`);
                values.push(...sortTypes);
            }
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
      ORDER BY name ASC
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
 * Get flashcards for practice (excludes items in done list)
 */
export const getFlashcards = async (params = {}) => {
    return getVocabulary({ ...params, excludeDoneList: true });
};

/**
 * Get done list vocabulary
 */
export const getDoneList = async () => {
    try {
        const result = await getVocabulary({
            doneListOnly: true,
            limit: 1000,
            page: 1,
        });
        return result.data || [];
    } catch (error) {
        console.error('Error getting done list:', error);
        throw new Error('Failed to get done list');
    }
};

/**
 * Move vocabulary to done list
 */
export const moveToDoneList = async (id) => {
    try {
        await db.runAsync(
            'UPDATE vocabulary SET inDoneList = 1, updatedAt = ? WHERE id = ?',
            [Math.floor(Date.now() / 1000), id]
        );
        return await db.getFirstAsync('SELECT * FROM vocabulary WHERE id = ?', [id]);
    } catch (error) {
        console.error('Error moving to done list:', error);
        throw new Error('Failed to move to done list');
    }
};

/**
 * Move vocabulary back to practice list
 */
export const moveToPracticeList = async (id) => {
    try {
        await db.runAsync(
            'UPDATE vocabulary SET inDoneList = 0, updatedAt = ? WHERE id = ?',
            [Math.floor(Date.now() / 1000), id]
        );
        return await db.getFirstAsync('SELECT * FROM vocabulary WHERE id = ?', [id]);
    } catch (error) {
        console.error('Error moving to practice list:', error);
        throw new Error('Failed to move to practice list');
    }
};

/**
 * Delete all items from done list
 */
export const clearDoneList = async () => {
    try {
        const result = await db.runAsync('DELETE FROM vocabulary WHERE inDoneList = 1');
        return { deletedCount: result.changes || 0 };
    } catch (error) {
        console.error('Error clearing done list:', error);
        throw new Error('Failed to clear done list');
    }
};

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
