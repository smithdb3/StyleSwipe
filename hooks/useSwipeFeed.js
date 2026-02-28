import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

async function fetchSwipeFeed(accessToken, userId, limit = 20) {
  const url = `${SUPABASE_URL}/functions/v1/swipe-feed?user_id=${encodeURIComponent(userId)}&limit=${limit}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    let message = `swipe-feed failed: ${res.status}`;
    try {
      const data = JSON.parse(body);
      if (data.message) message = data.message;
    } catch (_) {}
    throw new Error(message);
  }
  const data = await res.json();
  return data.items ?? [];
}

async function postSubmitSwipe(accessToken, userId, itemId, direction) {
  const url = `${SUPABASE_URL}/functions/v1/submit-swipe`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      user_id: userId,
      item_id: itemId,
      direction,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    let message = `submit-swipe failed: ${res.status}`;
    try {
      const data = JSON.parse(body);
      if (data.message) message = data.message;
    } catch (_) {}
    throw new Error(message);
  }
}

/**
 * useSwipeFeed(userId, initialLimit?)
 * Returns { queue, loading, error, submitSwipe, fetchMore }.
 * Fetches from swipe-feed (GET query params); submitSwipe calls submit-swipe and removes from queue; refetches when queue.length < 3.
 */
export function useSwipeFeed(userId, initialLimit = 20) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMore = useCallback(
    async (limit = initialLimit) => {
      if (!userId) return;
      try {
        setLoading(true);
        setError(null);
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          setError(new Error('Not authenticated'));
          return;
        }
        const items = await fetchSwipeFeed(token, userId, limit);
        setQueue((prev) => [...prev, ...items]);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    [userId, initialLimit]
  );

  const submitSwipe = useCallback(
    async (itemId, direction) => {
      if (!userId) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;
      try {
        await postSubmitSwipe(token, userId, itemId, direction);
        setQueue((prev) => {
          const next = prev.filter((item) => item.id !== itemId);
          if (next.length < 3) setTimeout(() => fetchMore(initialLimit), 0);
          return next;
        });
      } catch (e) {
        console.error('Submit swipe error:', e);
      }
    },
    [userId, initialLimit, fetchMore]
  );

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchMore(initialLimit);
  }, [userId]);

  return { queue, loading, error, submitSwipe, fetchMore };
}
