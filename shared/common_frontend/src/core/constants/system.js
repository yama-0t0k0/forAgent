/**
 * System-wide constants for the application.
 * Defines platform identifiers, data types, and status codes used across shared components.
 */

/**
 * Platform identifiers matching React Native's Platform.OS
 */
export const PLATFORM = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
  MACOS: 'macos',
  WINDOWS: 'windows'
};

/**
 * Standard JavaScript data types returned by typeof
 */
export const DATA_TYPE = {
  OBJECT: 'object',
  NUMBER: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
  UNDEFINED: 'undefined',
  FUNCTION: 'function',
  SYMBOL: 'symbol'
};

/**
 * Common UI Save/Async operation statuses
 */
export const SAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Special Field Names
 */
export const FIELD_NAMES = {
  DISPLAY_TYPE: '_displayType',
  ID: 'id'
};

/**
 * Special User IDs
 */
export const SYSTEM_USER_ID = 'C000000000000';

/**
 * ID Generation Constants
 */
export const ID_CONSTANTS = {
  SUFFIX_START: '0000',
  SUFFIX_END: '9999',
  DEFAULT_PREFIX_CHAR: 'C'
};

export const STRINGIFIED_OBJECT = '[object Object]';

export const MATCHING_TARGET_TYPE = {
    JD: 'jd',
    USER: 'user'
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
