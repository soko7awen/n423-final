const { fetchJson, getIgdbToken, respond } = require('./_shared');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return respond(res, 405, { error: 'Method not allowed' });
  }

  const search = (req.query.search || '').trim();
  const limitParam = parseInt(req.query.limit || '8', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8;

  if (!search || search.length < 2) {
    return respond(res, 400, { error: 'Search term too short' });
  }

  try {
    const token = await getIgdbToken();
    const safeTerm = search.replace(/"/g, '\\"');
    const body = `
search "${safeTerm}";
fields id,name,abbreviation,generation,release_dates.date;
limit ${limit};
`;

    const platforms = await fetchJson('https://api.igdb.com/v4/platforms', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    const normalized = Array.isArray(platforms)
      ? platforms.map((p) => ({
        id: p.id,
        name: p.name || '',
        abbreviation: p.abbreviation || '',
        generation: p.generation || null,
        releaseDates: Array.isArray(p.release_dates)
          ? [...p.release_dates].sort(
            (a, b) => (a?.date || Number.MAX_SAFE_INTEGER) - (b?.date || Number.MAX_SAFE_INTEGER)
          )
          : [],
      }))
      : [];
    return respond(res, 200, { platforms: normalized });
  } catch (err) {
    console.error('[igdb platforms]', err.status || '', err.message, err.body || '');
    if (err.name === 'AbortError') {
      return respond(res, 504, { error: 'IGDB request timed out.' });
    }
    if (err.status === 401) {
      return respond(res, 502, { error: 'IGDB auth failed. Check IGDB_CLIENT_ID/SECRET.' });
    }
    return respond(res, err.status || 502, {
      error: 'Failed to reach IGDB.',
      detail: err.body || err.message || null,
      status: err.status || null,
    });
  }
};
