const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const questionController = require('../controllers/questionController');
const syncController = require('../controllers/syncController');
const sourceController = require('../controllers/sourceController');

// Middleware para log de requisições
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Rotas de Projetos
router.get('/projects', projectController.getAllProjects);
router.post('/projects', projectController.createProject);
router.get('/projects/:id', projectController.getProjectById);

// Rotas de Sincronização
router.post('/sync/all', syncController.syncAll);
router.post('/sync/projects', syncController.syncProjects);
router.post('/sync/sectors', syncController.syncSectors);
router.post('/sync/statuses', syncController.syncStatuses);

// Rotas de Perguntas
router.get('/questions', questionController.listQuestions);
router.post('/questions/import', questionController.importQuestions);
router.get('/projects/:projectId/questions', questionController.getProjectQuestions);

// Rotas de Filtros
router.get('/sectors', projectController.getSectors);
router.get('/statuses', projectController.getProjectStatuses);

// Rotas diretas da SIF-Source
router.get('/source/projects', sourceController.listSourceProjects);

// Rota de teste
router.post('/test', (req, res) => {
  console.log('Test route hit!', req.body);
  res.json({ message: 'Test route working!', body: req.body });
});

// Rota raiz da API - Lista de endpoints
router.get('/', (req, res) => {
  res.json({
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
      health: 'GET /api/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Rota de saúde da API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    version: '1.0.0'
  });
});

// Middleware de tratamento de erros
router.use((err, req, res, next) => {
  console.error('Erro na API:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Rota não encontrada
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

module.exports = router;