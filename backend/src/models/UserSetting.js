const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSetting = sequelize.define('UserSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  workDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 25,
    field: 'work_duration'
  },
  shortBreak: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'short_break'
  },
  longBreak: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    field: 'long_break'
  },
  longBreakInterval: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
    field: 'long_break_interval'
  }
}, {
  tableName: 'user_settings',
  timestamps: true,
  underscored: true
});

module.exports = UserSetting;
