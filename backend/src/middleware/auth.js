const { PrismaClient } = require('@prisma/client');
const JWTUtils = require('../utils/jwt');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    const decoded = JWTUtils.verifyToken(token);
    
    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware;