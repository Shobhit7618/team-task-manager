const express = require('express');
const router = express.Router(); 

const { 
  createTask, 
  getProjectTasks, 
  updateTaskStatus, 
  updateTaskDetails 
} = require('../controllers/task.controller');

const { authenticateJWT } = require('../middleware/auth.middleware');
const { requireProjectRole } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate');
const { createTaskSchema, updateTaskStatusSchema } = require('../middleware/task.validation');

router.use(authenticateJWT);

// Clean paths: Mounted under /api/tasks, so these translate to /api/tasks/:projectId
router.post('/:projectId', requireProjectRole(['ADMIN', 'MEMBER']), validate(createTaskSchema), createTask);
router.get('/:projectId', requireProjectRole(['ADMIN', 'MEMBER']), getProjectTasks);

// Individual card manipulations translate to /api/tasks/:taskId/status
router.put('/:taskId/status', validate(updateTaskStatusSchema), updateTaskStatus);
router.put('/:taskId', validate(createTaskSchema), updateTaskDetails);

router.delete('/:taskId', deleteProject = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    await require('../models').task.delete({ where: { id: taskId } });
    res.status(200).json({ message: 'Task card successfully removed.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;