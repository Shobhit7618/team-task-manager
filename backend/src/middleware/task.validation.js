const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title cannot be empty').max(150),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
});

module.exports = { createTaskSchema, updateTaskStatusSchema };