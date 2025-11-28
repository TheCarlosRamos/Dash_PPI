const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Configuration
const PROJECTS_CSV = path.join(__dirname, 'projects.csv');
const PROJECTS_JSON = path.join(__dirname, 'apresentacao', 'projects.json');
const CACHE_FILE = path.join(__dirname, 'status_cache.json');

// API endpoints for each stage
const STAGE_ENDPOINTS = {
  'etapa2': 'https://api.sif-source.org/projects/{{projectId}}/questions/search/2001218',
  'etapa5': 'https://api.sif-source.org/projects/{{projectId}}/questions/search/2001221',
  'etapa9': 'https://api.sif-source.org/projects/{{projectId}}/questions/search/2001226',
  'etapa13': 'https://api.sif-source.org/projects/{{projectId}}/questions/search/2001229'
};

// Common query parameters
const COMMON_PARAMS = 'SPHostUrl=https%3A%2F%2Fwww.sif-source.org&SPLanguage=pt-BR&SPClientTag=0&SPProductNumber=15.0.5023.1183';

// Load existing projects
function loadProjects() {
  try {
    const data = fs.readFileSync(PROJECTS_JSON, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

// Load project IDs from CSV
function loadProjectIds() {
  try {
    const data = fs.readFileSync(PROJECTS_CSV, 'utf8');
    return data.split('\n')
      .slice(1) // Skip header
      .map(line => line.trim())
      .filter(Boolean);
  } catch (error) {
    console.error('Error loading project IDs:', error);
    return [];
  }
}

// Load cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading cache:', error);
  }
  return {};
}

// Save cache
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

// Fetch status for a project stage
async function fetchStageStatus(projectId, stage) {
  const url = `${STAGE_ENDPOINTS[stage].replace('{{projectId}}', projectId)}?${COMMON_PARAMS}`;
  
  try {
    const response = await axios.get(url);
    return {
      status: response.data?.FieldValue?.Value?.Value || 'Not Available',
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching ${stage} for project ${projectId}:`, error.message);
    return {
      status: 'Error',
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
}

// Update project statuses
async function updateProjectStatuses() {
  const projectIds = loadProjectIds();
  const projects = loadProjects();
  const cache = loadCache();
  
  console.log(`Found ${projectIds.length} projects to update`);
  
  for (const project of projects) {
    const projectId = project.id || project.guid;
    if (!projectId) continue;
    
    console.log(`\nUpdating project: ${project.name || projectId}`);
    
    // Initialize details if not exists
    if (!project.details) {
      project.details = {};
    }
    
    // Fetch status for each stage
    for (const [stage] of Object.entries(STAGE_ENDPOINTS)) {
      const cacheKey = `${projectId}_${stage}`;
      
      // Use cached data if available and not older than 1 hour
      if (cache[cacheKey] && (Date.now() - new Date(cache[cacheKey].lastUpdated).getTime() < 3600000)) {
        console.log(`  Using cached data for ${stage}`);
        project.details[stage] = cache[cacheKey];
        continue;
      }
      
      console.log(`  Fetching ${stage}...`);
      const status = await fetchStageStatus(projectId, stage);
      
      // Update project and cache
      project.details[stage] = status;
      cache[cacheKey] = status;
      
      // Save after each update to prevent data loss
      saveProjects(projects);
      saveCache(cache);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Final save
  saveProjects(projects);
  console.log('\nAll projects updated successfully!');
}

// Save projects to file
function saveProjects(projects) {
  try {
    fs.writeFileSync(PROJECTS_JSON, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error('Error saving projects:', error);
  }
}

// Run the update
updateProjectStatuses().catch(console.error);
