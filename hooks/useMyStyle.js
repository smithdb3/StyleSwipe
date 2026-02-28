import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

/**
 * Returns top 5 tags from tag_scores: sort by score desc, tie-break by tag name asc (lowLevelDoc §2.3).
 * @param {Record<string, number>} tagScores
 * @returns {string[]}
 */
function getTop5Tags(tagScores) {
  if (!tagScores || typeof tagScores !== 'object') return [];
  const entries = Object.entries(tagScores);
  entries.sort((a, b) => {
    const scoreDiff = b[1] - a[1];
    if (scoreDiff !== 0) return scoreDiff;
    return a[0].localeCompare(b[0]);
  });
  return entries.slice(0, 5).map(([tag]) => tag);
}

async function fetchMyStyleItems(accessToken, userId) {
  const url = `${SUPABASE_URL}/functions/v1/my-style?user_id=${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    let message = `my-style failed: ${res.status}`;
    try {
      const data = JSON.parse(body);
      if (data.message) message = data.message;
    } catch (_) {}
    throw new Error(message);
  }
  const data = await res.json();
  return data.items ?? [];
}

/**
 * useMyStyle(userId)
 * Fetches liked inspiration items (my-style EF) and profile tag_scores for Style DNA.
 * Returns { items, topTags, loading, error, refetch }.
 */
export function useMyStyle(userId) {
  const [items, setItems] = useState([]);
  const [tagScores, setTagScores] = useState({});
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
      const [fetchedItems, profileResult] = await Promise.all([
        fetchMyStyleItems(token, userId),
        supabase.from('profiles').select('tag_scores').eq('id', userId).single(),
      ]);
      setItems(fetchedItems);
      setTagScores(profileResult?.data?.tag_scores ?? {});
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    refetch();
  }, [userId, refetch]);

  const topTags = getTop5Tags(tagScores);

  return { items, topTags, loading, error, refetch };
}
