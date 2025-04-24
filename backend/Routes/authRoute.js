const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');
const {authMiddleware} = require('../Middlewares/authMiddleware')

router.post('/register', authController.registerUser);
router.post('/login/otp', authController.loginWithOTP);
router.post('/login', authController.loginUser);
router.get('/user', authMiddleware, authController.userData);
router.post('/user/update', authMiddleware, authController.userUpdate);

module.exports = router;
