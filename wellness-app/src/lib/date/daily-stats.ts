export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function dateKeyToPrismaDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function dateKeyToLocalDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = dateKeyToPrismaDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function prismaDateToDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
