export function getISODate(
  date: Date | string,
  options?: { timeZone: string },
): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: options?.timeZone ?? 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(new Date(date));
}
