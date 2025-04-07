import { abbreviate, formatDecimals } from './numbers';

const baseNumbers = [9, 15, 248, 826, 999];

describe('Numbers Util', () => {
  it('should not abbreviate values less than 1000', () => {
    const expected = ['9', '15', '248', '826', '999'];
    for (let i = 0; i < baseNumbers.length; i++) {
      expect(abbreviate(baseNumbers[i])).toBe(expected[i]);
    }
  });

  it('should add k for numbers in the thousands', () => {
    const expected = ['9.0k', '15.0k', '248.0k', '826.0k', '999.0k'];
    const multiplier = 1000;
    for (let i = 0; i < baseNumbers.length; i++) {
      const result = abbreviate(baseNumbers[i] * multiplier);
      expect(result).toBe(expected[i]);
    }
  });

  it('should add M for numbers in the millions', () => {
    const expected = ['9.0M', '15.0M', '248.0M', '826.0M', '999.0M'];
    const multiplier = 1000000;
    for (let i = 0; i < baseNumbers.length; i++) {
      const result = abbreviate(baseNumbers[i] * multiplier);
      expect(result).toBe(expected[i]);
    }
  });

  it('should add B for numbers in the millions', () => {
    const expected = ['9.0B', '15.0B', '248.0B', '826.0B', '999.0B'];
    const multiplier = 1000000000;
    for (let i = 0; i < baseNumbers.length; i++) {
      const result = abbreviate(baseNumbers[i] * multiplier);
      expect(result).toBe(expected[i]);
    }
  });

  it('should format decimals', () => {
    expect(formatDecimals(100000, 2)).toBe('1,000.00');
    expect(formatDecimals(100000, 0)).toBe('100,000');
    expect(formatDecimals(undefined, 2)).toBe('');

    expect(formatDecimals(12345678, 0)).toBe('12,345,678');
    expect(formatDecimals(12345678, 1)).toBe('1,234,567.8');
    expect(formatDecimals(12345678, 2)).toBe('123,456.78');
    expect(formatDecimals(12345678, 3)).toBe('12,345.678');
    expect(formatDecimals(12345678, 4)).toBe('1,234.5678');
    expect(formatDecimals(12345678, 5)).toBe('123.45678');
    expect(formatDecimals(12345678, 6)).toBe('12.345678');
    expect(formatDecimals(12345678, 7)).toBe('1.2345678');
    expect(formatDecimals(12345678, 8)).toBe('0.12345678');
  });
});
