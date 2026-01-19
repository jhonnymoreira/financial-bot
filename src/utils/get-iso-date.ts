export function getISODate(
  date: Date | string,
  options: { timeZone: string | undefined } = { timeZone: 'America/Sao_Paulo' },
): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: options.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(new Date(date));
}
