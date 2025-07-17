// memory_optimized_scraper.js

const axios = require('axios');
const cheerio = require('cheerio');
const he = require('he');
const https = require('https');
const mongoose = require('mongoose');
const { URL } = require('url');
const crypto = require('crypto');
const stringSimilarity = require('string-similarity');

const mongoConnect = require('../Utils/mongo_connect');
const { summarize, cleanText } = require('../Summarize/nlp2');
const fetchFirebaseConfig = require('../Config/FirebaseLimitConfig').fetchFirebaseConfig;
const News = require('../Models/newsModel');
const Rssfeed = require('../Models/rssfeedModel');
const getImages = require('./Img_scrapper');
const getCategoryFromKeywords = require('../Summarize/category');
const imageGradient = require('../Utils/color_picker');
const ApiCall = require('../Models/chatgptModel');
const chatWithGPT4Mini = require('../Utils/chatgpt_utils');
const { guardianScraper, alJazeeraScraper } = require('./General_scrapper');

let max_limit = process.env.MAX_LIMIT ? parseInt(process.env.MAX_LIMIT) : 100;  


function extractKeywords(txt, n = 5) {
  const counts = {}, words = cleanHtmlContent(txt).toLowerCase().split(/\s+/);
  words.forEach(w => w.length > 2 && (counts[w] = (counts[w] || 0) + 1));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w).join(', ');
}

function cleanHtmlContent(raw = '') {
  return he.decode(raw)
    .replace(/<script.*?>.*?<\/script>/gis, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function stripEnglishAndPunct(text = '') {
  return text.replace(/["'`\-–—()\[\]{}:;,.!?|\/]/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

async function canMakeChatGPTRequest() {
    const currentTime = Date.now();
    const oneHourAgo = new Date(currentTime - 60 * 60 * 1000);
    const currentHourStart = new Date(Math.floor(currentTime / (60 * 60 * 1000)) * (60 * 60 * 1000));

    let apiCallRecord = await ApiCall.findOne({ timestamp: { $gte: currentHourStart } });

    if (apiCallRecord) {
        if (apiCallRecord.count >= process.env.RATE_LIMIT) {
            console.log('Rate limit exceeded. Skipping GPT-4 request.');
            return false;
        }
        apiCallRecord.count += 1;
        await apiCallRecord.save();
        return true;
    } else {
        const newApiCallRecord = new ApiCall({
            count: 1,
            timestamp: currentTime,
        });
        await newApiCallRecord.save();
        return true;
    }
}

function headingHash(h) {
  return crypto.createHash('sha256').update(cleanText(h || '')).digest('hex');
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function similarArticle(text, thresh = 0.9) {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const rec = await News.find({ publishedAt: { $gte: since } }, { data: 1 }).sort({ _id: -1 }).limit(100).lean();
  return rec.some(a => stringSimilarity.compareTwoStrings(text, a.data) > thresh);
}

async function summarize_data(raw, image, keywords, heading, feedId, author = null, publishedAt = null, category = null) {
  try {
    if (!raw || max_limit <= 0 || !image) return;
    let data = cleanHtmlContent(raw);
    const hash = headingHash(heading);
    if (await News.exists({ hash })) return;

    const isHindi = /[\u0900-\u097F]/.test(data);
    if (!keywords || keywords.length === 0) keywords = extractKeywords(`${heading} ${data}`, 4);

    const cfg = await fetchFirebaseConfig();
    let isChatgpt = false;
    const autoOk = cfg?.auto_approve ?? false;
    const feed = await Rssfeed.findById(feedId);
    const srcHost = safeHostname(feed?.link?.[0]);
    if (!srcHost) return;

    let source = srcHost.split('.').slice(-2, -1)[0];
    source = source === 'hindustantimes' ? 'Hindustan Times' :
             source === 'indiatoday' ? 'India Today' :
             source.charAt(0).toUpperCase() + source.slice(1);

    let summ = isHindi
      ? data.split(/[।!?]/).filter(s => s.length > 20).slice(0, 3).join('। ') + '।'
      : (await summarize(cleanText(data), 2) || '').trim();

    if (!summ || await similarArticle(summ)) return;

    if (summ.split(/\s+/).length > 80 && await canMakeChatGPTRequest()) {
      const gptSummary = await chatWithGPT4Mini(summ);
      isChatgpt = true;
      if (gptSummary) summ = gptSummary;
    }

    if (summ.split(/\s+/).length > 100) {
      summ = summ.split(/\s+/).slice(0, 100).join(' ') + (isHindi ? '।' : '.');
    }
     const hasOriginalKeywords =
      (Array.isArray(keywords) && keywords.length > 0) ||
      (typeof keywords === 'string' && keywords.trim().length > 0);
    const originalKeywords = hasOriginalKeywords ? keywords : null;
    const imageSearchQuery = originalKeywords || heading;
    const imgs = await getImages(imageSearchQuery, 5);
    const gradients = await imageGradient(image);
    const hasValidCategory = Array.isArray(category)? category.length > 0 : typeof category === 'string' && category.trim() !== '';
    const cats = [...new Set([...(hasValidCategory? (Array.isArray(category) ? category : [category]): getCategoryFromKeywords(keywords, heading))].filter(Boolean))];
    const langGuess = isHindi ? 'hi' : 'en';
    let cleanHeading = cleanText(heading), cleanBody = summ;

    if (isHindi) {
      cleanHeading = stripEnglishAndPunct(cleanHeading);
      cleanBody = stripEnglishAndPunct(cleanBody);
      const cleanedDate = publishedAt.replace(/\\T/, 'T')
      publishedAt = cleanedDate;
    }
    
    await News.create({ 
          heading: cleanHeading,
          approved: autoOk,
          hash,
          data: cleanBody,
          language: langGuess,
          feedId,
          keywords,
          source,
          image,
          images: imgs,
          gradient: gradients,
          sourceUrl: feed.link[0].trim(),
          publishedAt,
          categories: cats,
          isChatGpt: isChatgpt
         });
    feed.updateOne({ $set: { success: true } });
    max_limit--;
    global.gc && global.gc();

  } catch (e) {
    console.error('Error in summarize_data:', e.message);
  }
}

async function processUrl(url, feedId) {
  try {
    let html = (await axios.get(url, { httpsAgent: new https.Agent({ rejectUnauthorized: false }), responseType: 'text' })).data;
    let $ = cheerio.load(html);
    let scripts = $('script[type^="application/ld+json"]');
    html = null;

    for (let i = 0; i < scripts.length; i++) {
      try {
        let obj = JSON.parse($(scripts[i]).html().replace(/[\u0000-\u001F]+/g, ''));
        if (obj['@graph']) obj = obj['@graph'].find(o => ['NewsArticle', 'Article'].includes(o['@type']));
        if (Array.isArray(obj)) obj = obj.find(o => o['@type'] === 'NewsArticle');

        if (obj && ['NewsArticle', 'Article', 'LiveBlogPosting'].includes(obj['@type'])) {
          let body = '', img = '', kw = [], date = '', section = '', headline = obj.headline || '';
          if (!headline) continue;

          if (url.includes('theguardian.com')) {
            body = await guardianScraper(url);
            img = Array.isArray(obj.image) ? obj.image[0] : '';
            section = [new URL(obj['@id']).pathname.split('/')[1]];
          } else if (url.includes('aljazeera.com')) {
            body = await alJazeeraScraper(url);
            img = Array.isArray(obj.image) ? (typeof obj.image[0] === 'string' ? obj.image[0] : obj.image[0].url || '') : (obj.image?.url || '');
            try {
              section = [new URL(obj.mainEntityOfPage || url).pathname.split('/')[1]];
            } catch {}
          } else {
            body = obj.articleBody || obj.description || '';
            img = obj.image?.url || (Array.isArray(obj.image) ? obj.image[0]?.url : '');
            section = obj.articleSection || '';
          }

          body = cleanHtmlContent(body);
          headline = cleanHtmlContent(headline);
          if (!body || !headline) continue;

          await summarize_data(body, img, kw, headline, feedId, null, obj.datePublished, section);
          break;
        }
      } catch (err) {
        console.error(`⚠️ JSON-LD parse error for ${url}:`, err.message);
      }
    }
    scripts = null;
    $ = null;
    global.gc && global.gc();

  } catch (err) {
    console.error(`❌ Fetch failed for :`, err.message);
  }
}

async function scrapeWebsite() {
  await mongoConnect();
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const feedCursor = Rssfeed.find({success: false, createdAt: { $gte: fourHoursAgo }}).sort({ createdAt: -1 }).cursor();

  for await (const feed of feedCursor) {
    if (max_limit <= 0) {
    console.log('✅ max_limit reached. Stopping feed processing.');
    break;
  }
    console.log(`🔗 Processing feed: ${feed.link}`);
    await processUrl(feed.link, feed._id);
    await new Promise(r => setTimeout(r, 200));
    global.gc && global.gc();
  }

  console.log('✅ Scraping done.');
  global.gc && global.gc();
}

module.exports = scrapeWebsite;
