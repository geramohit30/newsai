const axios = require('axios');
const cheerio = require('cheerio');

function cleanKeywords(rawInput, maxTerms = 5) {
  let keywords = [];

  if (Array.isArray(rawInput)) {
    keywords = rawInput;
  } else if (typeof rawInput === 'string') {
    keywords = rawInput.split(',').map(k => k.trim());
  }

  const seen = new Set();
  const cleaned = [];

  for (let keyword of keywords) {
    keyword = keyword.toLowerCase()
      .replace(/\b(to|from|with|in|on|at|by|for|the|of|return|date|time|undocking)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!keyword || keyword.length < 3 || keyword.length > 60 || seen.has(keyword)) continue;

    seen.add(keyword);
    cleaned.push(keyword);
    if (cleaned.length >= maxTerms) break;
  }

  return cleaned;
}

async function fetchBingImages(keywordsInput, count = 3) {
  if (!keywordsInput || (typeof keywordsInput !== 'string' && !Array.isArray(keywordsInput))) {
    return [];
  }
  let query = '';
  if(typeof keywordsInput !== 'string'){
    const cleanedKeywords = cleanKeywords(keywordsInput);
    if (cleanedKeywords.length === 0) return [];
        query = encodeURIComponent(cleanedKeywords.join(' '));
  }else{
    query = keywordsInput;
  }

  const url = `https://www.bing.com/images/search?q='${query}'&form=HDRSC2&first=1&tsc=ImageBasicHover&qft=+filterui:imagesize-large`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  };

  try {
    let res = await axios.get(url, { headers });
    let $ = cheerio.load(res.data);
    let images = [];

    $('a.iusc, div.imgpt').each((i, el) => {
      if (images.length >= count) return false;

      let metaRaw = $(el).attr('m');
      if (!metaRaw) return;
      try {
        const meta = JSON.parse(metaRaw);
        const imageUrl = meta.murl || meta.purl;
        const width = meta.ow || 0;
        const height = meta.oh || 0;
        if (!imageUrl) {return};

        const ext = imageUrl.split('?')[0].split('.').pop().toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
          return;
        }

        images.push({
          url: imageUrl,
          priority: i + 1
        });
      } catch (err) {
        console.log('Error parsing image metadata:', err.message);
      }
    });
    res = null;
    $ = null;
    global.gc && global.gc()
    return images;
  } catch (error) {
    console.error('Failed to fetch Bing images:', error.message);
    return [];
  }
}

module.exports = fetchBingImages;