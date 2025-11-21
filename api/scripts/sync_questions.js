const { sequelize, Project } = require('../src/models');
const questionSyncService = require('../src/services/questionSyncService');

(async () => {
  try {
    const argLimit = process.argv[2] ? parseInt(process.argv[2], 10) : NaN;
    const limit = Number.isFinite(argLimit) && argLimit > 0 ? argLimit : null;

    console.log('[sync_questions] Iniciando sincronização de perguntas da SIF para projetos...',
      limit ? `(limit=${limit})` : '(todos)');
    await sequelize.authenticate();
    console.log('[sync_questions] Conexão com o banco estabelecida.');

    const result = await questionSyncService.syncAllProjectsQuestions(
      limit ? { limit } : {}
    );
    console.log('[sync_questions] Resultado:', result);
  } catch (err) {
    console.error('[sync_questions] Erro durante a sincronização:', err);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch {}
    process.exit();
  }
})();
