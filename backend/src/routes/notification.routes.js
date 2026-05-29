const express = require('express');
const router = express.Router();
const { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead
} = require('../controllers/notification.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const prisma = require('../models');

// 🛡️ Lock down this entire router workspace with your JWT guardrail
router.use(authenticateJWT);

// 🎯 1. GET ALL USER NOTIFICATIONS
router.get('/', getUserNotifications);

// 🎯 2. PURGE ALL NOTIFICATIONS (The Trash Can Option Fix)
// Kept at the top of the route handlers to ensure clean intercept mapping!
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.user.id; 

    console.log(`🗑️ Database Operation: Purging all notifications for User ID: ${userId}`);

    const clearResult = await prisma.notification.deleteMany({
      where: {
        userId: userId
      }
    });

    res.status(200).json({ 
      message: "All user alert logs successfully purged from PostgreSQL rows.",
      count: clearResult.count 
    });
  } catch (error) {
    console.error("❌ CRITICAL: Failed dropping notification table rows:", error.message);
    next(error);
  }
});

// 🎯 3. BULK MARK AS READ ENDPOINTS
router.put('/read-all', markAllAsRead); 
router.put('/mark-all-read', markAllAsRead);
router.put('/read', markAllAsRead); 

// 🎯 4. INDIVIDUAL ITEM RE-ROUTE ACTION MAPS
router.put('/:id/read', markAsRead);

module.exports = router;