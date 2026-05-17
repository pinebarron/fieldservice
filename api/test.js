import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  res.setHeader('Content-Type', 'application/json');

  if (!supabaseUrl || !anonKey) {
    return res.end(JSON.stringify({
      error: 'Missing config',
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!anonKey
    }));
  }

  try {
    const supabase = createClient(supabaseUrl, anonKey);

    // Try a simple auth check
    const { data, error } = await supabase.auth.getSession();

    res.end(JSON.stringify({
      working: true,
      supabaseUrl: supabaseUrl,
      anonKeyPrefix: anonKey.substring(0, 20) + '...',
      sessionCheck: error ? error.message : 'OK',
      errorCode: error?.code || null
    }));
  } catch (err) {
    res.end(JSON.stringify({
      error: 'Exception',
      message: err.message
    }));
  }
}
