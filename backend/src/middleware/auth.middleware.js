const jwt = require('jsonwebtoken');
const prisma = require('../models');

const authenticateJWT = async (req, res, next) => {
  try {
    // 1. Extract the token from the Authorization Header (Bearer <token>)
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback: Check if the token is inside cookies (useful for some client setups)
    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ 
        error: { message: 'Authentication required. Access token missing.' } 
      });
    }

    // 3. Verify the token signature against our JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Double check if the user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true } // Don't pull the password hash into memory
    });

    if (!user) {
      return res.status(401).json({ 
        error: { message: 'The session owner no longer exists.' } 
      });
    }

    // 5. Attach the user object directly to the request lifecycle
    req.user = user;
    next();
  } catch (error) {
    console.error('🔐 Auth Middleware Verification Error:', error.message);
    
    // Explicit messages so the frontend knows when to trigger the refresh token rotation
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: { message: 'Access token expired.', code: 'TOKEN_EXPIRED' } 
      });
    }
    
    return res.status(403).json({ 
      error: { message: 'Invalid or tampered access token.' } 
    });
  }
};

module.exports = { authenticateJWT };