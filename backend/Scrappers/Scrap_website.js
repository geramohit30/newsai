const axios    = require('axios');
const cheerio  = require('cheerio');
const he       = require('he');
const https    = require('https');
const mongoose = require('mongoose');

const connectDB           = require('../Utils/mongo_utils');
const { summarize, cleanText } = require('../Summarize/nlp2');
const fetchFirebaseConfig = require('../Config/FirebaseLimitConfig').fetchFirebaseConfig;
const News      = require('../Models/newsModel');
const Rssfeed   = require('../Models/rssfeedModel');
const getImages = require('./Img_scrapper');

const getCategoryFromKeywords = require('../Summarize/category');
const imageGradient           = require('../Utils/color_picker');
const chatWithGPT4Mini        = require('../Utils/chatgpt_utils');
const { guardianScraper, alJazeeraScraper }     = require('./General_scrapper');

const { URL } = require('url');
const crypto  = require('crypto');
const stringSimilarity = require('string-similarity');
const { cat } = require('stopword');

let max_limit = 100;

function cleanHtmlContent(raw='') {
  return he.decode(raw)
    .replace(/<script.*?>.*?<\/script>/gis, '')
    .replace(/(?:appendChild|AppendChild)\s*\([^)]*\);\s*/g, '')
    .replace(/\)\s*\(\s*window\s*,\s*document[^)]*\);?/gis, '')
    .replace(/data\s*:\s*['"`][^'"`]*['"`],?/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&\s*nbsp;?/gi, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[|]{2,}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function stripEnglishAndPunct(text='') {
  return text
    .replace(/[A-Za-z0-9]/g, '')                      
    .replace(/[“”"`'’\-–—()\[\]{}:;,\.!?|\/]/g, ' ') 
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function canMakeChatGPTRequest() {
    return false;
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

function cleanHindiText(text='') {
  text = cleanHtmlContent(text).replace(/\s+/g,' ');
  const filler = [
    /Follow.*?(Facebook|Twitter|Instagram|YouTube).*?\.?/gi,
    /Get\s+(latest|breaking)?\s*updates.*?\.?/gi,
    /Photos\s+Videos\s+Latest\s+News.*?\.?/gi,
    /Read\s+(full|more)\s+coverage.*?\.?/gi,
    /Join\s+our\s+Telegram\s+channel.*?\.?/gi,
    /देखें\s+.*?(वीडियो|तस्वीरें).*?$/gi,
    /समाचार\s+की\s+पूरी\s+जानकारी\s+के\s+लिए\s+यहां\s+क्लिक\s+करें.*?$/gi,
    /Subscribe\s+to.*?\.?/gi
  ];
  filler.forEach(r=>text=text.replace(r,'').trim());
  return text;
}

function safeHostname(url){ try{ return new URL(url).hostname; }catch{ return null; } }
function headingHash(h){ return crypto.createHash('sha256').update(cleanText(h||'')).digest('hex'); }
function capitalizeFirst(str){ return str.replace(/(^\s*\w|[.!?]\s*\w)/g,m=>m.toUpperCase()); }
function extractKeywords(txt, n=5){
  const counts={}, words=cleanHtmlContent(txt).toLowerCase().split(/\s+/);
  words.forEach(w=>w.length>2&&(counts[w]=(counts[w]||0)+1));
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([w])=>w).join(', ');
}
async function similarArticle(text, thresh=0.9){
  const since=new Date(); since.setDate(since.getDate()-30);
  const rec=await News.find({publishedAt:{$gte:since}},{data:1}).lean();
  return rec.some(a=>stringSimilarity.compareTwoStrings(text,a.data)>thresh);
}

// async function summarize_data(
//   raw,
//   image,
//   keywords,
//   heading,
//   feedId,
//   author = null,
//   publishedAt = null,
//   category = null
// ) {
// try{
//   if (!raw) return;
//   console.log('Summarizing:', raw);
//   let data = cleanHtmlContent(raw);

//   const hash = headingHash(heading);
//   if (await News.exists({ hash })) return;
//   if (max_limit <= 0) return;

//   const hasOriginalKeywords =
//     (Array.isArray(keywords) && keywords.length > 0) ||
//     (typeof keywords === 'string' && keywords.trim().length > 0);
//   const originalKeywords = hasOriginalKeywords ? keywords : null;

//   if (!hasOriginalKeywords) {
//     keywords = extractKeywords(`${heading} ${data}`,4);
//   }

//   const cfg = await fetchFirebaseConfig();
//   const autoOk = cfg?.auto_approve ?? false;
//   const feed = await Rssfeed.findById(feedId).lean();
//   if (!feed?.link?.[0]) return;
//   const srcHost = safeHostname(feed.link[0]);
//   if (!srcHost) return;
//   let source = srcHost.split('.').slice(-2, -1)[0];
//   source =
//     source === 'hindustantimes'
//       ? 'Hindustan Times'
//       : source === 'indiatoday'
//       ? 'India Today'
//       : capitalizeFirst(source);
//   const imageSearchQuery = originalKeywords || heading;

//   const [summary, imgs] = await Promise.all([
//     summarize(cleanText(data), 2),
//     getImages(imageSearchQuery, 5)
//   ]);
//   if (!summary) return;
//   let summ = summary.replace(/^['"\s]+/, '');
//   if (summ.split(/\s+/).length > 90)
//     summ = summ.split(/\s+/).slice(0, 90).join(' ') + '.';
//   if (await similarArticle(summ)) return;

//   let isChatgpt = false;
//    if (summ.split(/\s+/).length > 80) {
//         console.log("Summary exceeds 80 words, checking rate limit for GPT-4 Mini...");
            
//         const canMakeRequest = await canMakeChatGPTRequest();
//         if (!canMakeRequest) {
//                 console.log("Rate limit exceeded. Skipping GPT-4 request.");
//         }
//         else {
//             console.log('Hitting chatgpt');
//             isChatgpt = true;
//             summ_text = await chatWithGPT4Mini(summ_text);
//             if(!summ_text){
//                 console.log('ISSUE | No response from Chatgpt')
//                 return;
//             }
//         }
//     }
//  const cats = [
//   ...new Set(
//     [
//       ...category,
//       ...getCategoryFromKeywords(keywords, heading)
//     ]
//       .filter(Boolean)
//       .filter(c => c.trim().length > 3)
//   )
// ];
//   const gradients = image ? await imageGradient(image) : [];
//   const langGuess = /[\u0900-\u097F]/.test(summ) ? 'hi' : 'en';
//   let cleanHeading = cleanText(heading);
//   let cleanBody = cleanText(summ);
//   if (langGuess === 'hi') {
//     cleanHeading = stripEnglishAndPunct(cleanHeading);
//     cleanBody = stripEnglishAndPunct(cleanBody);
//   }

//   max_limit--;
//   console.log('Inserting:', {
//     heading: cleanHeading,
//     approved: autoOk,
//     hash,
//     data: cleanBody,
//     language: langGuess,
//     keywords,
//     source,
//     image,
//     images: imgs,
//     image_gradient: gradients,
//     author,
//     publishedAt,
//     categories: cats
//   });

//   // await News.create({...});
// }
// catch (e) {
//   console.error('Error in summarize_data:', e.message);
//   return;
// }}

async function summarize_data(
  raw,
  image,
  keywords,
  heading,
  feedId,
  author = null,
  publishedAt = null,
  category = null
) {
  try {
    if (!raw) return;

    let data = cleanHtmlContent(raw);

    const hash = headingHash(heading);
    if (await News.exists({ hash })) return;
    if (max_limit <= 0) return;

    const hasOriginalKeywords =
      (Array.isArray(keywords) && keywords.length > 0) ||
      (typeof keywords === 'string' && keywords.trim().length > 0);
    const originalKeywords = hasOriginalKeywords ? keywords : null;

    if (!hasOriginalKeywords) {
      keywords = extractKeywords(`${heading} ${data}`, 4);
    }

    const cfg = await fetchFirebaseConfig();
    const autoOk = cfg?.auto_approve ?? false;

    const feed = await Rssfeed.findById(feedId).lean();
    if (!feed?.link?.[0]) return;
    const srcHost = safeHostname(feed.link[0]);
    if (!srcHost) return;
    let source = srcHost.split('.').slice(-2, -1)[0];
    source =
      source === 'hindustantimes'
        ? 'Hindustan Times'
        : source === 'indiatoday'
        ? 'India Today'
        : capitalizeFirst(source);

    const imageSearchQuery = originalKeywords || heading;
    const isHindi = /[\u0900-\u097F]/.test(data);

    let summ;

    if (isHindi) {
      // Extract first 2–3 Hindi sentences manually
      const sentences = data
        .split(/[।!?]/)
        .map(s => s.trim())
        .filter(s => s.length > 20); // skip tiny ones

      summ = sentences.slice(0, 3).join('। ') + '।';

    } else {
      const [summary] = await Promise.all([
        summarize(cleanText(data), 2),
      ]);
      if (!summary) return;
      summ = summary
        .replace(/[{}+;@#~^`_=*<>\\|]+/g, '')
        .replace(/[–—]/g, '-')
        .replace(/\s{2,}/g, ' ')
        .replace(/^['"\s]+/, '')
        .replace(/[।.]{2,}/g, '।')
        .replace(/\(\s*\)/g, '') 
        .trim();
    }
    let imgs = await getImages(imageSearchQuery, 5);
    // Limit to 100 words
    const words = summ.split(/\s+/);
    if (words.length > 100) {
      summ = words.slice(0, 100).join(' ') + (isHindi ? '।' : '.');
    }

    if (await similarArticle(summ)) return;

    let isChatgpt = false;
    if (!isHindi && words.length > 80) {
      const canMakeRequest = await canMakeChatGPTRequest();
      if (canMakeRequest) {
        const response = await chatWithGPT4Mini(summ);
        if (response) summ = response;
        else return;
      }
    }

    const cats = [
      ...new Set(
        [...(Array.isArray(category) ? category : [category]), ...getCategoryFromKeywords(keywords, heading)]
          .filter(Boolean)
          .filter(c => c.trim().length > 3)
      )
    ];

    const gradients = image ? await imageGradient(image) : [];
    const langGuess = isHindi ? 'hi' : 'en';

    let cleanHeading = cleanText(heading);
    let cleanBody = summ;

    if (isHindi) {
      cleanHeading = heading
        .replace(/[A-Za-z@#:/\-_.0-9%?&=]+/g, '')
        .replace(/["“”'‘’]+/g, '')
        .replace(/[{}+;]+/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/[।.]{2,}/g, '।')
        .replace(/\(\s*\)/g, '') 
        .trim();

      cleanBody = summ
        .replace(/[A-Za-z@#:/\-_.0-9%?&=]+/g, '')
        .replace(/["“”'‘’]+/g, '')
        .replace(/[{}+;]+/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/[।.]{2,}/g, '।')
        .replace(/\(\s*\)/g, '') 
        .trim();
    }

    max_limit--;
    // console.log('Inserting:', {
    //   heading: cleanHeading,
    //   approved: autoOk,
    //   hash,
    //   data: cleanBody,
    //   language: langGuess,
    //   keywords,
    //   source,
    //   image,
    //   images: imgs,
    //   image_gradient: gradients,
    //   author,
    //   publishedAt,
    //   categories: cats
    // });

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
      image_gradient: gradients,
      author,
      publishedAt,
      categories: cats
     });
  } catch (e) {
    console.error('Error in summarize_data:', e.message);
    return;
  }
}




async function data_update(urls, feedId){
  for(const url of urls){
    try{
      const html = (await axios.get(url,{httpsAgent:new https.Agent({rejectUnauthorized:false})})).data;
      const $ = cheerio.load(html);
      const scripts = $('script[type^="application/ld+json"]');
      for(let i=0;i<scripts.length;i++){
        try{
          let obj = JSON.parse($(scripts[i]).html().replace(/[\u0000-\u001F]+/g,''));
          if(obj['@graph']) obj = obj['@graph'].find(o=>['NewsArticle','Article'].includes(o['@type']));
          if(Array.isArray(obj)) obj = obj.find(o=>o['@type']==='NewsArticle');

          if(obj && ['NewsArticle','Article','LiveBlogPosting'].includes(obj['@type'])){
            let body='', img='', kw=[], date='', section='', headline=obj.headline;
            if(url.includes('theguardian.com')){
              body = await guardianScraper(url);
              img  = Array.isArray(obj.image)?obj.image[0]:'';
              kw   = obj.keywords||[];
              date = obj.datePublished||'';
              section=[new URL(obj['@id']).pathname.split('/')[1]];
            }
            else if (url.includes('aljazeera.com')) {
                    body = await alJazeeraScraper(url);
                    if (Array.isArray(obj.image) && obj.image.length) {
                      img = typeof obj.image[0] === 'string'
                              ? obj.image[0]
                              : (obj.image[0].url || '');
                    } else if (obj.image?.url) {
                      img = obj.image.url;
                    } else {
                      img = '';
                    }
                    kw = obj.keywords || [];
                    date = obj.datePublished || '';
                    const canonical = obj.mainEntityOfPage || url;
                    try {
                      section = [new URL(canonical).pathname.split('/')[1]];
                    } catch {
                      section = [];
                    }
                  }
             else {
              body = obj.articleBody || obj.description || '';
              img  = obj.image?.url || (Array.isArray(obj.image)?obj.image[0]?.url:'');
              kw   = obj.keywords||[];
              date = obj.datePublished||'';
              section=obj.articleSection||'';
            }
            body = cleanHtmlContent(body);
            console.log('The url is : ', url);
            await summarize_data(body,img,kw,headline,feedId,null,date,section);
          }
        }catch(e){ 
            console.error('Error parsing JSON-LD:', e.message );
         }
      }
    }catch(e){
      console.error('Fetch err',e.message);
    }
  }
}

async function scrapeWebsite(){
  try{
    if(mongoose.connection.readyState!==1) await connectDB();
    console.log('Scraping started...');
    const feeds = await Rssfeed.find({success:false}).sort({createdAt:-1}).lean();
    for(const feed of feeds){
      await new Promise(r=>setTimeout(r,800));
      await data_update(feed.link,feed._id);
    }
  }catch(e){ console.error('Fatal scrape err',e.message); }
}

module.exports = scrapeWebsite;
