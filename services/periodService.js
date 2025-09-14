export const calculateDaysInPeriod = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 1;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end < start) {
    return 1;
  }

  let dayCount = 0;
  const current = new Date(start);

  while (current <= end) {
    dayCount++;
    current.setDate(current.getDate() + 1);
  }

  return dayCount;
};

export const getPeriodTimestamps = (period) => {
  if (!period || !period.startDate || !period.endDate) {
    return { startTimestamp: null, endTimestamp: null };
  }

  const startDate = new Date(period.startDate);
  startDate.setHours(0, 0, 0, 0);
  const startTimestamp = Math.floor(startDate.getTime() / 1000);

  const endDate = new Date(period.endDate);
  endDate.setHours(23, 59, 59, 999);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  return { startTimestamp, endTimestamp };
};

export const calculatePeriod = (targetDate, startDay) => {
  const target = new Date(targetDate);
  const today = new Date();

  let startDate = new Date(target.getFullYear(), target.getMonth(), startDay);

  if (startDate > target) {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  let endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay - 1);

  if (endDate > today) {
    endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
  } else {
    endDate.setHours(23, 59, 59, 999);
  }

  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
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