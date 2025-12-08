const { fetchJson, getIgdbToken, normalizeGame, respond } = require('./_shared');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return respond(res, 405, { error: 'Method not allowed' });
  }

  const search = (req.query.search || '').trim();
  const limitParam = parseInt(req.query.limit || '6', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 12) : 6;

  if (!search || search.length < 2) {
    return respond(res, 400, { error: 'Search term too short' });
  }

  try {
    const token = await getIgdbToken();
    const safeTerm = search.replace(/"/g, '\\"');
    const body = `
fields id,name,first_release_date,total_rating,total_rating_count,hypes,platforms.id,platforms.name,release_dates.date,release_dates.platform,cover.image_id,screenshots.image_id,involved_companies.developer,involved_companies.company.name;
where name ~ *"${safeTerm}"*;
sort total_rating_count desc;
limit ${limit};
`;

    const games = await fetchJson('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    // Capture platform ids to preserve release ordering
    const platformIds = new Set();
    (Array.isArray(games) ? games : []).forEach((g) => {
      if (Array.isArray(g.release_dates)) {
        g.release_dates.forEach((r) => {
          if (r?.platform) platformIds.add(r.platform);
        });
      }
    });

    const platformVersionMap = new Map();
    const numericIds = Array.from(platformIds)
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (numericIds.length) {
      const idList = numericIds.join(',');
      const pvBody = `
fields platform,name,release_dates.date;
where platform = (${idList});
limit 200;
`;
      const fallbackPlatformsBody = `
fields id,name,release_dates.date;
where id = (${idList});
limit 200;
`;
      try {
        const versions = await fetchJson('https://api.igdb.com/v4/platform_versions', {
          method: 'POST',
          headers: {
            'Client-ID': process.env.IGDB_CLIENT_ID,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'text/plain',
          },
          body: pvBody,
        });
        versions.forEach((v) => {
          if (v?.platform) {
            if (Array.isArray(v.release_dates)) {
              v.release_dates = [...v.release_dates].sort(
                (a, b) => (a?.date || Number.MAX_SAFE_INTEGER) - (b?.date || Number.MAX_SAFE_INTEGER)
              );
            }
            platformVersionMap.set(v.platform, v);
          }
        });
      } catch (err) {
        if (err?.status === 400) {
          console.info('[igdb] platform_versions unsupported, falling back to platforms');
        } else {
          console.warn('[igdb] failed to load platform_versions, falling back to platforms', err?.status || '', err?.message || '');
        }
        try {
          const platforms = await fetchJson('https://api.igdb.com/v4/platforms', {
            method: 'POST',
            headers: {
              'Client-ID': process.env.IGDB_CLIENT_ID,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'text/plain',
            },
            body: fallbackPlatformsBody,
          });
          platforms.forEach((p) => {
            const sorted = Array.isArray(p.release_dates)
              ? [...p.release_dates].sort((a, b) => (a?.date || Number.MAX_SAFE_INTEGER) - (b?.date || Number.MAX_SAFE_INTEGER))
              : [];
            platformVersionMap.set(p.id, {
              platform: p.id,
              platformData: p,
              release_dates: sorted,
            });
          });
        } catch (e) {
          console.warn('[igdb] fallback platforms also failed', e?.status || '', e?.message || '');
        }
      }
    }

    const normalized = Array.isArray(games) ? games.map((g) => normalizeGame(g, platformVersionMap)) : [];
    normalized.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return respond(res, 200, { games: normalized });
  } catch (err) {
    console.error('[igdb games]', err.status || '', err.message, err.body || '');
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
