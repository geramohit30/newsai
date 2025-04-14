const axios = require('axios');
const cheerio = require('cheerio');
const he = require('he')
const https = require('https');
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
const summarizeText = require('../Summarize/hugging_face');
const nlp = require('../Summarize/nlp')
const News = require('../Models/newsModel');
const Rssfeed = require('../Models/rssfeedModel');
const getCategoryFromKeywords = require('../Summarize/category');
const getImages = require('./Img_scrapper')


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

async function summarize_data(data, image, keywords, heading, heading_id) {
    if (!data) {
        console.log('The data value is:', data);
        await Rssfeed.updateOne(
            { _id: heading_id },
            { $set: { success: false } }
        );
        return;
    }

    const summ_text = await nlp(data);
    if (!summ_text) {
        console.log('Got empty result');
        return;
    }

    const category = getCategoryFromKeywords(keywords);
    
    let head;
    try {
        head = cleanText(heading);
    } catch (error) {
        console.log('Error while getting clean heading', error);
    }

    const images = await getImages(keywords, 5);

    await News.create({
        heading: head ? head : heading,
        keywords,
        data: summ_text,
        image: image ? image.url : "",
        images: images,
        feedId: heading_id,
        categories: category
    });

    await Rssfeed.updateOne(
        { _id: heading_id },
        { $set: { success: true } }
    );

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
                    // console.log(parsedata['articleBody'])
                    summarize_data(parsedata['articleBody'], parsedata['image'], parsedata['keywords'], parsedata['headline'], heading_id);
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
            // return;
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


scrapeWebsite();

// module.exports = scrapeWebsite;
