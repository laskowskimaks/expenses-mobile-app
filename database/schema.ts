import { sqliteTable,index, text, integer,check, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  iconName: text('icon_name').notNull(),
  isDeletable: integer('is_deletable', { mode: 'boolean' }).notNull().default(true),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  title: text('title').notNull(),
  transactionDate: integer('transaction_date').notNull(),
  notes: text('notes'),
  location: text('location'),
  periodicTransactionId: integer('periodic_transaction_id'),

  categoryId: integer('category_id').notNull().references(() => categories.id),

}, (table) => ({
  transactionDateIdx: index('transaction_date_idx').on(table.transactionDate),
}));

export const periodicTransactions = sqliteTable('periodic_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  title: text('title').notNull(),
  repeatInterval: integer('repeat_interval').notNull(),
  repeatUnit: text('repeat_unit').notNull(),
  startDate: integer('start_date').notNull(),
  nextOccurrenceDate: integer('next_occurrence_date').notNull(),
  endDate: integer('end_date'),
  notes: text('notes'),

  categoryId: integer('category_id').references(() => categories.id),
}, (table) => ({
  checkRepeatUnit: check('check_repeat_unit', sql`${table.repeatUnit} in ('day', 'week', 'month', 'year')`),
}));

export const loyaltyCards = sqliteTable('loyalty_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  barcodeData: text('barcode_data'),
  barcodeFormat: text('barcode_format'), // np. 'QR_CODE', 'EAN_13'
  notes: text('notes'),
  imageUri: text('image_uri'), 
});


export const transactionTags = sqliteTable('transaction_tags', {
  transactionId: integer('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.transactionId, table.tagId] }),
}));

export const periodicTransactionTags = sqliteTable('periodic_transaction_tags', {
  periodicTransactionId: integer('periodic_transaction_id').notNull().references(() => periodicTransactions.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.periodicTransactionId, table.tagId] }),
}));



export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions), 
  periodicTransactions: many(periodicTransactions),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  transactionTags: many(transactionTags), 
  periodicTransactionTags: many(periodicTransactionTags),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  periodicTransaction: one(periodicTransactions, {
    fields: [transactions.periodicTransactionId],
    references: [periodicTransactions.id],
  }),
  transactionTags: many(transactionTags),
}));

export const periodicTransactionsRelations = relations(periodicTransactions, ({ one, many }) => ({
  category: one(categories, {
    fields: [periodicTransactions.categoryId],
    references: [categories.id],
  }),
  periodicTransactionTags: many(periodicTransactionTags),
}));

export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionTags.transactionId],
    references: [transactions.id],
  }),
  tag: one(tags, {
    fields: [transactionTags.tagId],
    references: [tags.id],
  }),
}));

export const periodicTransactionTagsRelations = relations(periodicTransactionTags, ({ one }) => ({
  periodicTransaction: one(periodicTransactions, {
    fields: [periodicTransactionTags.periodicTransactionId],
    references: [periodicTransactions.id],
  }),
  tag: one(tags, {
    fields: [periodicTransactionTags.tagId],
    references: [tags.id],
  }),
}));