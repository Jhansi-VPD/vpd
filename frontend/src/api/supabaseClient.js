/**
 * Supabase PostgREST client used by the frontend.
 * Purely imports connection details from environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).
 * No hardcoded database credentials or keys exist here.
 */
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('VPD Notice: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in the .env configuration.');
}

export async function supabaseRest(table, { method = 'GET', query = '', body, headers = {} } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

  const reqHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(isMutation ? { 'Prefer': 'return=representation' } : {}),
    ...headers,
  };

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errText = await response.text();
    let errObj;
    try { errObj = JSON.parse(errText); } catch { errObj = { message: errText }; }
    throw new Error(errObj.message || errObj.hint || `Database operation on ${table} failed (${response.status})`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
