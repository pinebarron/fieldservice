export default function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    working: true,
    supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 40) : 'NOT SET',
    usingServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    usingSecretKey: !!process.env.SUPABASE_SECRET_KEY,
    keyPrefix: supabaseKey ? supabaseKey.substring(0, 15) + '...' : 'NOT SET'
  }));
}
