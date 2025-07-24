const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
const runScraping = require('../Scrappers/Scrap_heading');
const scrapeWebsite = require('../Scrappers/Scrap_website');
const ScraperLock = require('../Models/scrapperLock');
const News = require('../Models/newsModel');
const MongoConnect = require('../Utils/mongo_connect');

exports.scrapeNow  = async (req, res) => {
  res.status(200).json({ message: 'Scraping is being processed...' })
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
          return
      } else {
          await ScraperLock.deleteOne({ name: lockKey }); // Release the lock after scraping
          console.log('releasing lock: scraping failure.');
          console.error('Error during scraping:', error);
          return
      }
  }
    return
  } catch (err) {
    console.error('Scraping error:', err);
    return
  }
};

exports.deleteOld = async (req, res) => {
  return res.status(200).json({ message: 'Deletion already in process or lock still valid' });
  try {
    console.log('Insidee')
    await ensureDbConnection();
    const lockKey = 'scraper_lock_delete';
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    let result = null;
    try {
      await ScraperLock.create({ name: lockKey });
      console.log('Lock acquired. Running deletion.');
      // const result = await News.deleteMany({ createdAt: { $lte: twoHoursAgo } });
    }
    catch (error) {
      if (error.code === 11000) {
          console.log('Deletion already in process or lock still valid. Skipping this run.');
          return res.status(200).json({ message: 'Deletion already in process or lock still valid' });
      } else {
          console.error('Error during scraping:', error);
          return res.status(200).json({ message: error });
      }
  }

    return res.status(200).json({ message: 'Deleted old news items', deletedCount: result?result.deletedCount:0 });
  } catch (err) {
    console.error('Deletion error:', err);
    res.status(500).json({ message: 'Deletion failed', error: err.message });
  }
};

