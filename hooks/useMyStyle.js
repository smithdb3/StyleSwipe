import { useState, useCallback } from 'react';
import { callFunction } from '../services/api';

/**
 * Fetches the user's liked inspiration items and computed Style DNA tags.
 * Calls the `my-style` Edge Function.
 */
export function useMyStyle() {
  const [items, setItems] = useState([]);
  const [styleDna, setStyleDna] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyStyle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callFunction('my-style', {});
      setItems(data?.liked_items ?? []);
      setStyleDna(data?.style_dna ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, styleDna, loading, error, fetchMyStyle };
}
