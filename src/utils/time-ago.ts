const millisecondsPerMinute = 60 * 1000;
const millisecondsPerHour = 60 * millisecondsPerMinute;
const millisecondsPerDay = 24 * millisecondsPerHour;

export function formatToTimeAgo(date: Date | number): string {
  const millisecondsAgo = Date.now() - (typeof date === 'number' ? date : date.getTime());

  if (millisecondsAgo < millisecondsPerMinute) {
    return 'just now';
  }
  if (millisecondsAgo < millisecondsPerHour) {
    const minutesAgo = Math.floor(millisecondsAgo / millisecondsPerMinute);
    return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
  }
  if (millisecondsAgo < millisecondsPerDay) {
    const hoursAgo = Math.floor(millisecondsAgo / millisecondsPerHour);
    return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
  }
  const daysAgo = Math.floor(millisecondsAgo / millisecondsPerDay);
  return daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
}
