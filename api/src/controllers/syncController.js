const syncService = require('../services/syncService');
const { Project } = require('../models');
const projectController = require('./projectController');

const syncController = {
  /**
   * Sincroniza todos os dados da API SOURCE
   * @route POST /api/sync/all
   */
  async syncAll(req, res) {
    try {
      const result = await syncService.syncAllData();
      res.json({
        success: true,
        message: 'Sincronização concluída com sucesso',
        ...result
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      res.status(500).json({
        success: false,
        message: 'Falha ao sincronizar dados',
        error: error.message
      });
    }
  },

  /**
   * Sincroniza apenas os projetos
   * @route POST /api/sync/projects
   */
  async syncProjects(req, res) {
    try {
      console.log('Iniciando sincronização de projetos (fluxo rico com descrições manuais)...');

      // Usa o fluxo de sincronização do projectController, que já:
      // - Busca lista de projetos na SIF
      // - Para cada um, busca detalhes ricos (Description, Completion, etc.)
      // - Aplica override de descrições manuais usando MANUAL_DESCRIPTIONS_BY_GUID
      // - Faz upsert no modelo Project com mapSourceToLocalProject
      const result = await projectController.syncWithSource();

      res.json({
        success: true,
        message: 'Projetos sincronizados com sucesso',
        ...result
      });
    } catch (error) {
      console.error('Erro ao sincronizar projetos:', error);
      res.status(500).json({
        success: false,
        message: 'Falha ao sincronizar projetos',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  /**
   * Sincroniza apenas os setores
   * @route POST /api/sync/sectors
   */
  async syncSectors(req, res) {
    try {
      const sectors = await syncService.fetchSectors();
      // Aqui você pode salvar os setores no banco de dados se necessário
      
      res.json({
        success: true,
        message: 'Setores sincronizados com sucesso',
        sectors: sectors.length
      });
    } catch (error) {
      console.error('Erro ao sincronizar setores:', error);
      res.status(500).json({
        success: false,
        message: 'Falha ao sincronizar setores',
        error: error.message
      });
    }
  },

  /**
   * Sincroniza apenas os status
   * @route POST /api/sync/statuses
   */
  async syncStatuses(req, res) {
    try {
      const statuses = await syncService.fetchStatuses();
      // Aqui você pode salvar os status no banco de dados se necessário
      
      res.json({
        success: true,
        message: 'Status sincronizados com sucesso',
        statuses: statuses.length
      });
    } catch (error) {
      console.error('Erro ao sincronizar status:', error);
      res.status(500).json({
        success: false,
        message: 'Falha ao sincronizar status',
        error: error.message
      });
    }
  }
};

module.exports = syncController;
