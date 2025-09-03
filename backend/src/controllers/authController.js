const { PrismaClient } = require('@prisma/client');
const PasswordUtils = require('../utils/password');
const JWTUtils = require('../utils/jwt');

const prisma = new PrismaClient();

class AuthController {
  // 用户注册
  static async register(req, res) {
    try {
      const { email, password, name } = req.body;
      
      // 检查用户是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // 验证密码强度
      PasswordUtils.validatePassword(password);
      
      // 加密密码
      const hashedPassword = await PasswordUtils.hashPassword(password);
      
      // 创建用户
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });
      
      // 生成JWT token
      const token = JWTUtils.generateToken({ userId: user.id });
      
      res.status(201).json({
        message: 'User registered successfully',
        user,
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: error.message || 'Registration failed' });
    }
  }
  
  // 用户登录
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // 验证密码
      const isValidPassword = await PasswordUtils.comparePassword(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // 生成JWT token
      const token = JWTUtils.generateToken({ userId: user.id });
      
      // 返回用户信息（不包含密码）
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
  
  // 获取当前用户信息
  static async me(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  }
  
  // 用户登出（客户端处理，服务端可选）
  static async logout(req, res) {
    // JWT是无状态的，登出主要在客户端删除token
    // 这里可以添加token黑名单逻辑（可选）
    res.json({ message: 'Logout successful' });
  }
}

module.exports = AuthController;