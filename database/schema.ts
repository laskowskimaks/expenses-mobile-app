import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  salt: text('salt').notNull(),
});

// eksportuje typ userów, aby można było go używać w innych częściach aplikacji
export type User = typeof user.$inferSelect;