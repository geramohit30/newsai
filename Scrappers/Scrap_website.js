const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
const summarizeText = require('../Summarize/hugging_face');
const News = require('../Models/newsModel');
const Headings = require('../Models/headingModel');

async function summarize_data(data, image, keywords, heading, heading_id) {
    const summ_text = await summarizeText(data);
    if (!summ_text) {
        console.log('Got empty result');
        return;
    }

    await News.create({
        heading,
        keywords,
        data: summ_text,
        image,
        article_id: heading_id
    });
}

async function data_update(url, heading_id) {
    console.log('Processing URL:', url);

    try {
        const { data } = await axios.get(url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        const $ = cheerio.load(data);

        $('script[type^="application"]').each((_, element) => {
            try {
                const jsonText = $(element).html().trim();
                const parsedata = JSON.parse(jsonText);

                if (parsedata['@type'] === "NewsArticle" && parsedata['headline']) {
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
            console.error(" MongoDB not connected.");
            return;
        }

        const all_data = await Headings.find().lean();

        if (!all_data.length) {
            console.log("No headings found in the database.");
            return;
        }

        for (const doc of all_data) {
            await new Promise(resolve => setTimeout(resolve, 2800));
            await data_update(doc.data.link, doc._id);
        }

    } catch (error) {
        console.error('Error scraping website:', error.message);
    }
}



module.exports = scrapeWebsite;
