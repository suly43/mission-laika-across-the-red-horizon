// Vercel serverless proxy: keep NASA_API_KEY on the server, never in browser code.
module.exports = async function handler(req, res) {
  const key = process.env.NASA_API_KEY || 'DEMO_KEY';
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const types = ['FLR', 'CME', 'GST', 'SEP'];
  try {
    const entries = await Promise.all(types.map(async type => {
      const url = new URL(`https://api.nasa.gov/DONKI/${type}`);
      url.searchParams.set('startDate', startDate);
      url.searchParams.set('endDate', endDate);
      url.searchParams.set('api_key', key);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`NASA DONKI ${type} returned ${response.status}`);
      return [type, await response.json()];
    }));
    const data = Object.fromEntries(entries);
    const count = types.reduce((sum, type) => sum + (data[type]?.length || 0), 0);
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.status(200).json({ ...data, count, windowDays: 14 });
  } catch (error) {
    res.status(502).json({ error: 'NASA data is temporarily unavailable.' });
  }
};
