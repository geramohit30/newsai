const axios = require('axios');
const cheerio = require('cheerio');
const he = require('he')
const https = require('https');
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
const summarizeText = require('../Summarize/hugging_face');
const nlp = require('../Summarize/nlp')
const {summarize,cleanText} = require('../Summarize/nlp2')
const {fetchFirebaseConfig, clearFirebaseConfigCache}  = require('../Config/FirebaseLimitConfig');
const News = require('../Models/newsModel');
const Rssfeed = require('../Models/rssfeedModel');
const getCategoryFromKeywords = require('../Summarize/category');
const getImages = require('./Img_scrapper')
const { URL } = require('url');
const firebaseConfig = require('../Config/FirebaseConfig')
const crypto = require('crypto');
const stringSimilarity = require('string-similarity');
const imageGradient = require('../Utils/color_picker')
const ApiCall = require('../Models/chatgptModel')
const chatWithGPT4Mini = require('../Utils/chatgpt_utils')

const UNWANTED_PHRASES = [
    "click here", 
    "read more", 
    "follow us", 
    "subscribe", 
    "see also", 
    "advertisement",
    "exclusive",
    "limited time offer",
    "new offer"
];

function generateHeadingHash(heading) {
    const cleanedHeading = cleanText(heading || "");
    return crypto.createHash('sha256').update(cleanedHeading).digest('hex');
}

function capitalizeSentences(text) {
    return text.replace(/(^\s*\w|[.!?]\s*\w)/g, match => match.toUpperCase());
}
function cleanAlsoRead(text) {
    const regex = /ALSO READ\s*[:|–-]?\s*/gi;
    const matches = [...text.matchAll(regex)];
  
    if (matches.length === 0) return text.trim();
    if (matches.length === 1) {
      const firstIndex = matches[0].index;
      if (firstIndex === 0) {
        return text.slice(matches[0][0].length).trim();
      } else {
        return text.substring(0, firstIndex).trim();
      }
    }
    const secondIndex = matches[1].index;
    return text.substring(0, secondIndex).trim();
  }

async function isSimilarArticle(newText, threshold = 0.9) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentNews = await News.find(
        { publishedAt: { $gte: thirtyDaysAgo } }, 
        { data: 1 }
    ).sort({ createdAt: -1 }).lean();

    for (const article of recentNews) {
        const similarity = stringSimilarity.compareTwoStrings(newText, article.data);
        if (similarity > threshold) {
            console.log(`Found similar article with similarity: ${similarity}`);
            return true;
        }
    }
    return false;
}

function cleanTextt(text) {
    let cleanedText = he.decode(text);
    UNWANTED_PHRASES.forEach(phrase => {
        const regex = new RegExp(`\\b${phrase}\\b.*?(?=\\.|\\!|\\?)`, "gi");
        cleanedText = cleanedText.replace(regex, "").trim();
    });
    cleanedText = cleanedText.replace(/\s+/g, " ");
    return cleanedText;
}

function containsHtmlEntities(text) {
    return /&(?:[a-zA-Z]+|#\d+|#x[a-fA-F0-9]+);/.test(text);
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
function extractKeywords(text, numKeywords = 5) {
    text = text.replace(/[^\w\s]/g, "").toLowerCase();
    
    const wordCounts = {};
    const words = text.split(/\s+/);

    words.forEach(word => {
        if (word.length > 2) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });
    const sortedWords = Object.entries(wordCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, numKeywords)
        .map(([word]) => word);
    return sortedWords.join(', ');
}

async function summarize_data(data, image, keywords, heading, heading_id, author = null, publishedAt = null, category = null) {
    if (!data) {
        console.log('The data value is:', data);
        await Rssfeed.updateOne({ _id: heading_id }, { $set: { success: false } });
        return;
    }
    const headingHash = generateHeadingHash(heading);
    const existsByHeading = await News.findOne({ hash: headingHash });
    if (existsByHeading) {
        console.log('Duplicate found by heading hash, skipping...');
        return;
    }
    if (!keywords || keywords.length === 0) {
        console.log('Generating keywords from heading and data...');
        const combinedText = heading + " " + data;
        keywords = extractKeywords(combinedText, 5);
        console.log('Generated Keywords:', keywords);
    }
    const config = await fetchFirebaseConfig();
    let summ_text, images, head, source, auto_approve;
    auto_approve = config && config.auto_approve ? config.auto_approve : false; 
    data = cleanAlsoRead(data);
    try {
        const feed = await Rssfeed.findById(heading_id);
        if (!feed || !feed.link) {
            console.log(`No URL found for feed with ID ${heading_id}`);
            return;
        }

        source = new URL(feed.link[0]).hostname.split('.').slice(-2, -1)[0].trim();

        [summ_text, images] = await Promise.all([
            summarize(cleanText(data), 2),
            getImages(keywords, 5)
        ]);

        if (!summ_text) {
            console.log('Got empty summarization result');
            return;
        }
        summ_text = summ_text.replace(/^["',\s]+/, '');
        const words = summ_text.trim().split(/\s+/);
        if (words.length > 90) {
            summ_text = words.slice(0, 90).join(' ') + ".";
        }
        let isChatgpt = false;
        if (words.length > 80) {
            console.log("Summary exceeds 80 words, checking rate limit for GPT-4 Mini...");
            
            const canMakeRequest = await canMakeChatGPTRequest();
            if (!canMakeRequest) {
                console.log("Rate limit exceeded. Skipping GPT-4 request.");
            }
            else {
                console.log('Hitting chatgpt');
                isChatgpt = true;
                summ_text = await chatWithGPT4Mini(summ_text);
                if(!summ_text){
                    console.log('ISSUE | No response from Chatgpt')
                    return;
                }
            }
        }
        try {
            head = cleanTextt(heading);
        } catch (error) {
            console.log('Error while cleaning heading:', error);
            head = heading;
        }

        // Check for duplicate content
        const isDuplicateByContent = await isSimilarArticle(summ_text);
        if (isDuplicateByContent) {
            console.log('Duplicate found by content similarity, skipping...');
            return;
        }

        let getCategory = getCategoryFromKeywords(keywords, head);
        if (getCategory.length === 1 && getCategory[0] === "Uncategorized") {
            getCategory = [];
        }
        const uniqueCategories = [...new Set([category, ...getCategory].filter(Boolean))];
        source = source == "hindustantimes" ? "Hindustan Times" : source == "indiatoday" ? "India Today" : capitalizeSentences(source);

        let gradients = [];
        if (image) gradients = await imageGradient(image);
        // Save the processed news item
        let clean_text = cleanText(head);
        let clean_body = cleanText(summ_text);
        if(containsHtmlEntities(cleanText) || containsHtmlEntities(clean_body)){
            return;
        }
        await News.create({
            heading: cleanText(head),
            approved: auto_approve ? auto_approve : false,
            keywords,
            data: cleanText(summ_text),
            image: image?.url || "",
            images,
            feedId: heading_id,
            categories: uniqueCategories,
            source,
            sourceUrl: feed.link[0].trim(),
            publishedAt,
            hash: headingHash,
            gradient: gradients,
            isChatGpt: isChatgpt
        });

        await Rssfeed.updateOne({ _id: heading_id }, { $set: { success: true } });

    } catch (err) {
        console.error('Error during summarize_data:', err);
        await Rssfeed.updateOne({ _id: heading_id }, { $set: { success: false } });
    }
}

async function data_update(urls, heading_id) {
    for (const url of urls) {
        console.log('Processing URL:', url);
        try {
            const { data } = await axios.get(url, {
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            });
            const $ = cheerio.load(data);

            $('script[type^="application/ld+json"]').each((_, element) => {
                try {
                    let jsonText = $(element).html().trim();
                    jsonText = jsonText.replace(/[\u0000-\u001F]+/g, "");
                    let parsedata = JSON.parse(jsonText);
                    if ((parsedata['@type'] === "NewsArticle" || parsedata['@type'] === "Article") ||
                    (parsedata['@graph'] && parsedata['@graph'][0]['@type'] === "NewsArticle")){
                        if(parsedata['@graph']){
                            parsedata = parsedata['@graph'][0];
                        }
                        const headline = parsedata.headline || 'No headline available';
                        const articleBody = parsedata.articleBody || parsedata.description || '';
                        const image = parsedata.image?.url;
                        const keywords = parsedata.keywords || [];
                        const datePublished = parsedata.datePublished || '';
                        const articleSection = parsedata.articleSection || '';
                        summarize_data(articleBody, image, keywords, headline, heading_id, null, datePublished, articleSection);
                    } else {
                        console.log('No valid NewsArticle data found in:', url);
                    }
                } catch (error) {
                    console.log('Error parsing JSON-LD data:', error.message);
                }
            });
        } catch (error) {
            console.error('Error fetching article:', error.message);
        }
    }
}
// async function data_update(url, heading_id) {
//     console.log('Processing URL:', url[0]);

//     try {
//         const { data } = await axios.get(url[0], {
//             httpsAgent: new https.Agent({ rejectUnauthorized: false })
//         });

//         const $ = cheerio.load(data);

//         $('script[type^="application"]').each((_, element) => {
//             try {
//                 let jsonText = $(element).html().trim();
//                 jsonText = jsonText.replace(/[\u0000-\u001F]+/g, "");
//                 const parsedata = JSON.parse(jsonText);
//                 console.log('Just outside', parsedata);
//                 if (parsedata['@type'] === "NewsArticle" && parsedata['headline']) {
//                     console.log('INSIDE', parsedata['headline']);
//                     summarize_data(parsedata['articleBody'], parsedata['image'], parsedata['keywords'], parsedata['headline'], heading_id, null, parsedata['datePublished'],parsedata['articleSection']);
//                 }
//             } catch (error) {
//                 console.log('Error in article scraping:', error.message);
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching article:', error.message);
//     }
// }

async function scrapeWebsite() {
    let max_count = 100;
    try {
        if (mongoose.connection.readyState !== 1) {
            console.log("MongoDB not connected.");
            await connectDB();
        }

        const all_data = await Rssfeed.find({success:false}).sort({ createdAt: -1 }).lean();

        if (!all_data.length) {
            console.log("No headings found in the database.");
            return;
        }
        for (const doc of all_data) {
            if(max_count<=0){
                break;
            }
            try{
            await new Promise(resolve => setTimeout(resolve, 1000));
            await data_update(doc.link, doc._id);
            max_count--;
        }
        catch(err){
            console.log('Error in data update', err.message, doc);
        }
        }

    } catch (error) {
        console.error('Error scraping website:', error.message);
    }
}

module.exports = scrapeWebsite;
