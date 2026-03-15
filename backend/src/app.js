const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'music-study-secret-key-2026';
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Simple JSON file-based database
let db = {
  users: [],
  tasks: [],
  records: [],
  settings: [],
  gameScores: []
};

function loadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Starting with empty database');
  }
}

function saveDb() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

loadDb();

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Routes

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now(),
    username,
    passwordHash,
    nickname: nickname || username,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  
  db.users.push(user);
  db.settings.push({ userId: user.id, workDuration: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 });
  saveDb();
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    message: 'User created successfully',
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  const user = db.users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }
  });
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username, nickname: req.user.nickname, role: req.user.role } });
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { nickname } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (user) {
    user.nickname = nickname || user.nickname;
    saveDb();
  }
  res.json({ message: 'Profile updated', user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role } });
});

app.put('/api/auth/password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect old password' });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  saveDb();
  res.json({ message: 'Password changed successfully' });
});

// Tasks
app.get('/api/tasks', authMiddleware, (req, res) => {
  const { category } = req.query;
  let tasks = db.tasks.filter(t => t.userId === req.user.id);
  if (category && category !== 'all') {
    tasks = tasks.filter(t => t.category === category);
  }
  res.json({ tasks: tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post('/api/tasks', authMiddleware, (req, res) => {
  const { name, category, estimatedPomodoros, notes } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  
  const task = {
    id: Date.now(),
    userId: req.user.id,
    name,
    category,
    estimatedPomodoros: estimatedPomodoros || 1,
    completedPomodoros: 0,
    notes: notes || '',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.tasks.push(task);
  saveDb();
  res.status(201).json({ message: 'Task created', task });
});

app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  const task = db.tasks.find(t => t.id === parseInt(req.params.id) && t.userId === req.user.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const { name, category, estimatedPomodoros, completedPomodoros, notes, completed } = req.body;
  if (name) task.name = name;
  if (category) task.category = category;
  if (estimatedPomodoros !== undefined) task.estimatedPomodoros = estimatedPomodoros;
  if (completedPomodoros !== undefined) task.completedPomodoros = completedPomodoros;
  if (notes !== undefined) task.notes = notes;
  if (completed !== undefined) task.completed = completed;
  task.updatedAt = new Date().toISOString();
  
  saveDb();
  res.json({ message: 'Task updated', task });
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  const idx = db.tasks.findIndex(t => t.id === parseInt(req.params.id) && t.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  db.tasks.splice(idx, 1);
  saveDb();
  res.json({ message: 'Task deleted' });
});

// Records
app.get('/api/records', authMiddleware, (req, res) => {
  const { category, dateRange, page = 1, limit = 20 } = req.query;
  let records = db.records.filter(r => r.userId === req.user.id);
  
  if (category) records = records.filter(r => r.category === category);
  
  const now = new Date();
  if (dateRange === 'today') {
    const today = now.toISOString().split('T')[0];
    records = records.filter(r => r.recordDate === today);
  } else if (dateRange === 'week') {
    const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
    records = records.filter(r => r.recordDate >= weekAgo);
  } else if (dateRange === 'month') {
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
    records = records.filter(r => r.recordDate >= monthAgo);
  }
  
  const total = records.length;
  records = records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice((page - 1) * limit, page * limit);
  
  res.json({ records, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

app.get('/api/records/calendar', authMiddleware, (req, res) => {
  const { year, month } = req.query;
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const records = db.records.filter(r => 
    r.userId === req.user.id && r.recordDate >= startDate && r.recordDate <= endDate
  );
  
  const calendarData = {};
  records.forEach(r => {
    if (!calendarData[r.recordDate]) {
      calendarData[r.recordDate] = { totalDuration: 0, totalPomodoros: 0 };
    }
    calendarData[r.recordDate].totalDuration += r.duration;
    calendarData[r.recordDate].totalPomodoros += r.pomodoros;
  });
  
  res.json({ calendarData });
});

app.get('/api/records/stats', authMiddleware, (req, res) => {
  const records = db.records.filter(r => r.userId === req.user.id);
  const tasks = db.tasks.filter(t => t.userId === req.user.id && t.completed);
  
  const totalPomodoros = records.reduce((sum, r) => sum + r.pomodoros, 0);
  const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);
  const completedTasks = tasks.length;
  
  // Streak
  const dates = [...new Set(records.map(r => r.recordDate))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (dates[i] === expected.toISOString().split('T')[0]) streak++;
    else break;
  }
  
  // Category stats
  const categoryStats = {};
  records.forEach(r => {
    if (r.category) {
      categoryStats[r.category] = (categoryStats[r.category] || 0) + r.pomodoros;
    }
  });
  
  // Week data
  const weekData = [];
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRecords = records.filter(r => r.recordDate === dateStr);
    weekData.push({ day: dayNames[d.getDay()], date: dateStr, count: dayRecords.reduce((s, r) => s + r.pomodoros, 0) });
  }
  
  res.json({ totalPomodoros, totalMinutes, completedTasks, streakDays: streak, categoryStats, weekData });
});

app.post('/api/records', authMiddleware, (req, res) => {
  const { taskId, taskName, category, duration, pomodoros, recordDate } = req.body;
  if (!duration || !recordDate) {
    return res.status(400).json({ error: 'Duration and recordDate are required' });
  }
  
  const record = {
    id: Date.now(),
    userId: req.user.id,
    taskId: taskId || null,
    taskName: taskName || '未命名任务',
    category: category || 'music-history',
    duration,
    pomodoros: pomodoros || 1,
    recordDate,
    createdAt: new Date().toISOString()
  };
  
  db.records.push(record);
  
  // Update task
  if (taskId) {
    const task = db.tasks.find(t => t.id === taskId && t.userId === req.user.id);
    if (task) {
      task.completedPomodoros = (task.completedPomodoros || 0) + (pomodoros || 1);
    }
  }
  
  saveDb();
  res.status(201).json({ message: 'Record created', record });
});

app.delete('/api/records/:id', authMiddleware, (req, res) => {
  const idx = db.records.findIndex(r => r.id === parseInt(req.params.id) && r.userId === req.user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  db.records.splice(idx, 1);
  saveDb();
  res.json({ message: 'Record deleted' });
});

// Settings
app.get('/api/settings', authMiddleware, (req, res) => {
  let settings = db.settings.find(s => s.userId === req.user.id);
  if (!settings) {
    settings = { userId: req.user.id, workDuration: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
    db.settings.push(settings);
    saveDb();
  }
  res.json({ settings });
});

app.put('/api/settings', authMiddleware, (req, res) => {
  let settings = db.settings.find(s => s.userId === req.user.id);
  if (!settings) {
    settings = { userId: req.user.id };
    db.settings.push(settings);
  }
  
  const { workDuration, shortBreak, longBreak, longBreakInterval } = req.body;
  if (workDuration) settings.workDuration = workDuration;
  if (shortBreak) settings.shortBreak = shortBreak;
  if (longBreak) settings.longBreak = longBreak;
  if (longBreakInterval) settings.longBreakInterval = longBreakInterval;
  
  saveDb();
  res.json({ message: 'Settings updated', settings });
});

// Games
app.get('/api/games/scores', authMiddleware, (req, res) => {
  const scores = db.gameScores.filter(s => s.userId === req.user.id);
  const result = { '2048': null, 'snake': null, 'brick': null };
  scores.forEach(s => {
    if (!result[s.gameType] || result[s.gameType].score < s.score) {
      result[s.gameType] = { score: s.score, date: s.createdAt };
    }
  });
  res.json({ scores: result });
});

app.post('/api/games/scores', authMiddleware, (req, res) => {
  const { gameType, score } = req.body;
  if (!gameType || score === undefined) {
    return res.status(400).json({ error: 'Game type and score are required' });
  }
  
  const existing = db.gameScores.find(s => s.userId === req.user.id && s.gameType === gameType);
  if (!existing || existing.score < score) {
    if (existing) {
      existing.score = score;
      existing.createdAt = new Date().toISOString();
    } else {
      db.gameScores.push({
        id: Date.now(),
        userId: req.user.id,
        gameType,
        score,
        createdAt: new Date().toISOString()
      });
    }
    saveDb();
  }
  
  res.json({ message: 'Score saved' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
