export const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);
export const dateToTimestamp = (date) => Math.floor(date.getTime() / 1000);
export const timestampToDate = (timestamp) => new Date(timestamp * 1000);

export const formatTimestamp = (timestamp) => {
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp * 1000));
};