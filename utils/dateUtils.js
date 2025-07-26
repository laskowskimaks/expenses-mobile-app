export const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);
export const dateToTimestamp = (date) => Math.floor(date.getTime() / 1000);
export const timestampToDate = (timestamp) => new Date(timestamp * 1000);

export const formatDate = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Brak daty';
  }
  
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp * 1000));
  } catch (error) {
    console.error('[DateUtils] Błąd formatowania daty:', error);
    return 'Błąd formatowania';
  }
};

export const formatTimestamp = formatDate;

export const formatDateOnly = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Brak daty';
  }
  
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(timestamp * 1000));
  } catch (error) {
    console.error('[DateUtils] Błąd formatowania daty:', error);
    return 'Błąd formatowania';
  }
};

export const formatTimeOnly = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Brak czasu';
  }
  
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp * 1000));
  } catch (error) {
    console.error('[DateUtils] Błąd formatowania czasu:', error);
    return 'Błąd formatowania';
  }
};