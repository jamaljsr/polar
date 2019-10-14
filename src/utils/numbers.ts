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
