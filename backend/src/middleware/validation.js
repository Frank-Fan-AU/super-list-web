const { body, validationResult } = require('express-validator');

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// 用户注册验证规则
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  handleValidationErrors
];

// 用户登录验证规则
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// 超市创建验证规则
const validateStore = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Store name must be between 1 and 50 characters'),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  handleValidationErrors
];

// 商品创建验证规则
const validateItem = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item content must be between 1 and 200 characters'),
  body('storeId')
    .isString()
    .notEmpty()
    .withMessage('Store ID is required'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateStore,
  validateItem,
  handleValidationErrors
};