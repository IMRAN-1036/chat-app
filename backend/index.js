const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  family: 4 // Force IPv4 to prevent Render DNS timeout
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// 404 Handler - Also used as a fallback for React Router if needed
app.use((req, res) => {
  // If the request accepts html, send the React index.html
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  } else {
    res.status(404).json({ message: 'Route not found' });
  }
});

// Start Server
const PORT = process.env.PORT || 2000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});