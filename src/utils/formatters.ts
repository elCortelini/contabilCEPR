export function formatLocalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  
  // Extract YYYY-MM-DD from string without UTC timezone shift
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return dateStr;
  }
}

export function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
