const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');

// Configuration
const PROJECTS_CSV = path.join(__dirname, 'projects.csv');
const PROJECTS_JSON = path.join(__dirname, 'apresentacao', 'projects.json');
const PROJETOS_DESCRICAO_JSON = path.join(__dirname, 'apresentacao', 'projetos_descricao.json');

// API Configuration
const API_BASE = 'https://api.sif-source.org/projects';
const API_PARAMS = 'SPHostUrl=https%3A%2F%2Fwww.sif-source.org&SPLanguage=pt-BR&SPClientTag=0&SPProductNumber=15.0.5023.1183';

// Stage configuration
const STAGES = {
  'etapa2': {
    code: '2001218',
    name: 'Estudos',
    field: 'etapa2'
  },
  'etapa5': {
    code: '2001221',
    name: 'Consulta Pública',
    field: 'etapa5'
  },
  'etapa9': {
    code: '2001226',
    name: 'Aviso de Licitação',
    field: 'etapa9'
  },
  'etapa13': {
    code: '2001229',
    name: 'Licitação',
    field: 'etapa13'
  }
};

// Cache for API responses
const apiCache = new Map();

async function fetchWithCache(projectId, stage) {
  const url = `${API_BASE}/${projectId}/questions/search/${stage.code}?${API_PARAMS}`;
  const cacheKey = `${projectId}_${stage.code}`;

  if (apiCache.has(cacheKey)) {
    console.log(`Using cached response for ${stage.name} (${stage.code})`);
    return apiCache.get(cacheKey);
  }

  try {
    console.log(`Fetching ${stage.name} (${stage.code}) for project ${projectId}...`);
    const auth = Buffer.from('adminppi.source@presidencia.gov.br:PPI#source147').toString('base64');
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Authorization': `Basic ${auth}`
      },
      timeout: 15000
    });

    apiCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${stage.name} (${stage.code}) for project ${projectId}:`, 
      error.response?.status || error.message);
    return null;
  }
}

async function loadProjectIds() {
  try {
    const data = await fs.readFile(PROJECTS_CSV, 'utf8');
    return data.split('\n')
      .slice(1) // Skip header
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('local-'));
  } catch (error) {
    console.error('Error reading projects file:', error);
    return [];
  }
}

async function loadJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}:`, error);
    return [];
  }
}

async function saveJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully updated ${filePath}`);
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

function determineProjectStatus(stages) {
  if (stages.etapa13?.status === 'Completed') return 'Contrato Assinado';
  if (stages.etapa9?.status === 'Completed') return 'Em Licitação';
  if (stages.etapa5?.status === 'Completed') return 'Em Análise';
  if (stages.etapa2?.status === 'Completed') return 'Em Estudos';
  return 'Em Planejamento';
}

async function updateProjectStages(projectId, projects, projetosDescricao) {
  const stages = {};
  const stagePromises = Object.entries(STAGES).map(async ([key, stage]) => {
    const data = await fetchWithCache(projectId, stage);
    if (data?.FieldValue?.Value) {
      stages[key] = {
        status: data.FieldValue.Value.Value,
        key: data.FieldValue.Value.Key,
        lastUpdated: new Date().toISOString()
      };
    } else {
      stages[key] = {
        status: 'Not Available',
        lastUpdated: new Date().toISOString()
      };
    }
    // Add small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  await Promise.all(stagePromises);

  // Update projects.json
  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex !== -1) {
    projects[projectIndex].details = projects[projectIndex].details || {};
    Object.entries(stages).forEach(([key, stageData]) => {
      projects[projectIndex].details[key] = stageData;
    });
    projects[projectIndex].status = determineProjectStatus(stages);
    projects[projectIndex].lastUpdated = new Date().toISOString();
  }

  // Update projetos_descricao.json
  const descIndex = projetosDescricao.findIndex(p => p.guid === projectId);
  if (descIndex !== -1) {
    // Ensure we have a details object
    if (!projetosDescricao[descIndex].details) {
      projetosDescricao[descIndex].details = {};
    }
    
    // Update the stages in the details object
    Object.entries(stages).forEach(([key, stageData]) => {
      // Ensure the stage object exists
      if (!projetosDescricao[descIndex].details[key]) {
        projetosDescricao[descIndex].details[key] = {};
      }
      // Update the stage data
      Object.assign(projetosDescricao[descIndex].details[key], stageData);
    });
    
    // Add the overall status
    projetosDescricao[descIndex].status = determineProjectStatus(stages);
    projetosDescricao[descIndex].lastUpdated = new Date().toISOString();
  }

  return { projects, projetosDescricao };
}

async function main() {
  console.log('Starting to update project stages...');
  
  // Load project IDs
  const projectIds = await loadProjectIds();
  console.log(`Found ${projectIds.length} valid project IDs to process`);

  if (projectIds.length === 0) {
    console.error('No valid project IDs found. Please check the projects.csv file.');
    return;
  }

  // Load existing data
  const projects = await loadJsonFile(PROJECTS_JSON) || [];
  const projetosDescricao = await loadJsonFile(PROJETOS_DESCRICAO_JSON) || [];
  
  console.log(`Processing ${projectIds.length} projects...`);

  // Process each project
  for (const projectId of projectIds) {
    console.log(`\nProcessing project ${projectId}...`);
    try {
      await updateProjectStages(projectId, projects, projetosDescricao);
    } catch (error) {
      console.error(`Error processing project ${projectId}:`, error.message);
    }
  }

  // Save the updated data
  await saveJsonFile(PROJECTS_JSON, projects);
  await saveJsonFile(PROJETOS_DESCRICAO_JSON, projetosDescricao);
  
  console.log('\nFinished updating all projects with stage statuses');
  console.log(`Updated ${projects.length} projects in projects.json`);
  console.log(`Updated ${projetosDescricao.length} projects in projetos_descricao.json`);
}

// Run the script
main().catch(console.error);
