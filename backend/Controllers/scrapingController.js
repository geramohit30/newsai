const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
const runScraping = require('../Scrappers/Scrap_heading');
const scrapeWebsite = require('../Scrappers/Scrap_website');
const ScraperLock = require('../Models/scrapperLock');
const News = require('../Models/newsModel');

async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
}

exports.scrapeNow  = async (req, res) => {
  try {
    await ensureDbConnection();
    console.log('Manually triggering scraping...');
    const lockKey = 'scraper_lock';
    try {
      await ScraperLock.create({ name: lockKey });
      console.log('Lock acquired. Running scraper.');

      runScraping();
      scrapeWebsite();

      console.log('Scraping job completed!');
  } catch (error) {
      if (error.code === 11000) {
          console.log('Scraper already running or lock still valid. Skipping this run.');
          res.status(200).json({ message: 'Scraper already running or lock still valid' });
      } else {
          console.error('Error during scraping:', error);
          res.status(200).json({ message: error });
      }
  }
    res.status(200).json({ message: 'Scraping is being processed' });
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ message: 'Scraping failed', error: err.message });
  }
};

exports.deleteOld = async (req, res) => {
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
          res.status(200).json({ message: 'Deletion already in process or lock still valid' });
      } else {
          console.error('Error during scraping:', error);
          res.status(200).json({ message: error });
      }
  }

    res.status(200).json({ message: 'Deleted old news items', deletedCount: result?result.deletedCount:0 });
  } catch (err) {
    console.error('Deletion error:', err);
    res.status(500).json({ message: 'Deletion failed', error: err.message });
  }
};

