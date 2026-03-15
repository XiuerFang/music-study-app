const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudyRecord = sequelize.define('StudyRecord', {
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
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'task_id',
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  taskName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'task_name'
  },
  category: {
    type: DataTypes.ENUM('music-history', 'singing', 'improvisation', 'teaching', 'training'),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pomodoros: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  recordDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'record_date'
  }
}, {
  tableName: 'study_records',
  timestamps: true,
  underscored: true
});

module.exports = StudyRecord;
