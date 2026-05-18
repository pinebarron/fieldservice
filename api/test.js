export default function handler(req, res) {
  const allSupaVars = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.includes('SUPA') || key.includes('VITE')) {
      allSupaVars[key] = value ? value.substring(0, 50) + '...' : 'EMPTY';
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(allSupaVars, null, 2));
}
