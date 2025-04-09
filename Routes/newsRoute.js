const express = require('express');
const router = express.Router();
const newsController = require('../Controllers/newsController');
const { authMiddleware } = require('../Middlewares/authMiddleware');
const { adminAuth } = require('../Middlewares/adminMiddleware');


router.get('/articles', newsController.getNews);
router.get('/article/:id', newsController.getNewsById);
router.get('/articles/pending', adminAuth, newsController.getPendingNews);
router.post('/article/:id/approve', adminAuth, newsController.approveNewsById);
router.get('/article/categories',newsController.getCategories)

module.exports = router;
