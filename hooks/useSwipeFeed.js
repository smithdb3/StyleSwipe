import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Fallback when swipe-feed returns no items (empty DB or all swiped) so user sees outfit images.
// Set EXPO_PUBLIC_USE_MOCK_FEED=true to always use mock outfit images (ignores DB).
const MOCK_INSPIRATION = require('../data/mock-inspiration.json').items;
const USE_MOCK_FEED = process.env.EXPO_PUBLIC_USE_MOCK_FEED === 'true';

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
  const swipeHistoryRef = useRef([]);

  const fetchMore = useCallback(
    async (limit = initialLimit) => {
      if (!userId) return;
      try {
        setLoading(true);
        setError(null);
        if (USE_MOCK_FEED) {
          const items = MOCK_INSPIRATION.slice(0, limit);
          setQueue((prev) => [...prev, ...items]);
        } else {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (!token) {
            setError(new Error('Not authenticated'));
            return;
          }
          let items = await fetchSwipeFeed(token, userId, limit);
          if (!items || items.length === 0) {
            items = MOCK_INSPIRATION.slice(0, limit);
          }
          setQueue((prev) => [...prev, ...items]);
        }
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
      if (token) {
        try {
          await postSubmitSwipe(token, userId, itemId, direction);
        } catch (e) {
          console.error('Submit swipe error:', e);
        }
      }
      setQueue((prev) => {
        const swipedItem = prev.find((item) => item.id === itemId);
        if (swipedItem) {
          swipeHistoryRef.current = [swipedItem, ...swipeHistoryRef.current].slice(0, 3);
        }
        const next = prev.filter((item) => item.id !== itemId);
        if (next.length < 3) setTimeout(() => fetchMore(initialLimit), 0);
        return next;
      });
    },
    [userId, initialLimit, fetchMore]
  );

  const undoLastSwipe = useCallback(() => {
    const [last, ...rest] = swipeHistoryRef.current;
    if (!last) return;
    swipeHistoryRef.current = rest;
    setQueue((prev) => [last, ...prev]);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchMore(initialLimit);
  }, [userId]);

  return { queue, loading, error, submitSwipe, fetchMore, undoLastSwipe };
}
