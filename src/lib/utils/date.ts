export const MONTH_NAMES: { [key: string]: string } = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

export function getMonthName(monthStr: string | number): string {
  const pad = String(monthStr).padStart(2, "0");
  return MONTH_NAMES[pad] || "";
}

export function formatPeriod(year: string | number, month: string | number): string {
  const mName = getMonthName(month);
  return `${mName} ${year}`;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    const mName = getMonthName(month).slice(0, 3);
    return `${day} ${mName} ${year}`;
  } catch {
    return dateStr;
  }
}
