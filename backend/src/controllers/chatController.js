const prisma = require('../models');

// GET HISTORICAL CHAT LOGS FOR A SPECIFIC KANBAN PROJECT
const getProjectMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        projectId: projectId
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: {
        createdAt: 'asc' // Pull old messages first down to the newest
      }
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ PRISMA CHAT FETCH LOGS ERROR:", error);
    next(error);
  }
};

module.exports = {
  getProjectMessages
};