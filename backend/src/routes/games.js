const express = require('express');
const { GameScore } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all game scores
router.get('/scores', authMiddleware, async (req, res) => {
  try {
    const scores = await GameScore.findAll({
      where: { userId: req.user.id },
      order: [['score', 'DESC']]
    });

    // Group by game type
    const result = {
      '2048': null,
      'snake': null,
      'brick': null
    };

    scores.forEach(s => {
      if (result[s.gameType] === null || result[s.gameType].score < s.score) {
        result[s.gameType] = { score: s.score, date: s.createdAt };
      }
    });

    res.json({ scores: result });
  } catch (error) {
    console.error('Get scores error:', error);
    res.status(500).json({ error: 'Failed to get scores' });
  }
});

// Save game score
router.post('/scores', authMiddleware, async (req, res) => {
  try {
    const { gameType, score } = req.body;

    if (!gameType || score === undefined) {
      return res.status(400).json({ error: 'Game type and score are required' });
    }

    if (!['2048', 'snake', 'brick'].includes(gameType)) {
      return res.status(400).json({ error: 'Invalid game type' });
    }

    // Check if new score is higher
    const existing = await GameScore.findOne({
      where: { userId: req.user.id, gameType }
    });

    if (!existing || existing.score < score) {
      if (existing) {
        await existing.update({ score });
      } else {
        await GameScore.create({
          userId: req.user.id,
          gameType,
          score
        });
      }
    }

    res.json({ message: 'Score saved' });
  } catch (error) {
    console.error('Save score error:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

module.exports = router;
