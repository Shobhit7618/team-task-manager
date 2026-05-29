const prisma = require('../models');

/**
 * Enforces role restrictions on targeted Project and Task routes
 * @param {Array} allowedRoles - e.g., ['ADMIN', 'MEMBER']
 */
const requireProjectRole = (allowedRoles) => async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // ─── UPDATED PARAMETER LOOKUP ──────────────────────────────────
    // Fallback lookups: supports both tasks (:projectId) and projects (:id) parameters safely
    const projectId = req.params.projectId || req.params.id;
    // ───────────────────────────────────────────────────────────────

    if (!projectId) {
      return res.status(400).json({ error: { message: 'Project identification parameter missing.' } });
    }

    // Query database for the specific user membership role
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: { message: 'Access denied. You are not a member of this project.' } });
    }

    if (!allowedRoles.includes(membership.role)) {
      return res.status(403).json({ 
        error: { message: `Action restricted. Required permissions: [${allowedRoles.join(', ')}]` } 
      });
    }

    // Attach membership context info to downstream handlers just in case
    req.projectMembership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireProjectRole };