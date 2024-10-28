/**
 * Given a number, this function will return an array of numbers
 * starting at 0 and ending at count - 1
 * @param count the number items to include in the array
 */
export const range = (count: number): ReadonlyArray<number> => {
  // this is so ugly, it needs to be buried in a util function :(
  // - Array<number>(5) returns an array of length 5 with all null values
  // - keys() returns an IterableIterator of the numbers 1,2,3,4,5 but it
  //   doesn't have the standard array functions like map, forEach, etc.
  // we must use the spread operator to copy those values into a normal array.
  return [...Array<number>(count).keys()];
};

const suffixes = ['', 'k', 'M', 'B', 'T', 'P', 'E'];
/**
 * Abbreviates a number into shortened form
 * @param value the number to abbreviate
 */
export const abbreviate = (value: number | string): string => {
  const num = typeof value === 'string' ? parseInt(value) : value;
  // what tier? (determines SI symbol)
  const tier = (Math.log10(num) / 3) | 0;

  // if zero, we don't need a suffix
  if (tier === 0) return num.toString();

  // get suffix and determine scale
  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);

  // scale the value
  const scaled = num / scale;

  // format value and add suffix
  return scaled.toFixed(1) + suffix;
};

export const formatDecimals = (value: number | undefined, decimals: number) => {
  if (typeof value === 'undefined') return '';

  const scaled = value / 10 ** decimals;

  const formatter = new Intl.NumberFormat('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(scaled);
};
