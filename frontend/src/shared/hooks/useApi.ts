import { useState, useCallback } from 'react';

export function useApi<T>(apiFunc: (...args: any[]) => Promise<any>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFunc(...args);
        const result = response.data !== undefined ? response.data : response;
        setData(result);
        return result;
      } catch (err: any) {
        const msg = err.message || 'An unexpected error occurred';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  return { data, loading, error, execute, setData };
}

