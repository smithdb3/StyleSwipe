import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { throwWithStatus } from '../lib/errorUtils';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

async function fetchRecommendations(accessToken, userId, limit = 20) {
  const url = `${SUPABASE_URL}/functions/v1/recommendations?user_id=${encodeURIComponent(userId)}&limit=${limit}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    let message = `recommendations failed: ${res.status}`;
    try {
      const data = JSON.parse(body);
      if (data.message) message = data.message;
    } catch (_) {}
    if (res.status === 401) throwWithStatus(401, message);
    throw new Error(message);
  }
  const data = await res.json();
  return data.items ?? [];
}

/**
 * useRecommendations(userId, limit?)
 * Fetches product recommendations from the recommendations Edge Function.
 * Returns { items, loading, error, refetch }.
 */
export function useRecommendations(userId, limit = 20) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setError(new Error('Not authenticated'));
        return;
      }
      const fetched = await fetchRecommendations(token, userId, limit);
      setItems(fetched);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.status === 401) {
        await supabase.auth.signOut();
        router.replace('/sign-up');
        return;
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    refetch();
  }, [userId, refetch]);

  return { items, loading, error, refetch };
}
