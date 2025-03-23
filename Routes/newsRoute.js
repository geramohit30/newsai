const express = require('express');
const router = express.Router();
const newsController = require('../Controllers/newsController');
const { authMiddleware } = require('../Middlewares/authMiddleware');

// Routes with Authentication
router.get('/news', newsController.getNews);
router.get('/news/:id', newsController.getNewsById);

module.exports = router;
