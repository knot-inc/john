'use client';
import React, { createContext, useState, useContext, ReactNode } from 'react';

import { JsonResult } from '@/types/jsonResultTypes';

interface AppContextType {
  jsonResult: JsonResult | null;
  setJsonResult: React.Dispatch<React.SetStateAction<JsonResult | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [jsonResult, setJsonResult] = useState<JsonResult | null>(null);

  return (
    <AppContext.Provider value={{ jsonResult, setJsonResult }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
