const express = require('express');
const router = express.Router();
const prisma = require('../models'); // 🎯 Central prisma instance layout mapping
const { register, login, logout } = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);

// 👥 1. LIVE ROSTER ENDPOINT: Fetch all registered users directly from the database
router.get('/users', authenticateJWT, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
        // 🎯 FIXED: Removed the unknown field 'role' to align perfectly with your User schema selection paths
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Failed loading registered database accounts:", error.message);
    next(error);
  }
});

// 2. PROFILE CONFIGURATION MANAGEMENTS
router.put('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name: name.trim(), 
        avatar: avatar && avatar.trim() !== "" ? avatar.trim() : null 
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
});

module.exports = router;