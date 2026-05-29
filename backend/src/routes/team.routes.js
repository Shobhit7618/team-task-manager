const express = require('express');
const router = express.Router();

const { createTeam, getUserTeams, getTeamMessages } = require('../controllers/team.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { createTeamSchema } = require('../middleware/team.validation');

router.use(authenticateJWT);

router.post('/', validate(createTeamSchema), createTeam);
router.get('/', getUserTeams);
router.get('/:teamId/messages', getTeamMessages);

module.exports = router;