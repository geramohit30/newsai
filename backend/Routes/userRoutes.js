const express = require('express');
const { authMiddleware } = require('../Middlewares/authMiddleware');
const savedNewsController = require('../Controllers/userNews')
const router = express.Router();
 
router.post('/article/save', authMiddleware, savedNewsController.saveNews);
router.post('/article/unsave', authMiddleware, savedNewsController.unsaveNews);
router.get('/article/getAll', authMiddleware, savedNewsController.getSavedNews);

module.exports = router;