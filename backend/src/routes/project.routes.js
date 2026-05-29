const express = require('express');
const router = express.Router();
const { 
  createProject, 
  getUserProjects, 
  getProjectById, 
  updateProject, 
  deleteProject,
  addProjectMember,
  getProjectMessages,
  deleteProjectMessages,
  getDashboardOverview // 🎯 Imported your new aggregated summary metrics handler!
} = require('../controllers/project.controller');

const { authenticateJWT } = require('../middleware/auth.middleware');
const { requireProjectRole } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate');
const { createProjectSchema } = require('../middleware/project.validation');

// Secure global scope barrier
router.use(authenticateJWT);

// ─── GLOBAL AGGREGATION SLOTS (Must be placed ABOVE parameterized dynamic id blocks) ───
router.get('/dashboard/overview', getDashboardOverview); // 🎯 THE FIX: Maps global cross-project calculation requests cleanly!

// ─── NESTED CHAT / MESSAGE SLOTS (Keep grouped together) ───────────────────
router.get('/:id/messages', getProjectMessages);
router.delete('/:id/messages', deleteProjectMessages); 

// Broad collection routes
router.post('/', validate(createProjectSchema), createProject);
router.post('/:id/members', addProjectMember);
router.get('/', getUserProjects);

// Targeted item parameters routes
router.get('/:id', getProjectById);
router.put('/:id', requireProjectRole(['ADMIN']), validate(createProjectSchema), updateProject);
router.delete('/:id', requireProjectRole(['ADMIN']), deleteProject);

module.exports = router;