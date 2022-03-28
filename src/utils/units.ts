import { Denomination } from './constants';

const decimals: { [key in Denomination]: number } = {
  [Denomination.SATOSHIS]: 0,
  [Denomination.BITCOIN]: 8,
};

// Remove trailing zeroes
function stripRightZeros(str: string) {
  const strippedStr = str.replace(/0+$/, '');
  return strippedStr === '' ? null : strippedStr;
}
function stripLeftZeros(str: string) {
  const strippedStr = str.replace(/^0+/, '');
  if (!strippedStr) {
    return '0';
  }
  return strippedStr;
}

/**
 * Adds comma's when necessary to large numbers
 * @param value the value to format
 */
export const format = (value: string | number): string => {
  if (!value) return value as string;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0' : num.toLocaleString('en-US');
};

/**
 * Convert from a value of satoshis to bitcoin
 * @param sats the value denominated in satoshis
 */
export const fromSats = (sats: string): string => {
  const dec = decimals[Denomination.BITCOIN];
  const paddedValue = sats.padStart(dec + 1, '0');
  const integerPart = stripLeftZeros(paddedValue.slice(0, -dec));
  const fractionPart = stripRightZeros(paddedValue.slice(-dec));
  return fractionPart ? `${integerPart}.${fractionPart}` : integerPart;
};

/**
 * Convert from a value of satoshis to a numeric value in bitcoins
 * @param sats the value denominated in sats
 */
export const fromSatsNumeric = (sats: string): number => {
  return parseFloat(fromSats(sats));
};

/**
 * Convert from a value of Bitcoin to satoshis
 * @param bitcoins the value denominated in whole bitcoins
 */
export const toSats = (bitcoins: string | number, formatted?: boolean): string => {
  const coins = typeof bitcoins === 'string' ? bitcoins : bitcoins.toFixed(8);
  const [integerPart, fractionPart = ''] = coins.split('.');
  const paddedFraction = fractionPart.padEnd(decimals[Denomination.BITCOIN], '0');
  const sats = stripLeftZeros(`${integerPart}${paddedFraction}`);
  return formatted ? format(sats) : sats;
};
