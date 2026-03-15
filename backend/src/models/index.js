const { sequelize } = require('../config/database');
const User = require('./User');
const Task = require('./Task');
const StudyRecord = require('./StudyRecord');
const UserSetting = require('./UserSetting');
const GameScore = require('./GameScore');

// Associations
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(StudyRecord, { foreignKey: 'userId', as: 'records' });
StudyRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(UserSetting, { foreignKey: 'userId', as: 'settings' });
UserSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(GameScore, { foreignKey: 'userId', as: 'gameScores' });
GameScore.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Task,
  StudyRecord,
  UserSetting,
  GameScore
};
