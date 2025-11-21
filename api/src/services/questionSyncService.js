const { Project } = require('../models');
const questionService = require('./questionService');

function isMeaningful(value) {
  if (value == null) return false;
  const s = String(value).trim();
  if (!s) return false;
  return s !== 'Não informado' && s !== 'Pending';
}

function splitRisks(text) {
  if (!isMeaningful(text)) return null;
  const parts = String(text)
    .split(/\r?\n|;|\u2022|\-/)
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

async function syncProjectQuestions(project) {
  const raw = project.rawData || {};
  let guid = raw.Guid || raw.guid || null;
  if (!guid && typeof project.sourceId === 'string') {
    guid = project.sourceId.startsWith('source-')
      ? project.sourceId.replace('source-', '')
      : project.sourceId;
  }
  if (!guid) {
    console.warn('[questionSync] Projeto sem GUID/sourceId válido, pulando', project.id);
    return { updated: false };
  }

  // Ignora IDs locais/dummy que não são GUIDs válidos (ex.: local-176286...) para evitar 404 na SIF
  const looksGuid = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(String(guid));
  if (!looksGuid) {
    console.warn('[questionSync] ID não parece GUID SIF, pulando', guid, 'para projeto', project.id);
    return { updated: false };
  }

  let formatted = null;
  try {
    const answers = await questionService.getProjectQuestionAnswers(guid);
    formatted = questionService.formatAnswersForCards(answers);
  } catch (err) {
    console.warn('[questionSync] Erro ao buscar perguntas na SIF para projeto', project.id, 'GUID', guid, '-', err.message);
    return { updated: false };
  }

  let changed = false;

  if (formatted) {
    if (isMeaningful(formatted.situacao_atual)) {
      project.currentSituation = String(formatted.situacao_atual).trim();
      changed = true;
    }
    if (isMeaningful(formatted.proximos_passos)) {
      project.nextSteps = String(formatted.proximos_passos).trim();
      changed = true;
    }
    const risksArr = splitRisks(formatted.pontos_atencao);
    if (Array.isArray(risksArr)) {
      project.risks = risksArr;
      changed = true;
    }

    // Opcional: guardar um snapshot das etapas em rawData.QuestionsTimeline
    if (formatted.etapas && typeof formatted.etapas === 'object') {
      const rawData = project.rawData || {};
      rawData.QuestionsTimeline = formatted.etapas;
      project.rawData = rawData;
      changed = true;
    }
  }

  if (changed) {
    project.lastSyncedAt = new Date();
    await project.save();
  }

  return { updated: changed };
}

async function syncAllProjectsQuestions(options = {}) {
  const { limit, offset } = options;
  const findOptions = {};
  if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
    findOptions.limit = Math.floor(limit);
  }
  if (typeof offset === 'number' && Number.isFinite(offset) && offset >= 0) {
    findOptions.offset = Math.floor(offset);
  }

  const projects = await Project.findAll(findOptions);
  let updatedCount = 0;
  let errorCount = 0;

  for (const project of projects) {
    try {
      const { updated } = await syncProjectQuestions(project);
      if (updated) updatedCount += 1;
    } catch (err) {
      errorCount += 1;
      console.warn('[questionSync] Erro ao sincronizar projeto', project.id, '-', err.message);
    }
  }

  return {
    total: projects.length,
    updated: updatedCount,
    errors: errorCount
  };
}

module.exports = {
  syncAllProjectsQuestions,
  syncProjectQuestions
};
