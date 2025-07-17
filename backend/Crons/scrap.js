const cron = require('node-cron');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require(path.resolve(__dirname, '../Utils/mongo_utils'));
const runScraping = require(path.resolve(__dirname, '../Scrappers/Scrap_heading'));
const scrapeWebsite = require(path.resolve(__dirname, '../Scrappers/Scrap_website'));
const ScraperLock = require(path.resolve(__dirname, '../Models/scrapperLock'));

async function runScheduledScraper() {
  console.log('🔁 Starting scraping process...');

  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('🔗 Connecting to MongoDB...');
      await connectDB();
    }

    const lockKey = 'scraper_lock';

    // Attempt to acquire lock
    await ScraperLock.create({ name: lockKey });
    console.log('🔒 Lock acquired. Running scraper...');

    await runScraping();
    await scrapeWebsite();

    console.log('✅ Scraping job completed!');
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️ Scraper already running or lock exists. Skipping this run.');
    } else {
      console.error('❌ Error during scraping:', error);
    }
  }
}

cron.schedule('0 * * * *', async () => {
  console.log('📅 Running scheduled scraping job...');
  await runScheduledScraper();
});
