// src/utils/transactionUtils.js

/**
 * Formatuje datę transakcji na potrzeby nagłówka sekcji.
 * Zwraca "Dzisiaj", "Wczoraj" lub datę w formacie DD.MM.RRRR.
 * @param {Date} date - Obiekt daty transakcji.
 * @returns {string} Sformatowany string daty.
 */
const formatDateForHeader = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Zerujemy czas, aby porównywać tylko daty
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Dzisiaj';
  }

  if (date.getTime() === yesterday.getTime()) {
    return 'Wczoraj';
  }

  // Używamy toLocaleDateString dla formatu DD.MM.RRRR
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Grupuje transakcje po dacie i przygotowuje dane dla komponentu SectionList.
 * @param {Array} transactions - Tablica transakcji posortowanych malejąco po dacie.
 * @returns {Array} Tablica sekcji gotowa do użycia w SectionList.
 */
export const groupTransactionsByDate = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const grouped = transactions.reduce((acc, transaction) => {
    // transactionDate to timestamp w sekundach, mnożymy przez 1000
    const transactionDate = new Date(transaction.transactionDate * 1000);
    const dateKey = formatDateForHeader(transactionDate);

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);

    return acc;
  }, {});

  // Konwertujemy obiekt na tablicę w formacie wymaganym przez SectionList
  const sections = Object.keys(grouped).map(date => ({
    title: date,
    data: grouped[date],
  }));

  return sections;
};