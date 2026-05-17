export default function handler(req, res) {
  // Get all env var names that contain SUPA or DATABASE
  const envKeys = Object.keys(process.env).filter(k =>
    k.includes('SUPA') || k.includes('DATABASE') || k.includes('supa')
  );

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    working: true,
    envKeysFound: envKeys,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    supabaseUrlValue: process.env.SUPABASE_URL ? 'SET' : 'NOT SET'
  }));
}
