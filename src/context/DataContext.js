import React, { createContext, useState, useCallback } from 'react';

export const DataContext = createContext(null);

export const DataProvider = ({ children, initialData }) => {
  // Load data from file directly via require, and deep copy to ensure no reference issues
  const [data, setData] = useState(initialData ? JSON.parse(JSON.stringify(initialData)) : {});

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
