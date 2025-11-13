const sequelize = require('../config/database');
const Project = require('./Project');
const Question = require('./Question');

// Defina as associações aqui, se necessário
// Exemplo: Project.hasMany(Question);

module.exports = {
  sequelize,
  Project,
  Question
};
