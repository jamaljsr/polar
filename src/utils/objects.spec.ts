/* eslint-disable @typescript-eslint/camelcase */
import { snakeKeysToCamel } from './objects';

describe('Objects Util', () => {
  it('should convert object keys to camel case', () => {
    const input = {
      prop_one_test: 1,
      another_prop: 2,
    };
    const expected = {
      propOneTest: 1,
      anotherProp: 2,
    };
    const actual = snakeKeysToCamel(input);
    expect(actual).toEqual(expected);
  });

  it('should handle nested objects', () => {
    const input = {
      prop_one_test: 1,
      another_prop: 2,
      nested_obj: {
        prop_three_test: 3,
      },
    };
    const expected = {
      propOneTest: 1,
      anotherProp: 2,
      nestedObj: {
        propThreeTest: 3,
      },
    };
    const actual = snakeKeysToCamel(input);
    expect(actual).toEqual(expected);
  });

  it('should handle a nested array of objects', () => {
    const input = {
      prop_one_test: 1,
      another_prop: 2,
      nested_obj: [
        {
          prop_three_test: 3,
        },
      ],
    };
    const expected = {
      propOneTest: 1,
      anotherProp: 2,
      nestedObj: [
        {
          propThreeTest: 3,
        },
      ],
    };
    const actual = snakeKeysToCamel(input);
    expect(actual).toEqual(expected);
  });
});
