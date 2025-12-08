const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

let cachedToken = null;
let tokenExpiry = 0;
let envLoaded = false;

const loadLocalEnv = () => {
  if (envLoaded) return;
  envLoaded = true;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
      const [key, ...rest] = trimmed.split('=');
      const value = rest.join('=');
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (err) {
    console.error('[igdb] failed to load .env.local', err);
  }
};

const fetchJson = async (urlStr, options) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(urlStr, { ...options, signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    const error = new Error(`Request failed: ${res.status} ${res.statusText}`);
    error.status = res.status;
    error.body = message;
    throw error;
  }
  return res.json();
};

const getIgdbToken = async () => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 10_000) {
    return cachedToken;
  }

  loadLocalEnv();
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const error = new Error('Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET env vars');
    error.status = 500;
    error.body = JSON.stringify({
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
    });
    throw error;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  const tokenData = await fetchJson(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: 'POST',
  });

  cachedToken = tokenData.access_token;
  tokenExpiry = Date.now() + (tokenData.expires_in || 0) * 1000;
  return cachedToken;
};

const normalizeGame = (game, platformVersionMap = new Map()) => {
  const toYear = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    return Number.isFinite(year) ? String(year) : '';
  };

  const buildImageUrl = (imageId, size) => {
    if (!imageId) return '';
    return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
  };

  const developerEntry = Array.isArray(game.involved_companies)
    ? game.involved_companies.find((ic) => ic?.developer && ic?.company?.name)
    : null;

  const releaseDates = Array.isArray(game.release_dates)
    ? [...game.release_dates].filter((r) => r?.platform && r?.date)
    : [];

  const sortedReleases = releaseDates.sort((a, b) => {
    const aDate = a.date || Number.MAX_SAFE_INTEGER;
    const bDate = b.date || Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });
  const earliestRelease = sortedReleases[0];

  const platformLookup = {};
  if (Array.isArray(game.platforms)) {
    game.platforms.forEach((p) => {
      if (p?.id) {
        platformLookup[p.id] = p.name || '';
      }
    });
  }

  const platformName =
    (earliestRelease && platformLookup[earliestRelease.platform]) ||
    (Array.isArray(game.platforms) && game.platforms[0]?.name) ||
    '';

  const platformList = sortedReleases
    .map((r) => {
      const version = platformVersionMap.get(r.platform);
      const releaseDate = Array.isArray(version?.release_dates) && version.release_dates[0]?.date
        ? version.release_dates[0].date
        : r.date || null;
      const name = version?.platform?.name || platformLookup[r.platform] || '';
      return { name, date: releaseDate };
    })
    .filter((r) => r.name);
  platformList.sort((a, b) => (a.date || Number.MAX_SAFE_INTEGER) - (b.date || Number.MAX_SAFE_INTEGER));
  const platformNamesChrono = platformList.map((p) => p.name);

  const coverUrl = buildImageUrl(game.cover?.image_id, 't_cover_big');
  const screenshotUrl = Array.isArray(game.screenshots) && game.screenshots[0]?.image_id
    ? buildImageUrl(game.screenshots[0].image_id, 't_screenshot_huge')
    : '';

  const popularityScore = Number.isFinite(game.total_rating_count)
    ? game.total_rating_count
    : Number.isFinite(game.hypes)
      ? game.hypes
      : 0;

  return {
    id: game.id,
    title: game.name,
    year: toYear(game.first_release_date),
    platform: platformName,
    developer: developerEntry?.company?.name || '',
    imageUrl: coverUrl || screenshotUrl || '',
    popularity: popularityScore,
    platforms: platformNamesChrono,
    releases: platformList,
  };
};

const respondJson = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
};

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/api/igdb/games') {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return res.end();
    }

    if (req.method !== 'GET') {
      return respondJson(res, 405, { error: 'Method not allowed' });
    }

    const search = (parsed.query.search || '').trim();
    const limit = parseInt(parsed.query.limit || '6', 10);

    if (!search || search.length < 2) {
      return respondJson(res, 400, { error: 'Search term too short' });
    }

    try {
      const token = await getIgdbToken();
      const safeTerm = search.replace(/"/g, '\\"');
      const body = `
fields id,name,first_release_date,total_rating,total_rating_count,hypes,platforms.id,platforms.name,release_dates.date,release_dates.platform,cover.image_id,screenshots.image_id,involved_companies.developer,involved_companies.company.name;
where name ~ *"${safeTerm}"*;
sort total_rating_count desc;
limit ${Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 12) : 6};
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

      // Fetch platform_versions for involved platform ids to preserve release ordering
      const platformIds = new Set();
      (Array.isArray(games) ? games : []).forEach((g) => {
        if (Array.isArray(g.release_dates)) {
          g.release_dates.forEach((r) => {
            if (r?.platform) platformIds.add(r.platform);
          });
        }
      });

      const platformVersionMap = new Map();
      if (platformIds.size) {
        const pvBody = `
fields platform,name,release_dates.date;
where platform = (${Array.from(platformIds).join(',')});
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
              // Sort release dates for consistency
              if (Array.isArray(v.release_dates)) {
                v.release_dates = [...v.release_dates].sort(
                  (a, b) => (a?.date || Number.MAX_SAFE_INTEGER) - (b?.date || Number.MAX_SAFE_INTEGER)
                );
              }
              platformVersionMap.set(v.platform, v);
            }
          });
        } catch (err) {
          console.warn('[igdb] failed to load platform_versions', err);
        }
      }

      const normalized = Array.isArray(games) ? games.map((g) => normalizeGame(g, platformVersionMap)) : [];
      normalized.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      return respondJson(res, 200, { games: normalized });
    } catch (err) {
      console.error('[igdb]', err.status || '', err.message, err.body || '');
      if (err.name === 'AbortError') {
        return respondJson(res, 504, { error: 'IGDB request timed out.' });
      }
      if (err.status === 401) {
        return respondJson(res, 502, { error: 'IGDB auth failed. Check IGDB_CLIENT_ID/SECRET.' });
      }
      return respondJson(res, err.status || 502, {
        error: 'Failed to reach IGDB.',
        detail: err.body || err.message || null,
        status: err.status || null,
      });
    }
  }

  if (parsed.pathname === '/api/igdb/platforms') {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return res.end();
    }

    if (req.method !== 'GET') {
      return respondJson(res, 405, { error: 'Method not allowed' });
    }

    const search = (parsed.query.search || '').trim();
    const limit = parseInt(parsed.query.limit || '8', 10);

    if (!search || search.length < 2) {
      return respondJson(res, 400, { error: 'Search term too short' });
    }

    try {
      const token = await getIgdbToken();
      const safeTerm = search.replace(/"/g, '\\"');
      const body = `
search "${safeTerm}";
fields id,name,abbreviation,generation;
limit ${Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 8};
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
        }))
        : [];
      return respondJson(res, 200, { platforms: normalized });
    } catch (err) {
      console.error('[igdb platforms]', err.status || '', err.message, err.body || '');
      if (err.name === 'AbortError') {
        return respondJson(res, 504, { error: 'IGDB request timed out.' });
      }
      if (err.status === 401) {
        return respondJson(res, 502, { error: 'IGDB auth failed. Check IGDB_CLIENT_ID/SECRET.' });
      }
      return respondJson(res, err.status || 502, {
        error: 'Failed to reach IGDB.',
        detail: err.body || err.message || null,
        status: err.status || null,
      });
    }
  }

  // Fallback
  respondJson(res, 404, { error: 'Not found' });
});

const PORT = parseInt(process.env.API_PORT || '3000', 10);
server.listen(PORT, () => {
  console.log(`[igdb] local proxy running on http://localhost:${PORT}/api/igdb/{games,platforms}`);
});
