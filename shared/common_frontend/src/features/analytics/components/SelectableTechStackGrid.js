// 役割:
// - 技術スタックの選択用バッジグリッドコンポーネント
// - 複数/単一選択を切替可能、アイコン表示、選択状態の視覚化
//
// 主要機能:
// - items（候補）とselectedItems（選択済みID配列）を受け取り、押下で選択状態を更新
// - multiSelect=true/falseで複数選択/単一選択に対応
// - THEMEに基づくスタイル適用、選択時の強調表示（色・チェックアイコン）
//
// ディレクトリ構造:
// - shared/common_frontend/src/features/analytics/components/SelectableTechStackGrid.js（本ファイル）
// - 依存: @shared/src/core/theme/theme（テーマ）, @expo/vector-icons（アイコン）
// - 関連: SelectableTechStackList（リスト版）, TechStackView（表示用）
//
// デプロイ・実行方法:
// - 開発実行（例）: bash scripts/start_expo.sh individual_user_app（個人アプリ）
// - 他: start:corporate, start:adminなどmonorepoのscriptを使用可能
// - テスト（例）: npx jest shared/common_frontend/src/features/analytics/components/__tests__/SelectableTechStack.test.js
// - 前提: Node.js, Expo環境、jest（devDependenciesに定義）をインストール済みであること
//
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * @typedef {Object} TechStackItem
 * @property {string} id - Unique identifier
 * @property {string} label - Display label
 * @property {string} [icon] - Optional icon name
 */

/**
 * @typedef {Object} SelectableTechStackGridProps
 * @property {TechStackItem[]} items - List of items to display
 * @property {string[]} selectedItems - Array of selected item IDs
 * @property {function(string[]): void} onSelectionChange - Callback when selection changes
 * @property {boolean} [multiSelect=true] - Whether multiple items can be selected
 * @property {string} [testID] - Test ID for the container
 */

/**
 * A grid of selectable tech stack badges.
 * @param {SelectableTechStackGridProps} props
 */
export const SelectableTechStackGrid = ({
    items,
    selectedItems = [],
    onSelectionChange,
    multiSelect = true,
    testID
}) => {
    // 押下時の選択トグル処理
    // - multiSelect=true: 追加/削除で配列を更新
    // - multiSelect=false: 同一IDなら解除、異なるIDなら置き換え
    const handlePress = useCallback((id) => {
        let newSelected = [];
        if (multiSelect) {
            if (selectedItems.includes(id)) {
                newSelected = selectedItems.filter(item => item !== id);
            } else {
                newSelected = [...selectedItems, id];
            }
        } else {
            // Single select: toggle off if same, otherwise switch
            if (selectedItems.includes(id)) {
                newSelected = [];
            } else {
                newSelected = [id];
            }
        }
        onSelectionChange(newSelected);
    }, [selectedItems, multiSelect, onSelectionChange]);

    // グリッド状にバッジを並べ、選択状態に応じてスタイル切り替え
    return (
        <View style={styles.container} testID={testID}>
            {items.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.badge,
                            isSelected ? styles.badgeSelected : styles.badgeUnselected
                        ]}
                        onPress={() => handlePress(item.id)}
                        activeOpacity={0.7}
                        testID={`${testID}_item_${item.id}`}
                    >
                        {item.icon && (
                            <Ionicons 
                                name={item.icon} 
                                size={14} 
                                color={isSelected ? THEME.primary : THEME.textSecondary} 
                                style={styles.icon}
                            />
                        )}
                        <Text style={[
                            styles.label,
                            isSelected ? styles.labelSelected : styles.labelUnselected
                        ]}>
                            {item.label}
                        </Text>
                        {isSelected && (
                            <Ionicons 
                                name='checkmark-circle' 
                                size={14} 
                                color={THEME.primary} 
                                style={styles.checkIcon}
                            />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    badgeUnselected: {
        backgroundColor: THEME.background,
        borderColor: THEME.borderDefault,
    },
    badgeSelected: {
        backgroundColor: THEME.surfaceInfo,
        borderColor: THEME.primary,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
    },
    labelUnselected: {
        color: THEME.textSecondary,
    },
    labelSelected: {
        color: THEME.primary,
        fontWeight: '600',
    },
    icon: {
        marginRight: 4,
    },
    checkIcon: {
        marginLeft: 4,
    }
});
