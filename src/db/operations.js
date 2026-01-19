import { eq, and, desc, sql, like } from 'drizzle-orm';
import { db, vocabulary } from './database';

/**
 * Add a new vocabulary entry
 */
export const addVocabulary = async (data) => {
    try {
        const now = new Date();
        const newVocab = {
            name: data.name.trim(),
            meaning: data.meaning.trim(),
            sortType: data.sortType.toUpperCase(),
            month: data.month,
            year: data.year,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.insert(vocabulary).values(newVocab).returning();
        return result[0];
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

        // Build where conditions
        const conditions = [];

        if (sortType) {
            const sortTypes = sortType.split(',').map(s => s.trim().toUpperCase());
            conditions.push(sql`${vocabulary.sortType} IN (${sql.join(sortTypes.map(t => sql`${t}`), sql`, `)})`);
        }

        if (month) {
            conditions.push(eq(vocabulary.month, month));
        }

        if (year) {
            conditions.push(eq(vocabulary.year, year));
        }

        if (search) {
            conditions.push(like(vocabulary.name, `%${search}%`));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const countResult = await db
            .select({ count: sql`count(*)` })
            .from(vocabulary)
            .where(whereClause);

        const total = Number(countResult[0]?.count || 0);

        // Get paginated data
        const offset = (page - 1) * limit;
        const data = await db
            .select()
            .from(vocabulary)
            .where(whereClause)
            .orderBy(desc(vocabulary.createdAt))
            .limit(limit)
            .offset(offset);

        return {
            data,
            meta: {
                totalItems: total,
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
        const result = await db
            .update(vocabulary)
            .set({
                name: data.name.trim(),
                meaning: data.meaning.trim(),
                sortType: data.sortType.toUpperCase(),
                month: data.month,
                year: data.year,
                updatedAt: new Date(),
            })
            .where(eq(vocabulary.id, id))
            .returning();

        if (!result[0]) {
            throw new Error('Vocabulary not found');
        }

        return result[0];
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
        const result = await db
            .delete(vocabulary)
            .where(eq(vocabulary.id, id))
            .returning();

        if (!result[0]) {
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
        const countBefore = await db
            .select({ count: sql`count(*)` })
            .from(vocabulary);

        const totalBefore = Number(countBefore[0]?.count || 0);

        await db.delete(vocabulary);

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
