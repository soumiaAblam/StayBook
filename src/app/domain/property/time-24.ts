declare const time24Brand: unique symbol;

export type Time24 = string & { readonly [time24Brand]: 'Time24' };

export const TIME_24_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isTime24(value: unknown): value is Time24 {
  return typeof value === 'string' && TIME_24_PATTERN.test(value);
}

export function parseTime24(value: unknown): Time24 | null {
  return isTime24(value) ? value : null;
}

export function createTime24(value: string): Time24 {
  if (!isTime24(value)) {
    throw new RangeError(`Invalid 24-hour time: ${value}`);
  }

  return value;
}

export function time24ToMinutes(value: Time24): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isChronologicalTimeRange(start: Time24, end: Time24): boolean {
  return time24ToMinutes(start) < time24ToMinutes(end);
}
