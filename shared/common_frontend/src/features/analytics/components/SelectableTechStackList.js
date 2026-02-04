// 役割:
// - 技術スタックの選択用リストコンポーネント（縦方向）
// - ラベル・説明文・アイコン表示、チェックボックスで選択状態を可視化
//
// 主要機能:
// - items（候補）とselectedItems（選択済みID配列）を管理
// - multiSelect=true/falseで複数/単一選択に対応
// - THEMEに基づいた色・余白・罫線のスタイル適用
//
// ディレクトリ構造:
// - shared/common_frontend/src/features/analytics/components/SelectableTechStackList.js（本ファイル）
// - 依存: @shared/src/core/theme/theme, @expo/vector-icons
// - 関連: SelectableTechStackGrid（グリッド版）, TechStackView（表示用）
//
// デプロイ・実行方法:
// - 開発実行（例）: bash scripts/start_expo.sh individual_user_app（個人アプリ）
// - 他アプリもscripts/start_expo.sh経由で起動可能（corporate, admin等）
// - テスト（例）: npx jest shared/common_frontend/src/features/analytics/components/__tests__/SelectableTechStack.test.js
// - 前提: Node.js, Expo環境、jestが利用可能であること
//
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * @typedef {Object} TechStackItem
 * @property {string} id - Unique identifier
 * @property {string} label - Display label
 * @property {string} [description] - Optional description
 * @property {string} [icon] - Optional icon name
 */

/**
 * @typedef {Object} SelectableTechStackListProps
 * @property {TechStackItem[]} items - List of items to display
 * @property {string[]} selectedItems - Array of selected item IDs
 * @property {function(string[]): void} onSelectionChange - Callback when selection changes
 * @property {boolean} [multiSelect=true] - Whether multiple items can be selected
 * @property {string} [testID] - Test ID for the container
 */

/**
 * A vertical list of selectable tech stack items.
 * @param {SelectableTechStackListProps} props
 */
export const SelectableTechStackList = ({
    items,
    selectedItems = [],
    onSelectionChange,
    multiSelect = true,
    testID
}) => {
    // 押下時の選択トグル処理（グリッド版と同じロジック）
    const handlePress = useCallback((id) => {
        let newSelected = [];
        if (multiSelect) {
            if (selectedItems.includes(id)) {
                newSelected = selectedItems.filter(item => item !== id);
            } else {
                newSelected = [...selectedItems, id];
            }
        } else {
            if (selectedItems.includes(id)) {
                newSelected = [];
            } else {
                newSelected = [id];
            }
        }
        onSelectionChange(newSelected);
    }, [selectedItems, multiSelect, onSelectionChange]);

    // 縦方向の行レイアウト。右端にチェックボックスを配置して選択状態を明確化
    return (
        <View style={styles.container} testID={testID}>
            {items.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.itemContainer,
                            isSelected && styles.itemSelected
                        ]}
                        onPress={() => handlePress(item.id)}
                        activeOpacity={0.7}
                        testID={`${testID}_item_${item.id}`}
                    >
                        <View style={styles.contentContainer}>
                            <View style={styles.headerRow}>
                                {item.icon && (
                                    <Ionicons 
                                        name={item.icon} 
                                        size={18} 
                                        color={isSelected ? THEME.primary : THEME.subText} 
                                        style={styles.icon}
                                    />
                                )}
                                <Text style={[
                                    styles.label,
                                    isSelected && styles.labelSelected
                                ]}>
                                    {item.label}
                                </Text>
                            </View>
                            {item.description && (
                                <Text style={styles.description} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            )}
                        </View>
                        
                        <View style={[
                            styles.checkbox,
                            isSelected ? styles.checkboxSelected : styles.checkboxUnselected
                        ]}>
                            {isSelected && (
                                <Ionicons name='checkmark' size={14} color={THEME.white} />
                            )}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        width: '100%',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border || '#E2E8F0',
        backgroundColor: THEME.white || '#FFFFFF',
    },
    itemSelected: {
        backgroundColor: '#F0F9FF', // Very light blue
    },
    contentContainer: {
        flex: 1,
        marginRight: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    icon: {
        marginRight: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        color: THEME.text || '#1E293B',
    },
    labelSelected: {
        color: THEME.primary || '#0369A1',
        fontWeight: '600',
    },
    description: {
        fontSize: 12,
        color: THEME.subText || '#64748B',
        marginTop: 2,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxUnselected: {
        borderColor: THEME.subText || '#94A3B8',
        backgroundColor: 'transparent',
    },
    checkboxSelected: {
        borderColor: THEME.primary || '#0369A1',
        backgroundColor: THEME.primary || '#0369A1',
    },
});
