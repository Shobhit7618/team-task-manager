const { z } = require('zod');

const createTeamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters long').max(50),
  description: z.string().max(500).optional().nullable(),
});

const sendInviteSchema = z.object({
  email: z.string().email('Invalid target email formatting structure'),
});

module.exports = { createTeamSchema, sendInviteSchema };