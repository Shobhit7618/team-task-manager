const { z } = require('zod');

const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters long').max(100),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code (e.g., #EF4444)').optional().nullable(),
});

module.exports = { createProjectSchema };