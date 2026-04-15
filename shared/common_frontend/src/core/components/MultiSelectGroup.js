// 役割（機能概要）:
// - 複数選択（チェックボックス相当）UIを提供する汎用コンポーネント
// - DataContext の updateValue を使い、指定パスの boolean 値群を更新
// - RecursiveField / PureRecursiveField からの表示タイプとして再利用される想定
// - React Native の Switch を用いて簡易に複数選択を表現
//
// ディレクトリ構造:
// - shared/common_frontend/src/core/components/MultiSelectGroup.js (本ファイル)
// - 依存: shared/common_frontend/src/core/state/DataContext.js
// - 依存: shared/common_frontend/src/core/theme/theme.js
// - 関連: shared/common_frontend/src/core/components/SingleSelectGroup.js
//
// デプロイ・実行方法:
// - 各 Expo アプリから import して利用
// - ローカル起動: bash scripts/start_expo.sh <app_name>

import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { DATA_TYPE } from '@shared/src/core/constants/system';
import { FIELD_META } from '@shared/src/core/constants/index';

/**
 * @typedef {Object} MultiSelectGroupProps
 * @property {Object} value - Current value object (keys are options)
 * @property {string[]} path - Data path for context update
 */

/**
 * Multi Select Group Component.
 * Allows multiple boolean options to be enabled at once.
 * @param {MultiSelectGroupProps} props
 * @param {Object} props.value - Current value object (keys are options)
 * @param {string[]} props.path - Data path for context update
 * @returns {JSX.Element}
 */
export const MultiSelectGroup = ({ value, path }) => {
    const { updateValue } = useContext(DataContext);

    /**
     * @param {string} key
     * @returns {void}
     */
    const handleToggle = (key) => {
        const nextObject = { ...value };
        if (typeof nextObject[key] !== DATA_TYPE.BOOLEAN) return;
        nextObject[key] = !nextObject[key];
        updateValue(path, nextObject);
    };

    return (
        <View>
            {Object.keys(value).map((key) => {
                if (key === FIELD_META.DISPLAY_TYPE) return null;
                if (typeof value[key] !== DATA_TYPE.BOOLEAN) return null;

                return (
                    <View key={key} style={styles.switchContainer}>
                        <Text style={styles.label}>{key}</Text>
                        <Switch
                            trackColor={{ false: THEME.borderDefault, true: THEME.primary }}
                            thumbColor={THEME.textInverse}
                            onValueChange={() => handleToggle(key)}
                            value={!!value[key]}
                        />
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: THEME.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderDefault,
    },
    label: {
        ...THEME.typography.bodySmall,
        color: THEME.textSecondary,
        marginBottom: THEME.spacing.xs,
        fontWeight: '500',
    },
});

