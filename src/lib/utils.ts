import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseLocalDate(dateString: string): Date {
  // Validate date string format (YYYY-MM-DD)
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(); // Return current date as fallback
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return new Date(); // Return current date as fallback
  }
  
  return date;
}

/**
 * Calcula a data de uma semana específica do mês
 * @param year - Ano
 * @param month - Mês (1-12)
 * @param weekOfMonth - Qual semana (1-5)
 * @param dayOfWeek - Dia da semana (0=Domingo, 6=Sábado)
 * @returns Date ou null se não existir
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekOfMonth: number,
  dayOfWeek: number
): Date | null {
  // Primeiro dia do mês
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  // Calcular o primeiro dia da semana desejada
  let daysToAdd = dayOfWeek - firstDayOfWeek;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  // Adicionar semanas
  daysToAdd += (weekOfMonth - 1) * 7;
  
  const targetDate = new Date(year, month - 1, 1 + daysToAdd);
  
  // Verificar se ainda está no mesmo mês
  if (targetDate.getMonth() !== month - 1) {
    return null;
  }
  
  return targetDate;
}
