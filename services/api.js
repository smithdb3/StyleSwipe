import { supabase } from '../lib/supabase';

/**
 * Call a Supabase Edge Function by name.
 * Automatically retrieves the current session JWT and injects it.
 *
 * @param {string} name - Edge function name (e.g. 'swipe-feed')
 * @param {object} [body={}] - Request body (serialized as JSON)
 * @param {'GET'|'POST'} [method='POST']
 * @returns {Promise<any>} Parsed response data
 * @throws {Error} On auth failure or non-OK response
 */
export async function callFunction(name, body = {}, method = 'POST') {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke(name, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  return data;
}
