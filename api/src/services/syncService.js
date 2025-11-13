const Project = require('../models/Project');
const sourceService = require('./sourceService');

class SyncService {
  constructor() {
    this.sourceApi = sourceService.client;
  }

  /**
   * Busca todos os projetos da API SOURCE
   * @returns {Promise<Array>} Lista de projetos formatados
   */
  async fetchAllProjects() {
    try {
      console.log('Buscando projetos da API SOURCE...');
      const response = await this.sourceApi.get('/projects');
      
      // Verifica se a resposta é um array ou um objeto com uma propriedade que contém os projetos
      const projects = Array.isArray(response.data) ? response.data : 
                     (response.data.value || response.data.Items || response.data.projects || []);
      
      const mapped = [];
      let skipped = 0;
      for (const p of projects) {
        try {
          const m = this.formatProject(p);
          if (m && m.sourceId) mapped.push(m); else skipped++;
        } catch {
          skipped++;
        }
      }
      console.log(`Projetos mapeados: ${mapped.length}, descartados: ${skipped}`);
      return mapped;
    } catch (error) {
      console.error('Erro ao buscar projetos:', error.response?.data || error.message);
      throw new Error(`Falha ao buscar projetos da API SOURCE: ${error.message}`);
    }
  }

  /**
   * Busca todos os setores da API SOURCE
   * @returns {Promise<Array>} Lista de setores
   */
  async fetchSectors() {
    try {
      console.log('Buscando setores da API SOURCE...');
      const response = await this.sourceApi.get('/referenceData');
      // Tenta diferentes formatos de resposta
      return response.data?.Sectors || 
             response.data?.sectors || 
             response.data?.value || [];
    } catch (error) {
      console.error('Erro ao buscar setores:', error.response?.data || error.message);
      throw new Error(`Falha ao buscar setores da API SOURCE: ${error.message}`);
    }
  }

  /**
   * Busca todos os status de projeto da API SOURCE
   * @returns {Promise<Array>} Lista de status
   */
  async fetchStatuses() {
    try {
      console.log('Buscando status da API SOURCE...');
      const response = await this.sourceApi.get('/referenceData');
      
      // Tenta diferentes formatos de resposta
      return response.data?.ProjectStatuses || 
             response.data?.projectStatuses || 
             response.data?.statuses ||
             response.data?.value || [];
    } catch (error) {
      console.error('Erro ao buscar status:', error.response?.data || error.message);
      throw new Error(`Falha ao buscar status da API SOURCE: ${error.message}`);
    }
  }

  /**
   * Formata um projeto da API SOURCE para o formato local
   * @param {Object} project - Projeto da API SOURCE
   * @returns {Object} Projeto formatado
   */
  formatProject(project) {
    // Normaliza chaves possíveis vindas da SIF-Source
    const sourceId = (project.Guid ?? project.guid ?? project.Id ?? project.id ?? project.ID ?? project.ProjectId ?? project.ProjectID);
    const name = (project.Name ?? project.name ?? project.Title ?? project.title ?? 'Sem título');
    const description = (project.Description ?? project.description ?? '');
    const sectorObj = (project.Sector ?? project.sector ?? {});
    const sector = (sectorObj.Value ?? sectorObj.value ?? sectorObj.Name ?? sectorObj.name ?? 'Outro');
    const statusRaw = (project.CurrentProjectStatus ?? project.Status ?? project.status ?? 'Rascunho');
    const estimatedCost = (project.EstimatedCapitalCost ?? project.estimatedCapitalCost ?? 0);
    const completion = (project.Completion ?? project.completion);

    if (sourceId == null) {
      // Evita inserir registros inválidos
      throw new Error('Projeto sem Id na resposta da SIF-Source');
    }

    return {
      sourceId: String(sourceId),
      name: String(name),
      description: String(description),
      sector: String(sector),
      status: this.mapStatus(statusRaw),
      estimatedCost: Number(estimatedCost) || 0,
      progress: typeof completion === 'number' ? Math.max(0, Math.min(100, Math.round(completion))) : this.calculateProgress(this.mapStatus(statusRaw)),
      rawData: project,
      lastSyncedAt: new Date().toISOString()
    };
  }

  /**
   * Mapeia o status da API SOURCE para o formato local
   */
  mapStatus(status) {
    const statusMap = {
      'In Progress': 'Em andamento',
      'Completed': 'Concluído',
      'On Hold': 'Em pausa',
      'Cancelled': 'Cancelado',
      'Draft': 'Rascunho',
      'Em andamento': 'Em andamento',
      'Concluído': 'Concluído',
      'Em pausa': 'Em pausa',
      'Cancelado': 'Cancelado',
      'Rascunho': 'Rascunho'
    };
    return statusMap[status] || 'Rascunho';
  }

  /**
   * Calcula o progresso com base no status
   */
  calculateProgress(status) {
    const progressMap = {
      'Rascunho': 10,
      'Em planejamento': 25,
      'Em aprovação': 40,
      'Em andamento': 60,
      'Em pausa': 75,
      'Concluído': 100,
      'Cancelado': 0
    };
    return progressMap[status] || 0;
  }

  /**
   * Sincroniza todos os dados da API SOURCE para o banco local
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async syncAllData() {
    try {
      const [projects, sectors, statuses] = await Promise.all([
        this.fetchAllProjects(),
        this.fetchSectors(),
        this.fetchStatuses()
      ]);

      // Salva os projetos no banco de dados local
      await Promise.all(projects.map(project => 
        Project.upsert(project, { where: { sourceId: project.sourceId } })
      ));

      return {
        success: true,
        projectsSynced: projects.length,
        sectors: sectors.length,
        statuses: statuses.length,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw new Error(`Falha na sincronização: ${error.message}`);
    }
  }
}

module.exports = new SyncService();
