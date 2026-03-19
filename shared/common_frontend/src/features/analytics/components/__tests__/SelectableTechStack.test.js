// 役割:
// - SelectableTechStackGrid/Listの動作検証用ユニットテスト
// - レンダリング、押下時の選択トグル、単一選択モードの挙動を確認
//
// 主要機能:
// - @testing-library/react-nativeでユーザー操作（press）をシミュレーション
// - THEMEをモック化し、スタイル依存を排除してロジック検証に集中
//
// ディレクトリ構造:
// - shared/common_frontend/src/features/analytics/components/__tests__/SelectableTechStack.test.js（本ファイル）
// - 対象: SelectableTechStackGrid.js / SelectableTechStackList.js（同ディレクトリ）
//
// 実行方法:
// - 例: npx jest shared/common_frontend/src/features/analytics/components/__tests__/SelectableTechStack.test.js
// - 前提: devDependenciesにjest・@testing-library/react-nativeがインストール済み
//
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('react-native', () => {
  return {
    StyleSheet: {
      create: (obj) => obj,
      flatten: (style) => style,
    },
    View: ({ children, ...props }) => <mock-View {...props}>{children}</mock-View>,
    Text: ({ children, ...props }) => <mock-Text {...props}>{children}</mock-Text>,
    TouchableOpacity: ({ children, ...props }) => <mock-TouchableOpacity {...props}>{children}</mock-TouchableOpacity>,
    ScrollView: ({ children, ...props }) => <mock-ScrollView {...props}>{children}</mock-ScrollView>,
    Platform: {
      OS: 'web',
      select: (obj) => (obj && Object.prototype.hasOwnProperty.call(obj, 'web') ? obj.web : obj?.default),
    },
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// Mock THEME
jest.mock('@shared/src/core/theme/theme', () => ({
  THEME: {
    text: '#000',
    subText: '#666',
    primary: '#007AFF',
    white: '#FFF',
    border: '#CCC',
    background: {
      secondary: '#F0F0F0'
    }
  }
}));

const { SelectableTechStackGrid } = require('../SelectableTechStackGrid');
const { SelectableTechStackList } = require('../SelectableTechStackList');

describe('SelectableTechStackGrid', () => {
  const mockItems = [
    { id: '1', label: 'React' },
    { id: '2', label: 'Vue' },
    { id: '3', label: 'Angular' }
  ];

  // すべての項目が描画されることを確認
  it('renders all items', () => {
    const { getByTestId } = render(
      <SelectableTechStackGrid 
        items={mockItems} 
        selectedItems={[]} 
        onSelectionChange={() => {}} 
        testID='grid'
      />
    );

    expect(getByTestId('grid_item_1')).toBeTruthy();
    expect(getByTestId('grid_item_2')).toBeTruthy();
    expect(getByTestId('grid_item_3')).toBeTruthy();
  });

  // 押下で選択ID配列が更新されることを確認（複数選択モード）
  it('calls onSelectionChange when an item is pressed', () => {
    const onSelectionChange = jest.fn();
    const { getByTestId } = render(
      <SelectableTechStackGrid 
        items={mockItems} 
        selectedItems={[]} 
        onSelectionChange={onSelectionChange} 
        testID='grid'
      />
    );

    fireEvent.press(getByTestId('grid_item_1'));
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });

  // 選択済み項目を再度押下すると解除されることを確認
  it('handles deselection', () => {
    const onSelectionChange = jest.fn();
    const { getByTestId } = render(
      <SelectableTechStackGrid 
        items={mockItems} 
        selectedItems={['1']} 
        onSelectionChange={onSelectionChange} 
        testID='grid'
      />
    );

    fireEvent.press(getByTestId('grid_item_1'));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  // 単一選択モードで他の項目を押下すると選択が置き換わることを確認
  it('supports single selection mode', () => {
    const onSelectionChange = jest.fn();
    const { getByTestId } = render(
      <SelectableTechStackGrid 
        items={mockItems} 
        selectedItems={['1']} 
        onSelectionChange={onSelectionChange}
        multiSelect={false}
        testID='grid'
      />
    );

    fireEvent.press(getByTestId('grid_item_2'));
    expect(onSelectionChange).toHaveBeenCalledWith(['2']);
  });
});

describe('SelectableTechStackList', () => {
  const mockItems = [
    { id: '1', label: 'Python' },
    { id: '2', label: 'Go' }
  ];

  // リスト項目が描画されることを確認
  it('renders list items', () => {
    const { getByTestId } = render(
      <SelectableTechStackList 
        items={mockItems} 
        selectedItems={[]} 
        onSelectionChange={() => {}} 
        testID='list'
      />
    );

    expect(getByTestId('list_item_1')).toBeTruthy();
    expect(getByTestId('list_item_2')).toBeTruthy();
  });

  // 押下で選択ID配列が更新されることを確認
  it('calls onSelectionChange when an item is pressed', () => {
    const onSelectionChange = jest.fn();
    const { getByTestId } = render(
      <SelectableTechStackList 
        items={mockItems} 
        selectedItems={[]} 
        onSelectionChange={onSelectionChange} 
        testID='list'
      />
    );

    fireEvent.press(getByTestId('list_item_1'));
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });
});
