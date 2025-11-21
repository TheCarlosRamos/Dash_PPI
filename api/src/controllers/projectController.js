const Project = require('../models/Project');
const sourceApiService = require('../services/sourceApiService');
const sourceService = require('../services/sourceService');
const fs = require('fs');
const path = require('path');

// Mapeamento de status entre SOURCE e nossa aplicação
const STATUS_MAPPING = {
  'In Progress': 'em_andamento',
  'Completed': 'concluido',
  'On Hold': 'pausado',
  'Cancelled': 'cancelado',
  'Draft': 'rascunho'
};

// Mapeamento de setores
const SECTOR_MAPPING = {
  'Transport': 'Transporte',
  'Energy': 'Energia',
  'Infrastructure': 'Infraestrutura',
  'Technology': 'Tecnologia'
};

// Descrições manuais extraídas do Postman (Guid -> { description, name })
let MANUAL_DESCRIPTIONS_BY_GUID = {};

try {
  const manualPath = path.join(__dirname, '..', '..', '..', 'projetos_descricao.json');
  if (fs.existsSync(manualPath)) {
    const raw = fs.readFileSync(manualPath, 'utf8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      MANUAL_DESCRIPTIONS_BY_GUID = {};
      for (const item of arr) {
        if (item.guid) {
          MANUAL_DESCRIPTIONS_BY_GUID[item.guid] = item;
        }
      }
      console.log('[manual] descrições carregadas no backend:', arr.length);
    }
  }
} catch (e) {
  console.warn('[manual] falha ao carregar projetos_descricao.json no backend:', e.message);
}

const projectController = {
  async getAllProjects(req, res) {
    try {
      const { sync = 'false', limit, offset } = req.query;
      
      if (sync === 'true') {
        // Sincroniza com a API SOURCE antes de buscar
        await this.syncWithSource();
      }
      
      // Tenta buscar projetos do banco de dados
      try {
        const findOpts = { order: [['createdAt', 'DESC']] };
        if (limit !== undefined) {
          const n = parseInt(limit, 10);
          if (!Number.isNaN(n) && n > 0) findOpts.limit = n;
        }
        if (offset !== undefined) {
          const n = parseInt(offset, 10);
          if (!Number.isNaN(n) && n >= 0) findOpts.offset = n;
        }
        const projects = await Project.findAll(findOpts);
        
        if (projects && projects.length > 0) {
          return res.json(projects);
        }
      } catch (dbError) {
        console.warn('Could not fetch projects from database, using sample data:', dbError.message);
      }
      
      // Fallback para dados de exemplo
      const sampleProjects = [
        {
          id: "645051e9-2b1e-4657-8dad-63f626b93609",
          sourceId: "local-1762862692708",
          name: "Meu Projeto de Teste",
          description: "Descrição do projeto",
          sector: "Saúde",
          subSector: null,
          status: "Em andamento",
          estimatedCost: 1000000,
          progress: 30,
          currentSituation: null,
          nextSteps: null,
          risks: null,
          rawData: null,
          lastSyncedAt: null,
          createdAt: "2025-11-11T12:04:52.708Z",
          updatedAt: "2025-11-11T12:04:52.708Z"
        },
        {
          id: "3d7b8a71-488b-46c3-9d55-33ab750f3ae5",
          sourceId: "local-1762862577496",
          name: "Projeto de Teste Local",
          description: "Este é um projeto de teste criado localmente",
          sector: "Saúde",
          subSector: null,
          status: "Em andamento",
          estimatedCost: 500000,
          progress: 15,
          currentSituation: null,
          nextSteps: null,
          risks: null,
          rawData: null,
          lastSyncedAt: null,
          createdAt: "2025-11-11T12:02:57.500Z",
          updatedAt: "2025-11-11T12:02:57.500Z"
        },
        {
          id: "18ae2f0e-a6fd-42f1-a9f5-f045faa4f81f",
          sourceId: "local-1762862538313",
          name: "Projeto de Teste Local",
          description: "Este é um projeto de teste criado localmente",
          sector: "Saúde",
          subSector: null,
          status: "Em andamento",
          estimatedCost: 500000,
          progress: 5,
          currentSituation: null,
          nextSteps: null,
          risks: null,
          rawData: null,
          lastSyncedAt: null,
          createdAt: "2025-11-11T12:02:18.315Z",
          updatedAt: "2025-11-11T12:02:18.315Z"
        }
      ];
      
      res.json(sampleProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ 
        error: 'Falha ao buscar projetos',
        details: error.message 
      });
    }
  },

  async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const { sync = 'false' } = req.query;
      let project = null;

      // Se o ID vier com o prefixo 'source-', buscamos diretamente na API SOURCE
      // sem tentar consultar o banco (evita erro de UUID inválido)
      if (id.startsWith('source-')) {
        const sourceId = id.replace('source-', '');
        project = await this.getProjectFromSource(sourceId);
      } else {
        // ID normal: tenta buscar pelo primary key no banco local
        project = await Project.findByPk(id);

        // Se não encontrou localmente mas foi solicitado sync explícito,
        // tenta buscar na SOURCE usando o próprio id como identificador
        if (!project && sync === 'true') {
          project = await this.getProjectFromSource(id);
        }
      }
      
      if (!project) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ 
        error: 'Falha ao buscar projeto',
        details: error.message 
      });
    }
  },

  async createProject(req, res) {
    try {
      const projectData = {
        sourceId: `local-${Date.now()}`,
        name: req.body.name || 'Novo Projeto',
        description: req.body.description || '',
        sector: req.body.sector || 'Outros',
        subSector: req.body.subSector || null,
        status: req.body.status || 'rascunho',
        estimatedCost: parseFloat(req.body.estimatedCost) || 0,
        progress: parseInt(req.body.progress) || 0,
        currentSituation: req.body.currentSituation || '',
        metadata: JSON.stringify(req.body.metadata || {})
      };

      const project = await Project.create(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ 
        error: 'Falha ao criar projeto',
        details: error.message 
      });
    }
  },

  async syncProjects(req, res) {
    try {
      const result = await this.syncWithSource();
      res.json({
        success: true,
        message: 'Projetos sincronizados com sucesso',
        ...result
      });
    } catch (error) {
      console.error('Error syncing projects:', error);
      res.status(500).json({ 
        error: 'Falha ao sincronizar projetos',
        details: error.message 
      });
    }
  },

  // Método auxiliar para sincronização com a API SOURCE
  async syncWithSource() {
    try {
      // 1. Buscar projetos da API SOURCE
      const sourceProjects = await sourceApiService.getProjects();
      
      if (!Array.isArray(sourceProjects)) {
        throw new Error('Resposta inesperada da API SOURCE');
      }
      
      let created = 0;
      let updated = 0;
      let errors = 0;
      
      // 2. Para cada projeto, buscar detalhes na API rica (api.sif-source.org) e criar/atualizar localmente
      for (const sourceProject of sourceProjects) {
        try {
          // Alguns campos (como Description, Completion, etc.) só aparecem na API principal (https://api.sif-source.org)
          let fullProject = sourceProject;
          try {
            const guid = sourceProject.Guid ?? sourceProject.guid ?? sourceProject.Id ?? sourceProject.id;
            if (guid) {
              const detailed = await sourceService.fetchProjectDetails(guid);
              if (detailed && typeof detailed === 'object') {
                fullProject = detailed;
              }
            }
          } catch (detailError) {
            console.warn(`Não foi possível buscar detalhes completos do projeto ${sourceProject.Id}:`, detailError.message);
          }

          const projectData = this.mapSourceToLocalProject(fullProject);
          
          // Verifica se o projeto já existe
          const [project, wasCreated] = await Project.upsert(projectData, {
            where: { sourceId: projectData.sourceId },
            returning: true
          });
          
          wasCreated ? created++ : updated++;
          
        } catch (error) {
          console.error(`Error syncing project ${sourceProject.Id}:`, error);
          errors++;
        }
      }
      
      return {
        total: sourceProjects.length,
        created,
        updated,
        errors
      };
      
    } catch (error) {
      console.error('Error in syncWithSource:', error);
      throw error;
    }
  },

  // Mapeia um projeto da API SOURCE para o formato local
  mapSourceToLocalProject(sourceProject) {
    // Tenta usar descrição manual (Postman) com base no Guid
    const guid = sourceProject.Guid || sourceProject.guid || sourceProject.Id || sourceProject.id;
    const manual = guid && MANUAL_DESCRIPTIONS_BY_GUID[guid]
      ? MANUAL_DESCRIPTIONS_BY_GUID[guid]
      : null;

    const description =
      (manual && manual.description) ||
      sourceProject.Description ||
      sourceProject.description ||
      '';
    const completion =
      typeof sourceProject.Completion === 'number'
        ? Math.max(0, Math.min(100, Math.round(sourceProject.Completion * 100)))
        : null;

    return {
      sourceId: `source-${sourceProject.Id}`,
      name: sourceProject.Name || sourceProject.name || 'Projeto sem nome',
      description,
      sector: SECTOR_MAPPING[sourceProject.Sector?.Value] || sourceProject.Sector?.Value || 'Outros',
      subSector: sourceProject.SubSector?.Value || null,
      status: STATUS_MAPPING[sourceProject.Status] || sourceProject.Status || 'rascunho',
      estimatedCost: sourceProject.EstimatedCapitalCost || 0,
      progress: completion !== null ? completion : this.calculateProjectProgress(sourceProject),
      currentSituation: sourceProject.CurrentSituation || '',
      rawData: sourceProject,
      metadata: JSON.stringify(sourceProject)
    };
  },

  // Calcula o progresso com base no status do projeto
  calculateProjectProgress(project) {
    const progressMap = {
      'Draft': 10,
      'In Progress': 40,
      'On Hold': 50,
      'Completed': 100,
      'Cancelled': 0
    };
    
    return progressMap[project.Status] || 0;
  },

  async getSectors(req, res) {
    try {
      // Tenta buscar setores da API SOURCE primeiro
      try {
        const referenceData = await sourceApiService.getReferenceData();
        if (referenceData && referenceData.Sectors) {
          return res.json(referenceData.Sectors);
        }
      } catch (error) {
        console.warn('Could not fetch sectors from SOURCE API, using default:', error.message);
      }
      
      // Fallback para setores padrão
      const defaultSectors = [
        { Id: 1, Value: 'Transporte' },
        { Id: 2, Value: 'Energia' },
        { Id: 3, Value: 'Infraestrutura' },
        { Id: 4, Value: 'Tecnologia' },
        { Id: 5, Value: 'Saúde' },
        { Id: 6, Value: 'Educação' }
      ];
      
      res.json(defaultSectors);
    } catch (error) {
      console.error('Error getting sectors:', error);
      res.status(500).json({ 
        error: 'Falha ao buscar setores',
        details: error.message 
      });
    }
  },

  getProjectStatuses(req, res) {
    try {
      const statuses = [
        { id: 'em_andamento', name: 'Em andamento' },
        { id: 'concluido', name: 'Concluído' },
        { id: 'pausado', name: 'Em pausa' },
        { id: 'cancelado', name: 'Cancelado' },
        { id: 'rascunho', name: 'Rascunho' },
        { id: 'planejamento', name: 'Em planejamento' },
        { id: 'em_aprovacao', name: 'Em aprovação' },
        { id: 'suspenso', name: 'Suspenso' }
      ];
      
      res.json(statuses);
    } catch (error) {
      console.error('Error getting project statuses:', error);
      res.status(500).json({ 
        error: 'Falha ao buscar status de projetos',
        details: error.message 
      });
    }
  },

  // Método para buscar um único projeto da API SOURCE
  async getProjectFromSource(projectId) {
    try {
      const sourceProject = await sourceApiService.getProjectById(projectId);
      if (!sourceProject) {
        throw new Error('Projeto não encontrado na API SOURCE');
      }
      
      // Converte para o formato local e salva
      const projectData = this.mapSourceToLocalProject(sourceProject);
      const [project] = await Project.upsert(projectData, {
        where: { sourceId: projectData.sourceId },
        returning: true
      });
      
      return project;
      
    } catch (error) {
      console.error(`Error fetching project ${projectId} from SOURCE:`, error);
      throw new Error(`Falha ao buscar projeto da API SOURCE: ${error.message}`);
    }
  }
};

module.exports = projectController;