require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Tratamento de requisições OPTIONS
app.options('*', cors());

// Rotas
app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'API do Dashboard PPI',
    version: '1.0.0',
    description: 'API para o Dashboard de Acompanhamento de Projetos PPI',
    documentation: 'Consulte a documentação da API em /api-docs',
    endpoints: {
      projects: '/api/projects',
      sync: {
        all: '/api/sync/all',
        projects: '/api/sync/projects',
        sectors: '/api/sync/sectors',
        statuses: '/api/sync/statuses'
      },
      questions: '/api/questions',
      sectors: '/api/sectors',
      statuses: '/api/statuses',
      health: '/health'
    }
  });
});

// Rota /api para listar endpoints disponíveis
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Bem-vindo à API do Dashboard PPI',
    endpoints: {
      projects: {
        list: 'GET /api/projects',
        get: 'GET /api/projects/:id',
        create: 'POST /api/projects'
      },
      sync: {
        all: 'POST /api/sync/all',
        projects: 'POST /api/sync/projects',
        sectors: 'POST /api/sync/sectors',
        statuses: 'POST /api/sync/statuses'
      },
      questions: {
        list: 'GET /api/questions',
        import: 'POST /api/questions/import',
        projectQuestions: 'GET /api/projects/:projectId/questions'
      },
      filters: {
        sectors: 'GET /api/sectors',
        statuses: 'GET /api/statuses'
      },
      health: 'GET /health'
    },
    timestamp: new Date().toISOString()
  });
});

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date(),
    database: 'connected',
    version: '1.0.0'
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// Inicialização do servidor
const startServer = async () => {
  try {
    // Sincronizar modelos com o banco de dados
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Importar modelos
    const { Question } = require('./models');
    
    // Sincronizar modelos (criar tabelas se não existirem)
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados com o banco de dados.');
    
    // Iniciar o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Acesse: http://localhost:${PORT}`);
      console.log(`Documentação da API: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

startServer();

// Tratamento de sinais de encerramento
process.on('SIGINT', async () => {
  console.log('\nEncerrando o servidor...');
  await sequelize.close();
  process.exit(0);
});

module.exports = app;
