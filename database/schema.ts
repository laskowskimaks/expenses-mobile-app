import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Tabela 1: Ustawienia Aplikacji (Klucz-Wartość)
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Tabela 2: Kategorie
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  iconName: text('icon_name').notNull(),
  isDeletable: integer('is_deletable', { mode: 'boolean' }).notNull().default(true),
});

// Tabela 3: Tagi
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

// Tabela 4: Transakcje
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  title: text('title').notNull(),
  transactionDate: integer('transaction_date').notNull(),
  notes: text('notes'),
  location: text('location'),
  // Definicja klucza obcego wskazującego na kategorie
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
});

// Tabela 5: Transakcje Cykliczne
export const periodicTransactions = sqliteTable('periodic_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  title: text('title').notNull(),
  repeatInterval: integer('repeat_interval').notNull(),
  repeatUnit: text('repeat_unit').notNull(), // 'day', 'week', 'month', 'year'
  startDate: integer('start_date').notNull(), 
  nextOccurrenceDate: integer('next_occurrence_date').notNull(),
  endDate: integer('end_date'), // Może być NULL
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
});

// Tabela 6: Karty Lojalnościowe
export const loyaltyCards = sqliteTable('loyalty_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  cardNumber: text('card_number'),
  barcodeData: text('barcode_data'),
  barcodeFormat: text('barcode_format'), // np. 'QR_CODE', 'EAN_13'
  notes: text('notes'),
});


// === TABELE ŁĄCZĄCE (RELACJE WIELE-DO-WIELU) ===

// Tabela 7: Powiązania Transakcji z Tagami
export const transactionTags = sqliteTable('transaction_tags', {
  transactionId: integer('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.transactionId, table.tagId] }),
}));

// Tabela 8: Powiązania Transakcji Cyklicznych z Tagami
export const periodicTransactionTags = sqliteTable('periodic_transaction_tags', {
  periodicTransactionId: integer('periodic_transaction_id').notNull().references(() => periodicTransactions.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.periodicTransactionId, table.tagId] }),
}));


// === DEFINICJE RELACJI ===

// Relacje dla tabeli `categories`
export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions), // Jedna kategoria może mieć wiele transakcji
  periodicTransactions: many(periodicTransactions),
}));

// Relacje dla tabeli `tags`
export const tagsRelations = relations(tags, ({ many }) => ({
  transactionTags: many(transactionTags), // Jeden tag może być w wielu powiązaniach z transakcjami
  periodicTransactionTags: many(periodicTransactionTags),
}));

// Relacje dla tabeli `transactions`
export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  // Relacja jeden-do-wielu (odwrócona): każda transakcja ma jedną kategorię
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  // Relacja wiele-do-wielu: każda transakcja może mieć wiele tagów poprzez tabelę łączącą
  transactionTags: many(transactionTags),
}));

// Relacje dla tabeli `periodicTransactions`
export const periodicTransactionsRelations = relations(periodicTransactions, ({ one, many }) => ({
  category: one(categories, {
    fields: [periodicTransactions.categoryId],
    references: [categories.id],
  }),
  periodicTransactionTags: many(periodicTransactionTags),
}));

// Relacje dla tabeli łączącej `transactionTags`
export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
  // Każde powiązanie odnosi się do jednej transakcji
  transaction: one(transactions, {
    fields: [transactionTags.transactionId],
    references: [transactions.id],
  }),
  // Każde powiązanie odnosi się do jednego taga
  tag: one(tags, {
    fields: [transactionTags.tagId],
    references: [tags.id],
  }),
}));

// Relacje dla tabeli łączącej `periodicTransactionTags`
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