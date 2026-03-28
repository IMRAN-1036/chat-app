const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Parse allowed origins from env (comma-separated) or use defaults
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      callback(null, origin || true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Request-ID']
  }
});

// Expose io to routes if needed
app.set('io', io);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: function (origin, callback) {
    // Reflect the requesting origin to allow it, essential for credentials
    // This assumes all requesting origins are trusted for this deployment
    callback(null, origin || true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Request-ID']
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  family: 4 // Force IPv4 to prevent DNS timeout
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const enhancedRoutes = require('./routes/enhancedRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat', enhancedRoutes);

// Health check / root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Chat App API is running 🚀' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join_room', (password) => {
    socket.join(password);
    console.log(`User ${socket.id} joined room: ${password}`);
  });

  socket.on('typing', ({ password, username }) => {
    socket.to(password).emit('user_typing', { username });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});