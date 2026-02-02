import React, { createContext, useState, useCallback } from 'react';
import { DATA_TYPE } from '@shared/src/core/constants/system';

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
  // Use initialData directly without JSON serialization to preserve Model instances
  const [data, setData] = useState(initialData || {});

  React.useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  /**
   * Updates a value at the specified path in the data object.
   * Uses prototype-preserving shallow copy to maintain Model instances.
   * @param {string[]} path - The path to the value.
   * @param {any} newValue - The new value.
   */
  const updateValue = useCallback((path, newValue) => {
    setData((prevData) => {
      /**
       * Helper to shallow clone while preserving prototype (for Models)
       * @param {Object} obj - Object to clone
       * @returns {Object} Cloned object
       */
      const shallowClone = (obj) => {
        if (obj === null || typeof obj !== DATA_TYPE.OBJECT) return obj;
        if (Array.isArray(obj)) return [...obj];
        const clone = Object.create(Object.getPrototypeOf(obj));
        return Object.assign(clone, obj);
      };

      const newData = shallowClone(prevData);
      let current = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        // Clone the next level
        current[key] = shallowClone(current[key] || {});
        current = current[key];
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
