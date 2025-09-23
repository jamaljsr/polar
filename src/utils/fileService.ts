// src/utils/fileService.ts
// Abstract file service for production and test environments

export const fileService = {
  existsSync: (path: string) => {
    if (typeof window !== 'undefined' && window.require) {
      return window.require('fs').existsSync(path);
    }
    return false;
  },
  readFileSync: (path: string, encoding: string) => {
    if (typeof window !== 'undefined' && window.require) {
      return window.require('fs').readFileSync(path, encoding);
    }
    return '';
  },
  copyFileSync: (src: string, dest: string) => {
    if (typeof window !== 'undefined' && window.require) {
      return window.require('fs').copyFileSync(src, dest);
    }
  },
};
