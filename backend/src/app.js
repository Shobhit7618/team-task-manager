const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const prisma = require('./models');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const teamRoutes = require('./routes/team.routes');
const notificationRoutes = require('./routes/notification.routes');
const chatRoutes = require('./routes/chat.routes'); 

const app = express();
const server = http.createServer(app);

// 🚀 FIXED FOR DOCKER ORCHESTRATION: 
// Added "http://localhost" (port 80 where your Nginx frontend container lives!)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://team-task-manager-one-mocha.vercel.app'
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// Routes Mapping Interceptor
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes); 

// Independent HTTP Message Submission Handler
app.post('/api/teams/:teamId/messages', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { content } = req.body;
    const userId = "SYSTEM"; 

    const message = await prisma.message.create({
      data: { 
        teamId, 
        senderId: userId, 
        content 
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } }
    });

    const io = req.app.get('io');
    io.to(teamId).emit('new_message', message);

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'UP', database: 'CONNECTED' });
  } catch (error) {
    res.status(500).json({ status: 'DOWN', error: error.message });
  }
});

// ==========================================
// Advanced Socket.io Real-time Infrastructure
// ==========================================
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST']
  },
  allowEIO3: true, 
  pingTimeout: 30000, 
  pingInterval: 10000,
  maxHttpBufferSize: 1e6 
});

app.set('io', io);

const onlineUsers = new Map(); 

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to live socket: ${socket.id}`);

  socket.on('register_user', ({ userId, teamId }) => {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    if (teamId) {
      io.to(teamId).emit('user_online', { userId, teamId });
    }
  });

  socket.on('join_team', (teamId) => {
    socket.join(teamId);
    console.log(`👥 Socket ${socket.id} joined team room: ${teamId}`);
  });

  socket.on('leave_team', (teamId) => {
    socket.leave(teamId);
  });

  socket.on('typing_start', ({ teamId, userId, userName }) => {
    socket.to(teamId).emit('user_typing', { userId, name: userName, teamId });
  });

  socket.on('typing_stop', ({ teamId, userId }) => {
    socket.to(teamId).emit('user_stopped_typing', { userId, teamId });
  });

  socket.on('join_user_notification_channel', ({ userId }) => {
    socket.join(`user_${userId}`);
    console.log(`Private socket: user_${userId}`);
  });

  socket.on('join_project_room', ({ projectId }) => {
    socket.join(projectId);
    console.log(`Project room: ${projectId}`);
  });

  socket.on('clear_project_chat', ({ projectId }) => {
    socket.to(projectId).emit('project_chat_cleared');
  });

  socket.on('send_project_message', async (data) => {
    try {
      const { content, projectId, senderId } = data;
      if (!projectId || !senderId) return;

      let targetTeam = await prisma.team.findFirst({ select: { id: true } });
      let targetTeamId = targetTeam?.id;

      if (!targetTeamId) {
        const systemTeam = await prisma.team.create({
          data: {
            name: "System Global Workspace",
            description: "Automated bridge"
          },
          select: { id: true }
        });
        targetTeamId = systemTeam.id;
      }

      const newMessage = await prisma.message.create({
        data: { 
          content: String(content), 
          senderId: String(senderId),
          teamId: targetTeamId
        },
        include: { sender: { select: { id: true, name: true, avatar: true } } }
      });

      io.to(projectId).emit('receive_message', newMessage); 
      io.emit('receive_message', newMessage); 

      try {
        const projectMembers = await prisma.projectMember.findMany({
          where: { projectId: projectId },
          select: { userId: true }
        });

        const targets = projectMembers.filter(member => String(member.userId) !== String(senderId));

        for (const member of targets) {
          try {
            await prisma.notification.create({
              data: {
                userId: member.userId,
                type: "COMMENT",      
                title: `New Project Message`,
                message: `${newMessage.sender?.name || 'Teammate'}: "${content.substring(0, 25)}..."`
              }
            });
          } catch (innerErr) {}
        }
      } catch (dbErr) {}

    } catch (err) {}
  });

  socket.on('disconnect', () => {
    for (const [userId, sockets] of onlineUsers.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId }); 
        }
      }
    }
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: { message: err.message || 'Internal Server Error' } });
});

const PORT = process.env.PORT || 5000;

// 🚀 THE CRITICAL FIX FOR DOCKER: 
// Explicitly pass '0.0.0.0' interface to broadcast outside the virtual network layer!
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server fully exposed and executing smoothly on interface 0.0.0.0:${PORT}`);
});

module.exports = { app, server };