const express = require('express');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

// 用户注册
router.post('/register', validateRegister, AuthController.register);

// 用户登录
router.post('/login', validateLogin, AuthController.login);

// 获取当前用户信息（需要认证）
router.get('/me', authMiddleware, AuthController.me);

// 用户登出
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;