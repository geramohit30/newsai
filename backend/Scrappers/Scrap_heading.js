require('dotenv').config();
const axios = require('axios');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');
const connect = require('../Utils/mongo_utils');
const Rssfeed = require('../Models/rssfeedModel');
const parser = new XMLParser();
const URLS = process.env.SCRAPPING_URLS ? process.env.SCRAPPING_URLS.split(',') : [];

async function scrapheadings(url) {

    try {
        const { data } = await axios.get(url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        const parsedData = parser.parse(data);

        if (parsedData && parsedData['rss']?.['channel']?.['item']) {
            const items = parsedData['rss']['channel']['item'];

            const formattedItems = items
                .filter(ele => ele.title && ele.description)
                .map(ele => ({
                    title: ele.title,
                    description: ele.description,
                    link: ele.link ? [ele.link] : [], 
                    priority: ele.priority ? Number(ele.priority) : 0 
                }));

            if (formattedItems.length > 0) {
                await Rssfeed.insertMany(formattedItems);
                console.log(`Successfully inserted ${formattedItems.length} headings from ${url}`);
            } else {
                console.log(`No valid headings found in ${url}`);
            }
    }} catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
    }
}

async function runScraping() {
    console.log('Starting heading scraping...', URLS);
    
    for (const url of URLS) {
        console.log(`Scraping: ${url}`);
        await scrapheadings(url);
    }

    console.log('Heading scraping completed!');
}

// runScraping()
module.exports = runScraping;
