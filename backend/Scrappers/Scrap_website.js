const axios = require('axios');
const cheerio = require('cheerio');
const he = require('he')
const https = require('https');
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
const summarizeText = require('../Summarize/hugging_face');
const nlp = require('../Summarize/nlp')
const nlp2 = require('../Summarize/nlp2')
const {fetchFirebaseConfig, clearFirebaseConfigCache}  = require('../Config/FirebaseLimitConfig');
const News = require('../Models/newsModel');
const Rssfeed = require('../Models/rssfeedModel');
const getCategoryFromKeywords = require('../Summarize/category');
const getImages = require('./Img_scrapper')
const { URL } = require('url');
const firebaseConfig = require('../Config/FirebaseConfig')

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

function cleanText(text) {
    let cleanedText = he.decode(text);
    UNWANTED_PHRASES.forEach(phrase => {
        const regex = new RegExp(`\\b${phrase}\\b.*?(?=\\.|\\!|\\?)`, "gi");
        cleanedText = cleanedText.replace(regex, "").trim();
    });
    cleanedText = cleanedText.replace(/\s+/g, " ");
    return cleanedText;
}

async function summarize_data(data, image, keywords, heading, heading_id, author = null, publishedAt = null, category = null) {
    if (!data) {
        console.log('The data value is:', data);
        await Rssfeed.updateOne({ _id: heading_id }, { $set: { success: false } });
        return;
    }
    const config = await fetchFirebaseConfig();
    let summ_text, images, head, source, auto_approve;
    auto_approve = config && config.auto_approve?config.auto_approve:false;
    try {
        const feed = await Rssfeed.findById(heading_id);

        if (!feed || !feed.link) {
            console.log(`No URL found for feed with ID ${heading_id}`);
            return;
        }

        source = new URL(feed.link[0]).hostname.split('.').slice(-2, -1)[0].trim();

        [summ_text, images] = await Promise.all([
            nlp2(data, 2),
            getImages(keywords, 5)
        ]);

        if (!summ_text) {
            console.log('Got empty summarization result');
            return;
        }
        summ_text = summ_text.replace(/^["',\s]+/, '');

        const words = summ_text.trim().split(/\s+/);
        if (words.length > 90) {
            summ_text = words.slice(0, 90).join(' ') + '... read more';
        }

        try {
            head = cleanText(heading);
        } catch (error) {
            console.log('Error while cleaning heading:', error);
            head = heading;
        }

        let getCategory = getCategoryFromKeywords(keywords);
        if (getCategory.length === 1 && getCategory[0] === "Uncategorized") {
            getCategory = [];
        }
        const uniqueCategories = [...new Set([category, ...getCategory].filter(Boolean))];

        await News.create({
            heading: head,
            approved: auto_approve?auto_approve:false,
            keywords,
            data: summ_text,
            image: image?.url || "",
            images,
            feedId: heading_id,
            categories: uniqueCategories,
            source,
            sourceUrl: feed.link[0].trim(),
            publishedAt
        });

        await Rssfeed.updateOne({ _id: heading_id }, { $set: { success: true } });

    } catch (err) {
        console.error('Error during summarize_data:', err);
        await Rssfeed.updateOne({ _id: heading_id }, { $set: { success: false} });
    }
}


async function data_update(url, heading_id) {
    console.log('Processing URL:', url[0]);

    try {
        const { data } = await axios.get(url[0], {
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        const $ = cheerio.load(data);

        $('script[type^="application"]').each((_, element) => {
            try {
                let jsonText = $(element).html().trim();
                jsonText = jsonText.replace(/[\u0000-\u001F]+/g, "");
                const parsedata = JSON.parse(jsonText);
                if (parsedata['@type'] === "NewsArticle" && parsedata['headline']) {
                    summarize_data(parsedata['articleBody'], parsedata['image'], parsedata['keywords'], parsedata['headline'], heading_id, null, parsedata['datePublished'],parsedata['articleSection']);
                }
            } catch (error) {
                console.log('Error in article scraping:', error.message);
            }
        });
    } catch (error) {
        console.error('Error fetching article:', error.message);
    }
}

async function scrapeWebsite() {
    try {
        if (mongoose.connection.readyState !== 1) {
            console.error("MongoDB not connected.");
            await connectDB();
        }

        const all_data = await Rssfeed.find().lean();

        if (!all_data.length) {
            console.log("No headings found in the database.");
            return;
        }

        for (const doc of all_data) {
            try{
            await new Promise(resolve => setTimeout(resolve, 1000));
            await data_update(doc.link, doc._id);
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
