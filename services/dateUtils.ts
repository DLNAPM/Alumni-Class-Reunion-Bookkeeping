/**
 * Robust date formatting and parsing utilities to prevent UTC timezone shifts
 * (e.g. where "2026-08-24" in UTC midnight is displayed as "8/23/2026" in US timezones).
 */

/**
 * Returns today's date in local time as a YYYY-MM-DD string.
 */
export const getTodayLocalDateString = (): string => {
  const now = new Date();
  return formatLocalDateToYYYYMMDD(now);
};

/**
 * Formats any Date object to a YYYY-MM-DD string using local calendar methods.
 */
export const formatLocalDateToYYYYMMDD = (d: Date): string => {
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses any date representation (YYYY-MM-DD, timestamp, ISO string, etc.) into a local Date object.
 * If given a YYYY-MM-DD string, sets it to midday (12:00:00) local time to prevent any DST or timezone border crossing.
 */
export const parseLocalDate = (dateVal: string | number | Date | null | undefined): Date | null => {
  if (!dateVal) return null;

  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // Match YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }

    // Match MM/DD/YYYY or M/D/YYYY
    const usMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (usMatch) {
      const month = parseInt(usMatch[1], 10) - 1;
      const day = parseInt(usMatch[2], 10);
      const year = parseInt(usMatch[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }

    const fallbackDate = new Date(trimmed);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
  }

  return null;
};

/**
 * Formats a date string or object to a standard local display string (e.g., "8/24/2026")
 * with 100% protection against the previous-day UTC offset bug.
 */
export const formatDisplayDate = (dateVal: string | number | Date | null | undefined): string => {
  if (!dateVal) return '';

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      const year = parseInt(isoMatch[1], 10);
      return `${month}/${day}/${year}`;
    }
  }

  const parsed = parseLocalDate(dateVal);
  if (!parsed) return String(dateVal || '');
  return parsed.toLocaleDateString();
};

/**
 * Formats a date string or object into a long readable string (e.g., "August 24, 2026").
 */
export const formatReceiptDate = (
  dateVal: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string => {
  if (!dateVal) return '';
  const parsed = parseLocalDate(dateVal);
  if (!parsed) return String(dateVal || '');
  return parsed.toLocaleDateString('en-US', options);
};

/**
 * Extracts the 4-digit year as a string from any date string or Date object.
 */
export const getYearFromDateString = (dateVal: string | number | Date | null | undefined): string => {
  if (!dateVal) return new Date().getFullYear().toString();
  if (typeof dateVal === 'string') {
    const match = dateVal.trim().match(/^(\d{4})/);
    if (match) return match[1];
  }
  const parsed = parseLocalDate(dateVal);
  return parsed ? parsed.getFullYear().toString() : new Date().getFullYear().toString();
};

/**
 * Formats a date/time representation for Last Login display.
 * Returns formatted date and time (e.g. "8/26/2026, 1:24 PM") or "NA" if empty/never logged in.
 */
export const formatLastLoginDateTime = (dateVal: any): string => {
  if (!dateVal) return 'NA';

  let dateObj: Date | null = null;

  if (dateVal instanceof Date) {
    dateObj = isNaN(dateVal.getTime()) ? null : dateVal;
  } else if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    dateObj = isNaN(d.getTime()) ? null : d;
  } else if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') {
    try {
      dateObj = dateVal.toDate();
    } catch {
      dateObj = null;
    }
  } else if (typeof dateVal === 'object' && typeof dateVal.seconds === 'number') {
    dateObj = new Date(dateVal.seconds * 1000);
  } else if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed || trimmed.toUpperCase() === 'NA' || trimmed.toUpperCase() === 'N/A') {
      return 'NA';
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      dateObj = d;
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) return 'NA';

  const datePart = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timePart = `${hours}:${minutes} ${ampm}`;

  return `${datePart}, ${timePart}`;
};

