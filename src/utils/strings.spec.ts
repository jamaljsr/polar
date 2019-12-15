import { ellipseInner, isVersionCompatible } from './strings';

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

  describe('isVersionCompatible', () => {
    it('should return true for compatible versions', () => {
      expect(isVersionCompatible('0.18.1', '0.18.1')).toBe(true);
      expect(isVersionCompatible('0.18.0', '0.18.1')).toBe(true);
      expect(isVersionCompatible('0.17.0', '0.18.1')).toBe(true);
      expect(isVersionCompatible('0.17.2', '0.18.1')).toBe(true);
      expect(isVersionCompatible('0.18.0.1', '0.18.1')).toBe(true);
    });

    it('should return false for incompatible versions', () => {
      expect(isVersionCompatible('0.19.0', '0.18.1')).toBe(false);
      expect(isVersionCompatible('0.18.2', '0.18.1')).toBe(false);
      expect(isVersionCompatible('1.18.1', '0.18.1')).toBe(false);
      expect(isVersionCompatible('0.18.1.1', '0.18.1')).toBe(false);
      expect(isVersionCompatible('0.19.0.1', '0.18.1')).toBe(false);
    });

    it('should return false for garbage input', () => {
      expect(isVersionCompatible('123', '0.18.1')).toBe(false);
      expect(isVersionCompatible('asdf', '0.18.1')).toBe(false);
      expect(isVersionCompatible('', '0.18.1')).toBe(false);
      expect(isVersionCompatible('0.18.asds', '0.18.1')).toBe(false);
      expect(isVersionCompatible('asf.18.0', '0.18.1')).toBe(false);
      expect(isVersionCompatible(undefined as any, '0.18.1')).toBe(false);
    });
  });
});
