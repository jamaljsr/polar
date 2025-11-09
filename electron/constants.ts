import isNotPackaged from 'electron-is-dev';
import { join } from 'path';

export const IS_DEV = isNotPackaged && process.env.NODE_ENV !== 'production';

// MCP HTTP bridge server port. Can be overridden with POLAR_MCP_PORT environment var
export const MCP_PORT = parseInt(process.env.POLAR_MCP_PORT || '37373', 10);

const APP_ROOT_DEV = join(__dirname, '..');
const APP_ROOT_PROD = join(__dirname, '..', '..', '..');
export const APP_ROOT = IS_DEV ? APP_ROOT_DEV : APP_ROOT_PROD;

const BASE_URL_DEV = 'http://localhost:3000';
const BASE_URL_PROD = `file://${join(APP_ROOT, 'build', 'index.html')}`;
export const BASE_URL = IS_DEV ? BASE_URL_DEV : BASE_URL_PROD;
