const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameScore = sequelize.define('GameScore', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  gameType: {
    type: DataTypes.ENUM('2048', 'snake', 'brick'),
    allowNull: false,
    field: 'game_type'
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'game_scores',
  timestamps: true,
  underscored: true
});

module.exports = GameScore;
