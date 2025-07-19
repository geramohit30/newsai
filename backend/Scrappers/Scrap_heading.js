require('dotenv').config();
const axios = require('axios');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
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

            // const formattedItems = items
            //     .filter(ele => ele.title && ele.description)
            //     .map(ele => ({
            //         title: ele.title,
            //         description: ele.description,
            //         link: ele.link ? [ele.link] : [], 
            //         priority: ele.priority ? Number(ele.priority) : 0 
            //     }));

            // if (formattedItems.length > 0) {
            //     // await Rssfeed.insertMany(formattedItems);
            //     let bulkOps = formattedItems.map(doc => ({
            //         updateOne: {
            //             filter: { title: doc.title },          // match condition
            //             update: { $setOnInsert: doc },         // insert only if not exists
            //             upsert: true
            //         }
            //     }));
            //     // in case we have index conflicts then ordered false will skip only conflicted entries and not all
            //     await Rssfeed.bulkWrite(bulkOps, { ordered: false });
            //     console.log(`Successfully inserted ${formattedItems.length} headings from ${url}`);
            // } else {
            //     console.log(`No valid headings found in ${url}`);
            // }
            // Step 1: Filter & format the input
            const formattedItems = items
                .filter(ele => ele.title && ele.description && ele.link)
                .map(ele => ({
                    title: ele.title,
                    description: ele.description,
                    link: ele.link ? [ele.link] : [], 
                    priority: ele.priority ? Number(ele.priority) : 0
                }));

            if (formattedItems.length > 0) {
                // Step 2: Get existing links from DB (assume first element in array is unique)
                const links = formattedItems.map(item => item.link[0]); // extract plain string
                const existingDocs = await Rssfeed.find({ link: { $in: links } }).select("link");
                const existingLinks = new Set(existingDocs.map(doc => doc.link[0]));

                // Step 3: Filter out items that already exist
                const newItems = formattedItems.filter(item => !existingLinks.has(item.link[0]));

                // Step 4: Insert only the new items
                if (newItems.length > 0) {
                    await Rssfeed.insertMany(newItems, { ordered: false });
                    console.log(`Inserted ${newItems.length} new headings from ${url}`);
                } else {
                    console.log(`No new headings to insert from ${url}`);
                }
            } else {
                console.log(`No valid headings found in ${url}`);
            }
        }
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
    }
}

async function runScraping() {
    console.log('Starting heading scraping...', URLS);
    if (mongoose.connection.readyState !== 1) {
        console.error("MongoDB not connected.");
        await connectDB();
        // return;
    }
    for (const url of URLS) {
        console.log(`Scraping: ${url}`);
        await scrapheadings(url);
    }

    console.log('Heading scraping completed!');
}

module.exports = runScraping;
