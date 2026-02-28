import { useState, useCallback } from 'react';
import { callFunction } from '../services/api';

/**
 * Submits a swipe decision (like/skip) for an inspiration item.
 * Calls the `submit-swipe` Edge Function, which updates tag_scores in the profile.
 */
export function useSubmitSwipe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {{ itemId: string, direction: 'like' | 'skip' }} params
   */
  const submitSwipe = useCallback(async ({ itemId, direction }) => {
    setLoading(true);
    setError(null);
    try {
      await callFunction('submit-swipe', { item_id: itemId, direction });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitSwipe, loading, error };
}
