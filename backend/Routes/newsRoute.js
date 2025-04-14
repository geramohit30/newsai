const express = require('express');
const router = express.Router();
const newsController = require('../Controllers/newsController');
const { authMiddleware } = require('../Middlewares/authMiddleware');
const { adminAuth } = require('../Middlewares/adminMiddleware');


router.get('/articles', newsController.getNews);
router.get('/categories',newsController.getCategories)
router.get('/article/:id', newsController.getNewsById);
router.get('/articles/pending', newsController.getPendingNews);
router.post('/article/approve/:id', newsController.approveNewsById);


module.exports = router;
