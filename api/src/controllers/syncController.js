const syncService = require('../services/syncService');
const { Project } = require('../models');

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
      console.log('Iniciando sincronização de projetos...');
      const projects = await syncService.fetchAllProjects();
      console.log(`Total de projetos encontrados: ${projects.length}`);
      
      if (projects.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum projeto encontrado para sincronizar',
          projectsSynced: 0
        });
      }
      
      // Filtra registros inválidos sem sourceId
      const valid = projects.filter(p => p && p.sourceId);
      const dropped = projects.length - valid.length;
      if (dropped > 0) {
        console.warn(`Projetos descartados por ausência de sourceId: ${dropped}`);
      }

      // Salva os projetos no banco de dados local (confia na unique key de sourceId)
      const results = await Promise.all(valid.map(project => 
        Project.upsert(project)
      ));
      
      const upsertedCount = results.filter(r => Array.isArray(r) ? r[1] : false).length; // compat
      
      res.json({
        success: true,
        message: 'Projetos sincronizados com sucesso',
        totalProjects: valid.length,
        upserted: upsertedCount,
        updated: valid.length - upsertedCount,
        dropped
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
