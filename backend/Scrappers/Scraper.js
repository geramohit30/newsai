require('dotenv').config({path:'/usr/src/.env'});
const cron = require('node-cron');
const path = require('path');

const MongoConnect = require('../Utils/mongo_connect');
const runScraping = require(path.resolve(__dirname, '../Scrappers/Scrap_heading'));
const scrapeWebsite = require(path.resolve(__dirname, '../Scrappers/Scrap_website'));
const ScraperLock = require(path.resolve(__dirname, '../Models/scrapperLock'));

async function runScheduledScraper() {
    const lockKey = 'scraper_lock';
    try {
        await MongoConnect();
        console.log('Manually triggering scraping...');
        try {
            await ScraperLock.create({ name: lockKey });
            console.log('Lock acquired. Running scraper.');

            await runScraping();
            await scrapeWebsite();
            await ScraperLock.deleteOne({ name: lockKey }); // Release the lock after scraping
            console.log('Lock released after scraping.');
            console.log('Scraping job completed!');
        } catch (error) {
            if (error.code === 11000) {
                console.log('Scraper already running or lock still valid. Skipping this run.');
                process.exit(1);
            } else {
                await ScraperLock.deleteOne({ name: lockKey }); // Release the lock after scraping
                console.log('releasing lock: scraping failure.');
                console.error('Error during scraping:', error);
                process.exit(1);
            }
        }
    } catch (err) {
        console.error('Scraping error:', err);
        process.exit(1);
    }
    process.exit(0);
}
runScheduledScraper();
