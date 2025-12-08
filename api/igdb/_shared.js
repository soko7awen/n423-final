const { setTimeout: delayTimeout, clearTimeout: clearDelay } = require('timers');

let cachedToken = null;
let tokenExpiry = 0;

const fetchJson = async (urlStr, options = {}) => {
  const controller = new AbortController();
  const timeout = delayTimeout(() => controller.abort(), 8000);
  const res = await fetch(urlStr, { ...options, signal: controller.signal });
  clearDelay(timeout);
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

const respond = (res, status, payload) => {
  res.status(status).json(payload);
};

module.exports = {
  fetchJson,
  getIgdbToken,
  normalizeGame,
  respond,
};
