import os from 'os';
import { normalizePlatform } from './system';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;

describe('System Util', () => {
  it('should return the correct platform on mac', () => {
    mockOS.platform.mockReturnValue('darwin');
    expect(normalizePlatform()).toBe('mac');
  });

  it('should return the correct platform on windows', () => {
    mockOS.platform.mockReturnValue('win32');
    expect(normalizePlatform()).toBe('windows');
  });

  it('should return the correct platform on linux', () => {
    mockOS.platform.mockReturnValue('linux');
    expect(normalizePlatform()).toBe('linux');
  });

  it('should return unknown platform for others', () => {
    const others: NodeJS.Platform[] = [
      'aix',
      'android',
      'freebsd',
      'openbsd',
      'sunos',
      'cygwin',
      'netbsd',
    ];
    others.forEach(platform => {
      mockOS.platform.mockReturnValue(platform);
      expect(normalizePlatform()).toBe('unknown');
    });
  });
});
