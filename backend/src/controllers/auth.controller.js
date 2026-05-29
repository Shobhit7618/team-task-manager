const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../models');

// Helper to generate JWT tokens
const generateTokens = (user) => {
  // 🚀 FIXED: Fallback strings added to handle missing environment variable states gracefully
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'fallback_super_secure_access_token_secret_key_string_12345',
    { expiresIn: '15m' } // Short lifespan for access tokens
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'fallback_super_secure_refresh_token_secret_key_string_67890',
    { expiresIn: '7d' } // Long lifespan for refresh token
  );

  return { accessToken, refreshToken };
};

// 1. REGISTER
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: { message: 'Email is already registered' } });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (Note: emailVerified is false until token flow implemented)
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.status(201).json({ message: 'User registered successfully!', user: newUser });
  } catch (error) {
    next(error);
  }
};

// 2. LOGIN
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// 3. LOGOUT
const logout = async (req, res, next) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  logout,
};