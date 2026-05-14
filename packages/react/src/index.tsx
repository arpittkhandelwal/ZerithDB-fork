import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { createApp } from "zerithdb-sdk";
import type { ZerithDBApp, ZerithDBConfig } from "zerithdb-sdk";
import { liveQuery } from "dexie";

const ZerithContext = createContext<ZerithDBApp | null>(null);

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

  return <ZerithContext.Provider value={client}>{children}</ZerithContext.Provider>;
};

/**
 * Access the underlying ZerithDB app client directly.
 */
export const useZerith = (): ZerithDBApp => {
  const context = useContext(ZerithContext);
  if (!context) {
    throw new Error("useZerith must be used within a ZerithProvider");
  }
  return context;
};

/**
 * Reactive hook to query a collection.
 * Automatically updates when local or remote (P2P) changes occur.
 */
export function useQuery<T extends Record<string, any>>(collectionName: string, filter: any = {}) {
  const app = useZerith();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const collection = app.db<T>(collectionName);
    
    // Use Dexie's liveQuery to reactively observe local DB changes
    // (which also includes remote P2P updates applied by the sync engine)
    const observable = liveQuery(() => collection.find(filter));
    
    const subscription = observable.subscribe({
      next: (docs) => {
        setData(docs as T[]);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [app, collectionName, JSON.stringify(filter)]);

  const insert = async (item: T) => {
    return app.db<T>(collectionName).insert(item);
  };

  const remove = async (id: string) => {
    return app.db<T>(collectionName).delete({ _id: id } as any);
  };

  return { data, loading, error, insert, remove };
}

/**
 * Hook to access and manage P2P sync state
 */
export function useSync() {
  const app = useZerith();
  const [state, setState] = useState(() => app.sync.state);

  useEffect(() => {
    const handleStateChange = (newState: any) => setState(newState);
    app.sync.on("state:change", handleStateChange);
    return () => {
      app.sync.off("state:change", handleStateChange);
    };
  }, [app]);

  return {
    state,
    enable: () => app.sync.enable(),
    disable: () => app.sync.disable()
  };
}

/**
 * Hook to manage authentication and identity
 */
export function useAuth() {
  const app = useZerith();
  const [identity, setIdentity] = useState(() => app.auth.identity);

  useEffect(() => {
    // Identity changes aren't explicitly emitted, but we update on signIn/signOut
    setIdentity(app.auth.identity);
  }, [app, app.auth.identity]);

  const signIn = async () => {
    const id = await app.auth.signIn();
    setIdentity(id);
    return id;
  };

  const signOut = async () => {
    await app.auth.signOut();
    setIdentity(null);
  };

  return { identity, signIn, signOut };
}
