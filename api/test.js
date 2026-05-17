module.exports = (req, res) => {
  res.json({
    working: true,
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    }
  });
};
