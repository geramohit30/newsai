const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const connectDB = require('../Utils/mongo_utils');
const runScraping = require('../Scrappers/Scrap_heading');
const scrapeWebsite = require('../Scrappers/Scrap_website');
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
    await runScraping();
    await scrapeWebsite();
    res.status(200).json({ message: 'Scraping completed successfully' });
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ message: 'Scraping failed', error: err.message });
  }
};

exports.deleteOld = async (req, res) => {
  try {
    console.log('Insidee')
    await ensureDbConnection();

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await News.deleteMany({ createdAt: { $lte: twoHoursAgo } });

    res.status(200).json({ message: 'Deleted old news items', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Deletion error:', err);
    res.status(500).json({ message: 'Deletion failed', error: err.message });
  }
};

