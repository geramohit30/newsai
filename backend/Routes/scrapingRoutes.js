const express = require('express');
const router = express.Router();
const scrapingController = require('../Controllers/scrapingController');
const { authMiddleware } = require('../Middlewares/authMiddleware');
const { adminAuth } = require('../Middlewares/adminMiddleware');


router.get('/scrape-now', scrapingController.scrapeNow);
router.get('/del-scrape', scrapingController.deleteOld);


module.exports = router;
