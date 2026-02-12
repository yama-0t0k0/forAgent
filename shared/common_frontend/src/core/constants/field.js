/**
 * フィールド関連の定数定義
 * Field related constants
 */

export const FIELD_META = {
    DISPLAY_TYPE: '_displayType'
};

export const FIELD_DISPLAY_TYPE = {
    SKILL_LEVEL_SELECT: 'skillLevelSelect',
    SINGLE_SELECT_GROUP: 'singleSelectGroup',
    CONNECTION_LEVEL_SELECT: 'connectionLevelSelect',
    MONTH_YEAR_PICKER: 'monthYearPicker',
    DATE_PICKER: 'datePicker',
    READ_ONLY_STATUS: 'readOnlyStatus'
};

export const PICKER_EVENT_TYPE = {
    DISMISSED: 'dismissed',
    SET: 'set'
};

export const DATE_CONSTRAINTS = {
    MIN_YEAR: 1900,
    MAX_YEAR: 2100,
    DEFAULT_YEAR: 1990,
    DEFAULT_YEAR_MONTH: 2020,
    MONTHS_IN_YEAR: 12,
    DEFAULT_YYYYMM: 202001,
    DEFAULT_YYYYMMDD: 19900101,
    MIN_DAY: 1,
    MAX_DAY: 31
};

export const INPUT_LABELS = {
    ZIP_CODE: '郵便番号'
};

export const ZIP_CODE_CONFIG = {
    LENGTH: 7
};

export const COUNTRY = {
    JAPAN: '日本'
};
