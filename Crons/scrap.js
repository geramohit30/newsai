const cron = require('node-cron');
const runScraping = require('../Scrappers/Scrap_heading');
const scrapeWebsite = require('../Scrappers/Scrap_website');

async function runScheduledScraper() {
    console.log('Starting full scraping process...');

    await runScraping();  // Fetches heading from rss
    await scrapeWebsite(); // Process heading data to fetch post content

    console.log('Scraping job completed!');
}


cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled scraping job...');
    await runScheduledScraper();
});

runScheduledScraper();
