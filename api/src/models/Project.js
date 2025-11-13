const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  sourceId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sector: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subSector: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimatedCost: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  currentSituation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nextSteps: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  risks: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  rawData: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  lastSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  // Manter os índices originais, mas com nomes explícitos para evitar duplicação
  indexes: [
    {
      name: 'projects_sector_idx',
      fields: ['sector'],
      unique: false
    },
    {
      name: 'projects_status_idx',
      fields: ['status'],
      unique: false
    }
  ]
});

// Adiciona um hook afterSync para lidar com erros de índice
Project.afterSync('handleIndexes', async () => {
  try {
    const queryInterface = Project.sequelize.getQueryInterface();
    
    // Tenta criar os índices manualmente se necessário
    try {
      await queryInterface.addIndex(Project.tableName, ['sector'], {
        name: 'projects_sector_idx',
        unique: false
      });
    } catch (sectorError) {
      if (!sectorError.message.includes('already exists')) {
        console.warn('Erro ao criar índice projects_sector_idx:', sectorError.message);
      }
    }

    try {
      await queryInterface.addIndex(Project.tableName, ['status'], {
        name: 'projects_status_idx',
        unique: false
      });
    } catch (statusError) {
      if (!statusError.message.includes('already exists')) {
        console.warn('Erro ao criar índice projects_status_idx:', statusError.message);
      }
    }
  } catch (error) {
    console.warn('Erro no hook afterSync do modelo Project:', error.message);
  }
});

module.exports = Project;
