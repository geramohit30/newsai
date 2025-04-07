const express = require('express');
const router = express.Router();
const newsController = require('../Controllers/newsController');
const { authMiddleware } = require('../Middlewares/authMiddleware');


router.get('/articles', newsController.getNews);
router.get('/article/:id', newsController.getNewsById);
router.get('/articles/pending', adminAuth, newsController.getPendingNews);
router.post('/article/:id/approve', adminAuth, newsController.approveNewsById);

module.exports = router;
