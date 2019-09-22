import { ellipseInner } from './strings';

describe('strings util', () => {
  describe('ellipseInner', () => {
    it('should ellipse valid text', () => {
      expect(ellipseInner('xxxxxxyyyyzzzzzz')).toEqual('xxxxxx...zzzzzz');
      expect(ellipseInner('xxxxyyyyzzzz', 4)).toEqual('xxxx...zzzz');
      expect(ellipseInner('xxyyyyzz', 2)).toEqual('xx...zz');
    });

    it('should do nothing with short text', () => {
      expect(ellipseInner('abcdef')).toEqual('abcdef');
      expect(ellipseInner('abcdef', 3)).toEqual('abcdef');
    });

    it('should keep 6 chars with invalid value provided', () => {
      expect(ellipseInner('xxxxxxyyyyzzzzzz', 0)).toEqual('xxxxxx...zzzzzz');
      expect(ellipseInner('xxxxxxyyyyzzzzzz', -1)).toEqual('xxxxxx...zzzzzz');
      expect(ellipseInner('xxxxxxyyyyzzzzzz', NaN)).toEqual('xxxxxx...zzzzzz');
      expect(ellipseInner('xxxxxxyyyyzzzzzz', (undefined as unknown) as number)).toEqual(
        'xxxxxx...zzzzzz',
      );
    });

    it('should handle empty text', () => {
      expect(ellipseInner((undefined as unknown) as string)).toBeUndefined();
      expect(ellipseInner((null as unknown) as string)).toBeNull();
      expect(ellipseInner('')).toEqual('');
    });
  });
});
