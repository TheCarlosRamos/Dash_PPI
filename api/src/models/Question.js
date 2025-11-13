const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cod_source: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  question_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dsc_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dsc_title: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'questions',
  timestamps: true
});

module.exports = Question;
