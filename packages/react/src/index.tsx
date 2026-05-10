import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createApp } from 'zerithdb-sdk';
import type { ZerithDBConfig } from 'zerithdb-sdk';

const ZerithContext = createContext<any>(null);

export interface ZerithProviderProps {
  config: ZerithDBConfig;
  children: React.ReactNode;
}

/**
 * Global provider for ZerithDB. 
 * Initializes the P2P client and makes it available via hooks.
 */
export const ZerithProvider: React.FC<ZerithProviderProps> = ({ config, children }) => {
  const client = useMemo(() => createApp(config), [JSON.stringify(config)]);

  return (
    <ZerithContext.Provider value={client}>
      {children}
    </ZerithContext.Provider>
  );
};

/**
 * Access the underlying ZerithDB client directly.
 */
export const useZerith = () => {
  const context = useContext(ZerithContext);
  if (!context) {
    throw new Error('useZerith must be used within a ZerithProvider');
  }
  return context;
};

/**
 * Reactive hook to query a collection.
 * Automatically updates when local or remote (P2P) changes occur.
 */
export function useQuery<T = any>(collectionName: string) {
  const db = useZerith() as any;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const collection = db.collection(collectionName);
    
    // Subscribe to real-time updates (CRDT merges)
    const unsubscribe = collection.subscribe((docs: any[]) => {
      if (mounted) {
        setData(docs as T[]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [db, collectionName]);

  const insert = async (item: Partial<T>) => {
    return db.collection(collectionName).insert(item);
  };

  const remove = async (id: string) => {
    return db.collection(collectionName).delete(id);
  };

  return { data, loading, error, insert, remove };
}
