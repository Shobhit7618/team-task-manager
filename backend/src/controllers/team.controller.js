const prisma = require('../models');

// 1. CREATE TEAM
const createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { name, description }
      });

      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId,
          role: 'ADMIN'
        }
      });

      return newTeam;
    });

    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error) {
    next(error);
  }
};

// 2. GET ALL TEAMS FOR LOGGED IN USER
const getUserTeams = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: { select: { members: true } }
          }
        }
      }
    });

    const teams = memberships.map(m => ({
      ...m.team,
      myRole: m.role
    }));

    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
};

// 3. GET TEAM CHAT LOGS HISTORY (PAGINATION: 30 PER PAGE)
const getTeamMessages = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const cursor = req.query.cursor; // for cursor-based endless scroll history loads

    const limit = 30;
    const messages = await prisma.message.findMany({
      where: { teamId },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        replyTo: { include: { sender: { select: { name: true } } } },
        reactions: true
      },
      orderBy: { createdAt: 'desc' } // fetch latest first, frontend reverses it
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    res.status(200).json({
      messages,
      nextCursor
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  getUserTeams,
  getTeamMessages
};