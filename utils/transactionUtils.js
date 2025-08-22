export const formatDateForHeader = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // zerowanie czasu, aby porównywać tylko daty
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Dzisiaj';
  }

  if (date.getTime() === yesterday.getTime()) {
    return 'Wczoraj';
  }

  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const groupTransactionsByDate = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const grouped = transactions.reduce((acc, transaction) => {
    const transactionDate = new Date(transaction.transactionDate * 1000);
    const dateKey = formatDateForHeader(transactionDate);

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);

    return acc;
  }, {});

  const sections = Object.keys(grouped).map(date => ({
    title: date,
    data: grouped[date],
  }));

  return sections;
};