import {
  compareVersions,
  ellipseInner,
  formatP2PHost,
  isVersionCompatible,
} from './strings';

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
      expect(ellipseInner('xxxxxxyyyyzzzzzz', undefined as unknown as number)).toEqual(
        'xxxxxx...zzzzzz',
      );
    });

    it('should handle empty text', () => {
      expect(ellipseInner(undefined as unknown as string)).toBeUndefined();
      expect(ellipseInner(null as unknown as string)).toBeNull();
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
      expect(isVersionCompatible('0.7.1-beta', '0.16.0-beta')).toBe(true);
    });

    it('should return false for incompatible versions', () => {
      expect(isVersionCompatible('0.19.0', '0.18.1')).toBe(false);
      expect(isVersionCompatible('0.18.2', '0.18.1')).toBe(false);
      expect(isVersionCompatible('1.18.1', '0.18.1')).toBe(false);
      expect(isVersionCompatible('0.18.1.1', '0.18.1')).toBe(false);
      expect(isVersionCompatible('0.19.0.1', '0.18.1')).toBe(false);
      expect(isVersionCompatible('0.17.1-beta', '0.6.0-beta')).toBe(false);
    });

    it('should handle garbage input', () => {
      expect(isVersionCompatible('123', '0.18.1')).toBe(false);
      expect(isVersionCompatible('asdf', 'xyz')).toBe(true);
      expect(isVersionCompatible('', '0.18.1')).toBe(true);
      expect(isVersionCompatible(undefined as any, '0.18.1')).toBe(true);
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('0.18.1', '0.18.1')).toBe(0);
      expect(compareVersions('0.18.0', '0.18.0')).toBe(0);
      expect(compareVersions('0.17.0', '0.17.0')).toBe(0);
      expect(compareVersions('0.17.2', '0.17.2')).toBe(0);
    });

    it('should return 1 for higher versions', () => {
      expect(compareVersions('0.19.0', '0.18.1')).toBe(1);
      expect(compareVersions('0.18.2', '0.18.1')).toBe(1);
      expect(compareVersions('1.18.1', '0.18.1')).toBe(1);
      expect(compareVersions('1.18.1.1', '0.18.1')).toBe(1);
      expect(compareVersions('0.17.1-beta.rc1', '0.17.1-beta')).toBe(1);
    });

    it('should return -1 for lower versions', () => {
      expect(compareVersions('0.17.0', '0.18.1')).toBe(-1);
      expect(compareVersions('0.7.2', '0.18.1')).toBe(-1);
      expect(compareVersions('1.17.1', '1.18.1')).toBe(-1);
      expect(compareVersions('1.17.1.1', '1.18.1')).toBe(-1);
      expect(compareVersions('0.7.1-beta', '0.16.0-beta')).toBe(-1);
      expect(compareVersions('0.17.1-beta', '0.17.1-beta.rc1')).toBe(-1);
    });

    it('should return 0 for garbage input', () => {
      expect(compareVersions('asdf', 'xyz')).toBe(0);
      expect(compareVersions('', '0.18.1')).toBe(0);
      expect(compareVersions(undefined as any, '0.18.1')).toBe(0);
      expect(compareVersions('0.18.1', undefined as any)).toBe(0);
    });

    it('should handle pre-release tags', () => {
      expect(compareVersions('0.18.1-beta', '0.18.1-alpha')).toBe(0);
      expect(compareVersions('0.18.1-beta', '0.18.1-beta')).toBe(0);
      expect(compareVersions('0.18.1-beta', '0.18.1-beta.rc1')).toBe(-1);
      expect(compareVersions('0.18.1-beta.rc2', '0.18.1-beta.rc1')).toBe(1);
      expect(compareVersions('0.18.2-beta', '0.18.1-beta.rc1')).toBe(1);
    });
  });

  describe('formatP2PHost', () => {
    it('should return clearnet hosts unchanged', () => {
      expect(formatP2PHost('tcp://127.0.0.1:8333')).toEqual('tcp://127.0.0.1:8333');
      expect(formatP2PHost('192.168.1.10:18444')).toEqual('192.168.1.10:18444');
    });

    it('should ellipse tor (.onion) hosts', () => {
      const onion = 'abcdef1234567890abcdef1234567890abcdef1234567890.onion:8333';
      expect(formatP2PHost(onion)).toEqual(ellipseInner(onion, 3, 17));
    });

    it('should do nothing with short tor hosts', () => {
      const shortOnion = 'abcd.onion:8333';
      expect(formatP2PHost(shortOnion)).toEqual(shortOnion);
    });

    it('should handle empty or invalid input', () => {
      expect(formatP2PHost(undefined)).toBeUndefined();
      expect(formatP2PHost(null as unknown as string)).toBeNull();
      expect(formatP2PHost('')).toEqual('');
    });
  });
});
