const prisma = require('../models');

// 1. CREATE TASK IN PROJECT (WITH ATOMIC REAL-TIME NOTIFICATION ATTACHMENT)
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, status, priority, description, dueDate, assigneeId } = req.body;
    const creatorId = req.user?.id; // Captured from your JWT auth middleware

    // Use a transaction to bundle task generation and assignment alerts safely
    const result = await prisma.$transaction(async (tx) => {
      // Create the core task card row
      const task = await tx.task.create({
        data: {
          title,
          status: status || 'TODO',
          priority: priority || 'MEDIUM',
          description: description || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId: projectId, 
          assigneeId: (assigneeId && assigneeId.trim() !== "") ? assigneeId : null
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } }
        }
      });

      // 🔔 Trigger alert if assigned to another team member
      const targetAssigneeId = (assigneeId && assigneeId.trim() !== "") ? assigneeId : null;
      if (targetAssigneeId && targetAssigneeId !== creatorId) {
        await tx.notification.create({
          data: {
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: `You have been assigned to the task: "${title}"`,
            userId: targetAssigneeId,
            projectId: projectId
          }
        });
      }

      return task;
    });

    res.status(201).json({ message: 'Task created successfully', task: result });
  } catch (error) {
    console.error("❌ PRISMA TASK CREATION ERROR:", error);
    next(error);
  }
};

// 2. GET ALL TASKS FOR A PROJECT
const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { projectId: projectId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("❌ PRISMA FETCH TASKS ERROR:", error);
    next(error);
  }
};

// 3. UPDATE TASK STATUS (DRAG AND DROP POSITION SHIFTS)
const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status }
    });

    res.status(200).json({ message: 'Task status updated successfully', task: updatedTask });
  } catch (error) {
    next(error);
  }
};

// 4. GENERAL EDIT TASK DETAILS
const updateTaskDetails = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, dueDate, assigneeId } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: (assigneeId && assigneeId.trim() !== "") ? assigneeId : null
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.status(200).json({ message: 'Task configuration modified', task: updatedTask });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTaskStatus,
  updateTaskDetails
};