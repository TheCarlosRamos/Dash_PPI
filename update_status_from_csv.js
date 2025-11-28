const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// File paths
const PROJECTS_JSON = path.join(__dirname, 'apresentacao', 'projects.json');
const STATUS_CSV = path.join(__dirname, 'projetos_status.csv');
const BACKUP_JSON = path.join(__dirname, 'projects_backup.json');

// Status mapping from CSV to our format
const STATUS_MAP = {
  'Completed': 'Concluído',
  'In progress': 'Em Andamento',
  'Not started': 'Não Iniciado',
  'Not Available': 'Não Disponível'
};

// Create a backup of projects.json
function createBackup() {
  try {
    if (fs.existsSync(PROJECTS_JSON)) {
      const backupContent = fs.readFileSync(PROJECTS_JSON, 'utf8');
      fs.writeFileSync(BACKUP_JSON, backupContent);
      console.log('Backup created successfully at:', BACKUP_JSON);
    }
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

// Load projects
function loadProjects() {
  try {
    const data = fs.readFileSync(PROJECTS_JSON, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

// Load status from CSV
function loadStatusFromCSV() {
  return new Promise((resolve, reject) => {
    const statusData = {};
    fs.createReadStream(STATUS_CSV)
      .pipe(csv())
      .on('data', (row) => {
        // Clean up the project name by removing any HTML entities
        const cleanName = row.name
          .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
          .replace(/&[a-z]+;/g, '') // Remove any remaining HTML entities
          .trim();

        statusData[cleanName] = {
          etapas: {
            'etapa2': { status: STATUS_MAP[row['Estudos']] || row['Estudos'] || 'Não Disponível' },
            'etapa5': { status: STATUS_MAP[row['Consulta Pública']] || row['Consulta Pública'] || 'Não Disponível' },
            'etapa9': { status: STATUS_MAP[row['Edital']] || row['Edital'] || 'Não Disponível' },
            'etapa13': { status: STATUS_MAP[row['Aviso/TCU']] || row['Aviso/TCU'] || 'Não Disponível' }
          }
        };
      })
      .on('end', () => resolve(statusData))
      .on('error', reject);
  });
}

// Find best matching project name
function findBestMatch(projectName, statusKeys) {
  // Try exact match first
  if (statusKeys.includes(projectName)) {
    return projectName;
  }

  // Try case-insensitive match
  const lowerName = projectName.toLowerCase();
  const match = statusKeys.find(key => key.toLowerCase() === lowerName);
  if (match) return match;

  // Try partial match
  for (const key of statusKeys) {
    if (projectName.includes(key) || key.includes(projectName)) {
      return key;
    }
  }

  return null;
}

// Update projects with status from CSV
async function updateProjectsStatus() {
  try {
    console.log('Starting status update process...');
    createBackup();

    const projects = loadProjects();
    const statusData = await loadStatusFromCSV();
    const statusKeys = Object.keys(statusData);
    let updatedCount = 0;
    const notFound = [];

    console.log(`\nFound ${projects.length} projects to update`);
    console.log(`Found status data for ${statusKeys.length} projects\n`);

    for (const project of projects) {
      const projectName = project.name.trim();
      let status = statusData[projectName];

      // If no direct match, try to find a close match
      if (!status) {
        const bestMatch = findBestMatch(projectName, statusKeys);
        if (bestMatch) {
          console.log(`Matched: "${projectName}" with "${bestMatch}"`);
          status = statusData[bestMatch];
        }
      }

      if (status) {
        // Initialize details if not exists
        project.details = project.details || {};
        
        // Update each etapa status
        for (const [etapa, data] of Object.entries(status.etapas)) {
          project.details[etapa] = {
            status: data.status,
            lastUpdated: new Date().toISOString()
          };
        }
        
        updatedCount++;
        console.log(`✓ Updated: ${projectName}`);
      } else {
        console.log(`✗ No status found for: ${projectName}`);
        notFound.push(projectName);
      }
    }

    // Save updated projects
    fs.writeFileSync(PROJECTS_JSON, JSON.stringify(projects, null, 2));
    
    console.log(`\n✅ Successfully updated ${updatedCount} projects`);
    
    if (notFound.length > 0) {
      console.log(`\n❌ Could not find status for ${notFound.length} projects:`);
      notFound.forEach(name => console.log(`  - ${name}`));
    }

  } catch (error) {
    console.error('\n❌ Error updating project statuses:', error);
    console.log('\nA backup of your original projects.json has been saved as projects_backup.json');
  }
}

// Run the update
updateProjectsStatus();