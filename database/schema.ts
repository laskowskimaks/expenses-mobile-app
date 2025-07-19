import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  passwordSalt: text('passwordSalt').notNull(),
  pin: text('pin'),
  pinSalt: text('pinSalt'),
});
