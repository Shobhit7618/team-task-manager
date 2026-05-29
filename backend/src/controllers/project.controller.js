const prisma = require('../models');

// 1. CREATE A NEW PROJECT
const createProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: { name, description, color }
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: userId,
          role: 'ADMIN'
        }
      });

      return project;
    });

    res.status(201).json({ message: 'Project created successfully', project: result });
  } catch (error) {
    next(error);
  }
};

// 2. GET ALL PROJECTS FOR THE LOGGED-IN USER
const getUserProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userMemberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
            members: {
              select: {
                role: true,
                user: { select: { id: true, name: true, avatar: true } }
              },
              take: 5
            }
          }
        }
      },
      orderBy: { project: { createdAt: 'desc' } }
    });

    const projects = userMemberships.map(membership => ({
      ...membership.project,
      myRole: membership.role
    }));

    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

// 3. GET SINGLE PROJECT DETAIL BY ID
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            labels: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found.' } });
    }

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

// 4. UPDATE PROJECT (ADMIN ONLY)
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { name, description, color }
    });

    res.status(200).json({ message: 'Project configuration updated', project: updatedProject });
  } catch (error) {
    next(error);
  }
};

// 5. DELETE PROJECT (ADMIN ONLY)
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Project successfully expunged.' });
  } catch (error) {
    next(error);
  }
};

// 👥 6. ADD A TEAM MEMBER TO A PROJECT VIA EMAIL
const addProjectMember = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'No user account found with this email address.' });
    }

    const existingMembership = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: targetUser.id
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'This user is already a member of this project.' });
    }

    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.projectMember.create({
        data: {
          projectId: id,
          userId: targetUser.id,
          role: 'MEMBER'
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } }
        }
      });

      await tx.notification.create({
        data: {
          type: 'TEAM_INVITE', 
          title: 'Added to Workspace',
          message: `You have been added to a new project workspace.`,
          userId: targetUser.id,
          isRead: "false" 
        }
      });

      return newMember;
    });

    res.status(200).json({ message: 'Team member added successfully!', member });
  } catch (error) {
    console.error("❌ CRITICAL MEMBER ADD FAILURE:", error);
    next(error);
  }
};

// 🎯 7. GET HISTORICAL CHAT LOGS FOR A PROJECT (FIXED RENDER LOOP & PRISMA SYNTAX)
const getProjectMessages = async (req, res, next) => {
  try {
    const { id: projectId } = req.params; 

    const sampleMessage = await prisma.message.findFirst({
      where: { 
        OR: [
          { projectId: projectId },
          { teamId: { not: null } }
        ]
      }
    });

    const whereClause = {};
    if (sampleMessage && 'projectId' in sampleMessage) {
      whereClause.projectId = projectId;
    } else if (sampleMessage && 'teamId' in sampleMessage) {
      whereClause.teamId = sampleMessage.teamId;
    } else {
      whereClause.projectId = projectId;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("❌ CRITICAL: Failed fetching historical project chat records:", error.message);
    return res.status(200).json([]);
  }
};

// 🗑️ 8. DELETE ALL MESSAGES IN A PROJECT CHAT ROOM (FIXED PRISMA SYNTAX)
const deleteProjectMessages = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;

    console.log(`🧼 Database Operation: Clearing all message entries for Project ID: ${projectId}`);

    const projectExists = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!projectExists) {
      return res.status(404).json({ error: { message: "Project context not found." } });
    }

    const sampleMessage = await prisma.message.findFirst({
      where: { 
        OR: [
          { projectId: projectId },
          { teamId: { not: null } }
        ]
      }
    });

    const whereClause = {};
    if (sampleMessage && 'projectId' in sampleMessage) {
      whereClause.projectId = projectId;
    } else if (sampleMessage && 'teamId' in sampleMessage) {
      whereClause.teamId = sampleMessage.teamId;
    } else {
      whereClause.projectId = projectId;
    }

    const deleteResult = await prisma.message.deleteMany({
      where: whereClause
    });

    console.log(`✅ Database Purge Successful! Dropped rows count: ${deleteResult.count}`);

    res.status(200).json({ 
      message: "Project room chat log records successfully purged.",
      count: deleteResult.count 
    });
  } catch (error) {
    console.error("❌ CRITICAL: Failed dropping project message database records:", error.message);
    next(error);
  }
};

// 📊 9. GET AGGREGATED METRICS & USER TASKS FOR GLOBAL DASHBOARD OVERVIEW
const getDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Gather every project ID the logged-in user is a part of
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    });
    const projectIds = memberships.map(m => m.projectId);

    // 2. Fetch every task card assigned to this user across all current project spaces
    const myTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        projectId: { in: projectIds }
      },
      include: {
        project: { select: { name: true, color: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Compute cross-project performance metric parameters
    const totalProjects = projectIds.length;
    const pendingTasksCount = myTasks.filter(t => t.status !== 'DONE').length;
    const completedTasksCount = myTasks.filter(t => t.status === 'DONE').length;
    const urgentTasksCount = myTasks.filter(t => t.priority === 'HIGH' && t.status !== 'DONE').length;

    res.status(200).json({
      metrics: {
        totalProjects,
        pendingTasks: pendingTasksCount,
        completedTasks: completedTasksCount,
        urgentTasks: urgentTasksCount
      },
      tasks: myTasks
    });
  } catch (error) {
    console.error("❌ Failed fetching dashboard aggregate metrics:", error.message);
    next(error);
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  getProjectMessages,
  deleteProjectMessages,
  getDashboardOverview // 🚀 Exported cleanly down server endpoint routing channels
};