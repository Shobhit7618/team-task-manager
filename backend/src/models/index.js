const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// 1. Establish a standard node-postgres pool instance
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://shobhit:password@postgres_db:5432/taskmanager?schema=public" 
});

// 2. Wrap it with the required Prisma 7 Driver Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter cleanly into the constructor
const prisma = new PrismaClient({ adapter });

module.exports = prisma;