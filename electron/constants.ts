import isNotPackaged from 'electron-is-dev';
import { join } from 'path';

export const IS_DEV = isNotPackaged && process.env.NODE_ENV !== 'production';

export const BASE_URL_DEV = 'http://localhost:3000';
export const BASE_URL_PROD = `file://${join(__dirname, '../../../build/index.html')}`;
export const BASE_URL = IS_DEV ? BASE_URL_DEV : BASE_URL_PROD;
