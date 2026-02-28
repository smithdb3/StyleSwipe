import { useState, useCallback } from 'react';
import { callFunction } from '../services/api';

/**
 * Fetches personalized product recommendations based on the user's tag affinity scores.
 * Calls the `recommendations` Edge Function.
 */
export function useRecommendations() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {{ category?: string, color?: string, limit?: number, offset?: number }} [filters]
   */
  const fetchRecommendations = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await callFunction('recommendations', filters);
      setProducts(data?.products ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, fetchRecommendations };
}
