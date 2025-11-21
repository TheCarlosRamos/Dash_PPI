const axios = require('axios');

class SourceService {
  constructor() {
    const username = process.env.SOURCE_API_USER || 'adminppi.source@presidencia.gov.br';
    const password = process.env.SOURCE_API_PASS || 'PPI#source147';
    const basic = Buffer.from(`${username}:${password}`).toString('base64');
    this.client = axios.create({
      baseURL: process.env.SOURCE_API_URL || 'https://api.sif-source.org',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'SPHostUrl': 'https://www.sif-source.org',
        'SPLanguage': 'pt-BR',
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': `Basic ${basic}`,
        'User-Agent': 'PostmanRuntime/7.50.0'
      },
      params: {
        SPClientTag: '0',
        SPProductNumber: '15.0.5023.1005',
        SPHostUrl: 'https://www.sif-source.org',
        SPLanguage: 'pt-BR'
      },
      withCredentials: true
    });
  }

  async fetchProjects() {
    try {
      const response = await this.client.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects from SOURCE API:', error.message);
      throw error;
    }
  }

  async fetchProjectDetails(projectId) {
    try {
      const response = await this.client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${projectId} details:`, error.message);
      throw error;
    }
  }

  async fetchQuestionByCode(projectId, sourceCode) {
    try {
      const response = await this.client.get(`/projects/${projectId}/questions/search/${sourceCode}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching question ${sourceCode} for project ${projectId}:`, error.message);
      throw error;
    }
  }

  async syncProjects() {
    try {
      const Project = require('../models/Project');
      const projects = await this.fetchProjects();
      const results = [];

      for (const project of projects) {
        try {
          // 'details' é o projeto completo vindo de /projects/{GUID}, incluindo Description
          const details = await this.fetchProjectDetails(project.id);
          
          const projectData = {
            // usa o identificador da SOURCE como chave de origem
            sourceId: project.id,
            name: details.Name || project.name || 'Sem nome',
            // PEGA A DESCRIÇÃO RICA DIRETAMENTE DO DETALHE DA SIF
            description: details.Description || project.description || '',
            sector: details.Sector?.Value || project.sector?.Value || 'Outros',
            subSector: details.SubSector?.Value || project.subSector?.Value || null,
            status: details.CurrentProjectStatus?.Value || project.status || 'Desconhecido',
            estimatedCost: details.EstimatedCapitalCost ?? project.estimatedCapitalCost ?? null,
            progress: this.calculateProgress(details),
            currentSituation: this.extractCurrentSituation(details),
            nextSteps: this.extractNextSteps(details),
            risks: this.extractRisks(details),
            // guarda o JSON completo da SIF (com Description) em rawData
            rawData: details,
            lastSyncedAt: new Date()
          };

          const [savedProject] = await Project.upsert(projectData, {
            where: { sourceId: project.id },
            returning: true
          });

          results.push(savedProject);
        } catch (error) {
          console.error(`Error processing project ${project.id}:`, error.message);
        }
      }

      return results;
    } catch (error) {
      console.error('Error syncing projects:', error);
      throw error;
    }
  }

  calculateProgress(project) {
    // Implemente a lógica para calcular o progresso com base nos estágios do projeto
    return project.progress || 0;
  }

  extractCurrentSituation(details) {
    // Implemente a lógica para extrair a situação atual
    return details.currentSituation || 'Informação não disponível';
  }

  extractNextSteps(details) {
    // Implemente a lógica para extrair os próximos passos
    return details.nextSteps || 'Próximos passos não definidos';
  }

  extractRisks(details) {
    // Implemente a lógica para extrair os riscos
    return details.risks || [];
  }
}

module.exports = new SourceService();
