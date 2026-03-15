require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/models');

const authRoutes = require('./src/routes/auth');
const taskRoutes = require('./src/routes/tasks');
const recordRoutes = require('./src/routes/records');
const settingsRoutes = require('./src/routes/settings');
const gameRoutes = require('./src/routes/games');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/games', gameRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Sync database and start server
async function startServer() {
  try {
    await sequelize.sync({ alter: false });
    console.log('Database synchronized');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
