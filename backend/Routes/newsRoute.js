const express = require('express');
const router = express.Router();
const newsController = require('../Controllers/newsController');
const { authMiddleware, authNewsMiddleware } = require('../Middlewares/authMiddleware');
const { adminAuth } = require('../Middlewares/adminMiddleware');

router.get('/articles',authNewsMiddleware, newsController.getNews);
router.get('/categories',newsController.getCategories)
router.get('/article/:id', authNewsMiddleware, newsController.getNewsById);
router.get('/articles/pending', newsController.getPendingNews);
router.post('/article/approve/:id', newsController.approveNewsById);

module.exports = router;
