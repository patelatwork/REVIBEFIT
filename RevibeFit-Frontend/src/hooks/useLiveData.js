import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for live data updates with auto-refresh
 * @param {Function} fetchFunction - The function to call for fetching data
 * @param {number} interval - Refresh interval in milliseconds (default: 5000)
 * @param {Array} dependencies - Additional dependencies to trigger refetch
 */
export const useLiveData = (fetchFunction, interval = 5000, dependencies = []) => {
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Memoized fetch function to prevent unnecessary re-renders
  const memoizedFetch = useCallback(() => {
    if (isMountedRef.current && typeof fetchFunction === 'function') {
      fetchFunction();
    }
  }, [fetchFunction]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    memoizedFetch();

    // Setup interval for live updates
    intervalRef.current = setInterval(() => {
      memoizedFetch();
    }, interval);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, memoizedFetch, ...dependencies]);

  // Manual refresh function
  const refresh = useCallback(() => {
    memoizedFetch();
  }, [memoizedFetch]);

  // Pause/resume controls
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        memoizedFetch();
      }, interval);
    }
  }, [interval, memoizedFetch]);

  return { refresh, pause, resume };
};

export default useLiveData;
