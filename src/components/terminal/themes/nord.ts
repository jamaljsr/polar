import { ITheme } from 'xterm';

// Graciously ported from https://www.nordtheme.com
const colors = {
  nord0: '#2E3440',
  nord1: '#3B4252',
  nord2: '#434C5E',
  nord3: '#4C566A',
  nord4: '#D8DEE9',
  nord5: '#E5E9F0',
  nord6: '#ECEFF4',
  nord7: '#8FBCBB',
  nord8: '#88C0D0',
  nord9: '#81A1C1',
  nord10: '#5E81AC',
  nord11: '#BF616A',
  nord12: '#D08770',
  nord13: '#EBCB8B',
  nord14: '#A3BE8C',
  nord15: '#B48EAD',
};

const nord: ITheme = {
  /** The default foreground color */
  foreground: colors.nord4,
  /** The default background color */
  background: colors.nord0,
  /** The cursor color */
  cursor: colors.nord4,
  /** The accent color of the cursor (fg color for a block cursor) */
  cursorAccent: colors.nord3,
  /** The selection background color (can be transparent) */
  selection: colors.nord5 + '66',
  /** ANSI black (eg. `\x1b[30m`) */
  black: colors.nord1,
  /** ANSI red (eg. `\x1b[31m`) */
  red: colors.nord11,
  /** ANSI green (eg. `\x1b[32m`) */
  green: colors.nord14,
  /** ANSI yellow (eg. `\x1b[33m`) */
  yellow: colors.nord13,
  /** ANSI blue (eg. `\x1b[34m`) */
  blue: colors.nord9,
  /** ANSI magenta (eg. `\x1b[35m`) */
  magenta: colors.nord15,
  /** ANSI cyan (eg. `\x1b[36m`) */
  cyan: colors.nord8,
  /** ANSI white (eg. `\x1b[37m`) */
  white: colors.nord5,
  /** ANSI bright black (eg. `\x1b[1;30m`) */
  brightBlack: colors.nord3,
  /** ANSI bright red (eg. `\x1b[1;31m`) */
  brightRed: colors.nord11,
  /** ANSI bright green (eg. `\x1b[1;32m`) */
  brightGreen: colors.nord14,
  /** ANSI bright yellow (eg. `\x1b[1;33m`) */
  brightYellow: colors.nord13,
  /** ANSI bright blue (eg. `\x1b[1;34m`) */
  brightBlue: colors.nord9,
  /** ANSI bright magenta (eg. `\x1b[1;35m`) */
  brightMagenta: colors.nord15,
  /** ANSI bright cyan (eg. `\x1b[1;36m`) */
  brightCyan: colors.nord7,
  /** ANSI bright white (eg. `\x1b[1;37m`) */
  brightWhite: colors.nord6,
};

export default nord;
