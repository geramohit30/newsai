const axios = require('axios');
const cheerio = require('cheerio');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function makeUserAgent() { return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'; }

function buildQft(filters = {}) {
  const parts = [];
  if (filters.size) parts.push(`+filterui:imagesize-${filters.size}`);
  if (filters.aspect) parts.push(`+filterui:aspect-${filters.aspect}`);
  if (filters.color) parts.push(`+filterui:color2-${filters.color}`);
  if (filters.type) parts.push(`+filterui:photo-${filters.type}`);
  if (filters.layout) parts.push(`+filterui:layout-${filters.layout}`);
  if (filters.license) parts.push(`+filterui:license-L${filters.license}`);
  return parts.join('');
}

function parseMAttr($el) {
  const m = $el.attr('m');
  if (!m) return null;
  try {
    return JSON.parse(m);
  } catch (e) {
    return null;
  }
}

async function fetchBingImageHtml({ query, market = 'en-US', cc = 'US', setLang = 'en', count = 35, offset = 0, exact = false, safe = 'off', filters = {"size": "wallpaper","aspect": "square","type": "photo"}, retries = 3 }) {
  const q = exact ? `"${query}"` : query;
  const params = new URLSearchParams({
    q: q,
    form: 'HDRSC2',
    first: String(offset + 1),
    count: String(count),
    adlt: String(safe || 'off'),
    setLang,
    cc,
    mkt: market
  });
  const qft = buildQft(filters);
  if (qft) params.set('qft', qft);

  const url = `https://www.bing.com/images/search?${params.toString()}`;

  const headers = {
    'User-Agent': makeUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': `${setLang}-${cc},${setLang};q=0.9,en;q=0.8`,
    'Referer': 'https://www.bing.com/'
  };

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, { headers, timeout: 20000 });
      if (res.status >= 200 && res.status < 300) return res.data;
      lastErr = new Error(`Unexpected status ${res.status}`);
    } catch (err) {
      lastErr = err;
      await sleep(400 * attempt + Math.floor(Math.random() * 200));
    }
  }
  throw lastErr;
}

async function scrapeBingImages({ query, count = 10, market = 'en-US', cc = 'US', setLang = 'en', exact = false, safe = 'off', filters = {} }) {
  const results = [];
  let fetched = 0;
  let offset = 0;
  const pageSize = 35;
  let priorityCounter = 0;

  while (fetched < count) {
    const toGet = Math.min(pageSize, count - fetched);
    const html = await fetchBingImageHtml({ query, market, cc, setLang, count: toGet, offset, exact, safe, filters });
    const $ = cheerio.load(html);

    const anchors = $('a.iusc');
    if (!anchors.length) break;

    for (let i = 0; i < anchors.length && fetched < count; i++) {
      const $a = anchors.eq(i);
      const meta = parseMAttr($a);
      if (!meta || !meta.murl) continue;

      results.push({
        url: meta.murl || meta.purl,
        img: meta.turl || meta.murl,
        priority: priorityCounter + 1
      });
      priorityCounter++;
      fetched++;
    }

    offset += anchors.length;
    await sleep(250);
  }

  return results;
}


module.exports = {scrapeBingImages};
