const startOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

export const calculatePeriod = (targetDate, startDay) => {
  const parsedStartDay = parseInt(startDay, 10);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth(); // (0 = styczeń)
  const day = targetDate.getDate();

  let startDate, endDate;

  if (day >= parsedStartDay) {

    startDate = new Date(year, month, parsedStartDay);

    const nextMonth = new Date(year, month + 1, parsedStartDay);
    endDate = new Date(nextMonth.getTime() - 1);
  } else {

    const currentMonthStart = new Date(year, month, parsedStartDay);
    endDate = new Date(currentMonthStart.getTime() - 1);

    startDate = new Date(year, month - 1, parsedStartDay);
  }

  return {
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate),
  };
};

export const getPreviousPeriod = (currentPeriod, startDay) => {
  const dayBeforeStart = new Date(currentPeriod.startDate.getTime() - 24 * 60 * 60 * 1000);
  return calculatePeriod(dayBeforeStart, startDay);
};

export const getNextPeriod = (currentPeriod, startDay) => {
  const dayAfterEnd = new Date(currentPeriod.endDate.getTime() + 24 * 60 * 60 * 1000);
  return calculatePeriod(dayAfterEnd, startDay);
};

export const formatPeriodForDisplay = (period) => {
  if (!period || !period.startDate || !period.endDate) {
    return 'Ładowanie...';
  }

  const startYear = period.startDate.getFullYear();
  const endYear = period.endDate.getFullYear();

  if (startYear === endYear) {
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}.${month}`;
    };
    return `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`;
  } else {
    const formatDateWithYear = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    return `${formatDateWithYear(period.startDate)} - ${formatDateWithYear(period.endDate)}`;
  }
};