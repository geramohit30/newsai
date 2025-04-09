const cron = require('node-cron');
const runScraping = require('../Scrappers/Scrap_heading');
const scrapeWebsite = require('../Scrappers/Scrap_website');
const connectDB = require('../Utils/mongo_utils')
const mongoose = require('mongoose');

async function runScheduledScraper() {
    console.log('Starting full scraping process...');
    if(mongoose.connection.readyState!=1){
        await connectDB()
    }

    await runScraping();  // Fetches heading from rss
    await scrapeWebsite(); // Process heading data to fetch post content

    console.log('Scraping job completed!');
}


cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled scraping job...');
    await runScheduledScraper();
});

runScheduledScraper();
