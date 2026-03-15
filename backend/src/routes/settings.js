const express = require('express');
const { UserSetting } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get settings
router.get('/', authMiddleware, async (req, res) => {
  try {
    let settings = await UserSetting.findOne({
      where: { userId: req.user.id }
    });

    if (!settings) {
      settings = await UserSetting.create({ userId: req.user.id });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { workDuration, shortBreak, longBreak, longBreakInterval } = req.body;

    let settings = await UserSetting.findOne({
      where: { userId: req.user.id }
    });

    if (!settings) {
      settings = await UserSetting.create({ userId: req.user.id });
    }

    await settings.update({
      workDuration: workDuration || settings.workDuration,
      shortBreak: shortBreak || settings.shortBreak,
      longBreak: longBreak || settings.longBreak,
      longBreakInterval: longBreakInterval || settings.longBreakInterval
    });

    res.json({ message: 'Settings updated', settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
