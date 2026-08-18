import {
  createTime24,
  isChronologicalTimeRange,
  isTime24,
  parseTime24,
  time24ToMinutes,
} from './time-24';

describe('Time24', () => {
  it.each(['00:00', '08:05', '15:30', '23:59'])(
    'accepts %s as a European 24-hour time',
    (value) => {
      expect(isTime24(value)).toBe(true);
      expect(parseTime24(value)).toBe(value);
    },
  );

  it.each(['', '9:30', '09:60', '24:00', '12:00 AM', '12:00 PM'])('rejects %s', (value) => {
    expect(isTime24(value)).toBe(false);
    expect(parseTime24(value)).toBeNull();
  });

  it('throws when a caller tries to construct an invalid time', () => {
    expect(() => createTime24('25:00')).toThrow(RangeError);
  });

  it('converts and compares times without locale-dependent parsing', () => {
    const breakfastStart = createTime24('08:00');
    const breakfastEnd = createTime24('10:30');

    expect(time24ToMinutes(breakfastStart)).toBe(480);
    expect(isChronologicalTimeRange(breakfastStart, breakfastEnd)).toBe(true);
    expect(isChronologicalTimeRange(breakfastEnd, breakfastStart)).toBe(false);
  });
});
