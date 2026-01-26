import React, { createContext, useState, useCallback } from 'react';

/**
 * アプリケーション全体で共有するデータコンテキスト
 * @type {React.Context<{data: Object, updateValue: (path: Array<string>, newValue: any) => void}>}
 */
export const DataContext = createContext(null);

/**
 * データプロバイダーコンポーネント
 * アプリケーションの状態管理を提供します。
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children 子コンポーネント
 * @param {Object} [props.initialData] 初期データ
 * @returns {JSX.Element}
 */
export const DataProvider = ({ children, initialData }) => {
  // Use useEffect to update state when initialData changes
  const [data, setData] = useState(initialData ? JSON.parse(JSON.stringify(initialData)) : {});

  React.useEffect(() => {
    if (initialData) {
      setData(JSON.parse(JSON.stringify(initialData)));
    }
  }, [initialData]);

  const updateValue = useCallback((path, newValue) => {
    setData((prevData) => {
      const newData = JSON.parse(JSON.stringify(prevData));
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = newValue;
      return newData;
    });
  }, []);

  return (
    <DataContext.Provider value={{ data, updateValue }}>
      {children}
    </DataContext.Provider>
  );
};
