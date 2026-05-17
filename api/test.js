export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    working: true,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL
  }));
}
