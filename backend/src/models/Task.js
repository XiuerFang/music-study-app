const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('music-history', 'singing', 'improvisation', 'teaching', 'training'),
    allowNull: false
  },
  estimatedPomodoros: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'estimated_pomodoros'
  },
  completedPomodoros: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'completed_pomodoros'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true
});

module.exports = Task;
