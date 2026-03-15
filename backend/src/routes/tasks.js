const express = require('express');
const { Task } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    const where = { userId: req.user.id };
    
    if (category && category !== 'all') {
      where.category = category;
    }

    const tasks = await Task.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, estimatedPomodoros, notes } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const task = await Task.create({
      userId: req.user.id,
      name,
      category,
      estimatedPomodoros: estimatedPomodoros || 1,
      notes
    });

    res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { name, category, estimatedPomodoros, completedPomodoros, notes, completed } = req.body;

    await task.update({
      name: name || task.name,
      category: category || task.category,
      estimatedPomodoros: estimatedPomodoros !== undefined ? estimatedPomodoros : task.estimatedPomodoros,
      completedPomodoros: completedPomodoros !== undefined ? completedPomodoros : task.completedPomodoros,
      notes: notes !== undefined ? notes : task.notes,
      completed: completed !== undefined ? completed : task.completed
    });

    res.json({ message: 'Task updated', task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
