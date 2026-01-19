import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const vocabulary = sqliteTable('vocabulary', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    meaning: text('meaning').notNull(),
    sortType: text('sort_type').notNull(),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
