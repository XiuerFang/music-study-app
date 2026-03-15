const express = require('express');
const { Op } = require('sequelize');
const { StudyRecord, Task } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get records with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, dateRange, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };

    if (category) {
      where.category = category;
    }

    // Date filter
    if (dateRange) {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }
      
      if (startDate) {
        where.recordDate = { [Op.gte]: startDate.toISOString().split('T')[0] };
      }
    }

    const records = await StudyRecord.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await StudyRecord.count({ where });

    res.json({ records, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Failed to get records' });
  }
});

// Get calendar data
router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await StudyRecord.findAll({
      where: {
        userId: req.user.id,
        recordDate: {
          [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        }
      },
      attributes: ['recordDate', 'duration', 'pomodoros']
    });

    // Group by date
    const calendarData = {};
    records.forEach(record => {
      if (!calendarData[record.recordDate]) {
        calendarData[record.recordDate] = { totalDuration: 0, totalPomodoros: 0 };
      }
      calendarData[record.recordDate].totalDuration += record.duration;
      calendarData[record.recordDate].totalPomodoros += record.pomodoros;
    });

    res.json({ calendarData });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
});

// Get statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const records = await StudyRecord.findAll({
      where: { userId: req.user.id }
    });

    const totalPomodoros = records.reduce((sum, r) => sum + r.pomodoros, 0);
    const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);

    // Completed tasks
    const completedTasks = await Task.count({
      where: { userId: req.user.id, completed: true }
    });

    // Streak calculation
    const dates = [...new Set(records.map(r => r.recordDate))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toISOString().split('T')[0]) {
        streak++;
      } else if (i === 0 && dates[0] !== today) {
        // If today has no records, check if yesterday starts the streak
        continue;
      } else {
        break;
      }
    }

    // Category stats
    const categoryStats = {};
    records.forEach(r => {
      if (r.category) {
        categoryStats[r.category] = (categoryStats[r.category] || 0) + r.pomodoros;
      }
    });

    // Weekly data (last 7 days)
    const weekData = [];
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = records.filter(r => r.recordDate === dateStr);
      weekData.push({
        day: dayNames[d.getDay()],
        date: dateStr,
        count: dayRecords.reduce((sum, r) => sum + r.pomodoros, 0)
      });
    }

    res.json({
      totalPomodoros,
      totalMinutes,
      completedTasks,
      streakDays: streak,
      categoryStats,
      weekData
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Create record
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { taskId, taskName, category, duration, pomodoros, recordDate } = req.body;

    if (!duration || !recordDate) {
      return res.status(400).json({ error: 'Duration and recordDate are required' });
    }

    const record = await StudyRecord.create({
      userId: req.user.id,
      taskId: taskId || null,
      taskName: taskName || '未命名任务',
      category: category || 'music-history',
      duration,
      pomodoros: pomodoros || 1,
      recordDate
    });

    // Update task completed pomodoros if linked
    if (taskId) {
      const task = await Task.findOne({ where: { id: taskId, userId: req.user.id } });
      if (task) {
        await task.update({
          completedPomodoros: task.completedPomodoros + (pomodoros || 1)
        });
      }
    }

    res.status(201).json({ message: 'Record created', record });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// Delete record
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await StudyRecord.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    await record.destroy();

    res.json({ message: 'Record deleted' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;
