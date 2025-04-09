const axios = require('axios');
const cheerio = require('cheerio');
const he = require('he')
const https = require('https');
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
const summarizeText = require('../Summarize/hugging_face');
const nlp = require('../Summarize/nlp')
const News = require('../Models/newsModel');
const Headings = require('../Models/headingModel');
const getCategoryFromKeywords = require('../Summarize/category');


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
    if(!data){
        console.log('The data value is : ', data);
        return
    }
    const summ_text = await nlp(data);
    if (!summ_text) {
        console.log('Got empty result');
        return;
    }
    const category = getCategoryFromKeywords(keywords);
    try {
        const head = cleanText(heading)
    } catch (error) {
        console.log('Error while get clean heading', error);
    }

    await News.create({
        heading:head?head:heading,
        keywords,
        data: summ_text,
        image,
        article_id: heading_id,
        categories:category
    });
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
            return;
        }

        const all_data = await Headings.find().lean();

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
