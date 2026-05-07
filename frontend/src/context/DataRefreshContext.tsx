import { createContext, useContext, useCallback, useState } from 'react';

interface DataRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined);

export const DataRefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <DataRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
};

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within DataRefreshProvider');
  }
  return context;
};
