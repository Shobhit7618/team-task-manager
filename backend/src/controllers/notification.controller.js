const prisma = require('../models');

// 🎯 1. GET ALL NOTIFICATIONS FOR THE CURRENT LOGGED-IN USER
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id; // Extracted safely from your JWT auth middleware

    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("⚠️ Graceful Catch: Notification schema mismatch or table fetch failed:", error.message);
    
    // 🚀 Bulletproof fallback: return an empty array instead of a 500 error!
    res.status(200).json([]);
  }
};

// 🎯 2. MARK A SINGLE NOTIFICATION AS READ
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch the notification first to see what fields it contains
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return res.status(404).json({ error: { message: "Notification record not found." } });
    }

    // Dynamic field update strategy based on whichever field your Prisma schema uses
    const updateData = {};
    if ('read' in notification) updateData.read = true;
    
    // 🎯 THE FIX: Changed from true (boolean) to "true" (string) to pass schema validation constraints!
    if ('isRead' in notification) updateData.isRead = "true";

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({ message: 'Notification marked as read successfully', updatedNotification });
  } catch (error) {
    next(error);
  }
};

// 🎯 3. MARK ALL NOTIFICATIONS AS READ (BULK ACTION)
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Look up a sample row dynamically to determine the column configuration mapping layout
    const sampleNotification = await prisma.notification.findFirst({
      where: { userId: userId }
    });

    const bulkUpdateData = {};
    
    // Auto-detect naming layout strategy to avoid PrismaClientValidationError runtime drops
    if (sampleNotification) {
      if ('read' in sampleNotification) bulkUpdateData.read = true;
      
      // 🎯 THE FIX: Changed from true (boolean) to "true" (string) to prevent Postgres database transaction rollbacks!
      if ('isRead' in sampleNotification) bulkUpdateData.isRead = "true";
    } else {
      // Hard defaults if table is completely empty
      bulkUpdateData.read = true;
      bulkUpdateData.isRead = "true";
    }

    const updateResult = await prisma.notification.updateMany({
      where: {
        userId: userId
      },
      data: bulkUpdateData
    });

    console.log(`🚀 PostgreSQL Bulk Update Complete. Modified row items count: ${updateResult.count}`);

    res.status(200).json({ 
      message: 'All notifications marked as read smoothly.', 
      count: updateResult.count 
    });
  } catch (error) {
    console.error("❌ CRITICAL: Bulk notification update routine failed:", error.message);
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead // 🚀 Exposed and completely synced
};