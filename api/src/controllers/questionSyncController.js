const questionSyncService = require('../services/questionSyncService');

exports.syncQuestionsForAllProjects = async (req, res, next) => {
  try {
    const startedAt = new Date();
    const result = await questionSyncService.syncAllProjectsQuestions();
    const finishedAt = new Date();

    res.json({
      success: true,
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      ...result
    });
  } catch (error) {
    console.error('[questionSyncController] Erro ao sincronizar perguntas:', error);
    next(error);
  }
};
