const sourceApiService = require('../services/sourceApiService');
const Project = require('../models/Project');
const sourceService = require('../services/sourceService');

const sourceController = {
  async syncProjects(req, res) {
    try {
      // Busca os projetos da API do SOURCE
      const projects = await sourceApiService.getProjects();
      
      // Array para armazenar os projetos processados
      const processedProjects = [];
      
      // Processa cada projeto
      for (const project of projects) {
        try {
          // Busca detalhes adicionais do projeto
          const details = await sourceApiService.getProjectDetails(project.id);
          
          // Mapeia os dados para o formato do seu modelo
          const projectData = {
            sourceId: project.id,
            name: project.name || 'Sem nome',
            description: project.description || '',
            sector: project.sector?.Value || 'Outros',
            subSector: project.subSector?.Value || null,
            status: project.status || 'Desconhecido',
            estimatedCost: project.estimatedCapitalCost || null,
            progress: this.calculateProgress(project),
            currentSituation: this.extractCurrentSituation(details),
            nextSteps: this.extractNextSteps(details),
            risks: this.extractRisks(details),
            rawData: details,
            lastSyncedAt: new Date()
          };
          
          // Salva ou atualiza o projeto no banco de dados
          const [savedProject] = await Project.upsert(projectData, {
            where: { sourceId: project.id },
            returning: true
          });
          
          processedProjects.push(savedProject);
          
        } catch (error) {
          console.error(`Error processing project ${project.id}:`, error.message);
        }
      }
      
      res.json({
        message: 'Sincronização concluída com sucesso',
        count: processedProjects.length,
        projects: processedProjects
      });
      
    } catch (error) {
      console.error('Error syncing projects:', error);
      res.status(500).json({ 
        error: 'Erro ao sincronizar projetos',
        details: error.message 
      });
    }
  },
  
  // Métodos auxiliares para processar os dados
  calculateProgress(project) {
    // Implemente a lógica para calcular o progresso com base nos estágios do projeto
    return project.progress || 0;
  },
  
  extractCurrentSituation(details) {
    // Implemente a lógica para extrair a situação atual
    return details.currentSituation || 'Informação não disponível';
  },
  
  extractNextSteps(details) {
    // Implemente a lógica para extrair os próximos passos
    return details.nextSteps || 'Próximos passos não definidos';
  },
  
  extractRisks(details) {
    // Implemente a lógica para extrair os riscos
    return details.risks || [];
  },
  
  // Outros métodos da API podem ser adicionados aqui
  async getReferenceData(req, res) {
    try {
      const data = await sourceApiService.getReferenceData();
      res.json(data);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar dados de referência',
        details: error.message 
      });
    }
  },

  async listSourceProjects(req, res) {
    try {
      const resp = await sourceService.client.get('/projects');
      const arr = Array.isArray(resp.data) ? resp.data : (resp.data.value || resp.data.Items || resp.data.projects || []);
      const mapped = arr.map(p => {
        const id = (p.Guid ?? p.guid ?? p.Id ?? p.id);
        const name = (p.Name ?? p.name ?? p.Title ?? p.title ?? 'Sem título');
        const sector = (p.Sector?.Value ?? p.Sector?.Name ?? 'Outro');
        const status = (p.CurrentProjectStatus ?? p.Status ?? 'Rascunho');
        const estimatedCost = (p.EstimatedCapitalCost ?? 0);
        const completion = (p.Completion ?? null);
        return {
          sourceId: id ? String(id) : undefined,
          name: String(name),
          sector: String(sector),
          status: String(status),
          estimatedCost: Number(estimatedCost) || 0,
          progress: typeof completion === 'number' ? Math.max(0, Math.min(100, Math.round(completion))) : null,
          raw: p
        };
      }).filter(p => p.sourceId);
      res.json(mapped);
    } catch (error) {
      console.error('Error listing source projects:', error.message);
      res.status(500).json({ error: 'Falha ao listar projetos da SIF-Source', details: error.message });
    }
  }
};

module.exports = sourceController;
