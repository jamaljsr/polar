import os from 'os';
import { getPolarPlatform, isLinux, isMac, isWindows } from './system';

jest.mock('os');

const mockOS = os as jest.Mocked<typeof os>;

describe('System Util', () => {
  it('should return the correct platform on mac', () => {
    mockOS.platform.mockReturnValue('darwin');
    expect(getPolarPlatform()).toBe('mac');
  });

  it('should return the correct platform on windows', () => {
    mockOS.platform.mockReturnValue('win32');
    expect(getPolarPlatform()).toBe('windows');
  });

  it('should return the correct platform on linux', () => {
    mockOS.platform.mockReturnValue('linux');
    expect(getPolarPlatform()).toBe('linux');
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
      expect(getPolarPlatform()).toBe('unknown');
    });
  });

  it('should return correct isMac value', () => {
    mockOS.platform.mockReturnValue('aix');
    expect(isMac()).toBe(false);
    mockOS.platform.mockReturnValue('darwin');
    expect(isMac()).toBe(true);
  });

  it('should return correct isWindows value', () => {
    mockOS.platform.mockReturnValue('aix');
    expect(isWindows()).toBe(false);
    mockOS.platform.mockReturnValue('win32');
    expect(isWindows()).toBe(true);
  });

  it('should return correct isLinux value', () => {
    mockOS.platform.mockReturnValue('aix');
    expect(isLinux()).toBe(false);
    mockOS.platform.mockReturnValue('linux');
    expect(isLinux()).toBe(true);
  });
});
