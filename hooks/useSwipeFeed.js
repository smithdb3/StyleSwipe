import { useState, useCallback } from 'react';
import { callFunction } from '../services/api';

/**
 * Fetches a paginated list of inspiration items for the swipe feed.
 * Calls the `swipe-feed` Edge Function.
 */
export function useSwipeFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeed = useCallback(async (limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const data = await callFunction('swipe-feed', { limit });
      setFeed(data?.items ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { feed, loading, error, fetchFeed };
}
