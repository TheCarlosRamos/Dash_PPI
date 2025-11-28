const fs = require('fs');
const path = require('path');

async function syncStageStatuses() {
    try {
        console.log('Starting stage status sync...');
        
        // Load projects data
        const projectsPath = path.join(__dirname, 'apresentacao', 'projects.json');
        console.log(`Loading projects from: ${projectsPath}`);
        const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        console.log(`Loaded ${projects.length} projects.`);
        
        // Load statuses data
        const statusesPath = path.join(__dirname, 'apresentacao', 'projetos_descricao.json');
        console.log(`Loading statuses from: ${statusesPath}`);
        const statusesData = JSON.parse(fs.readFileSync(statusesPath, 'utf8'));
        console.log(`Loaded statuses for ${Object.keys(statusesData).length} projects.`);
        
        // Create a map of project names to their GUIDs for easier lookup
        const projectNameToGuid = {};
        Object.entries(statusesData).forEach(([guid, project]) => {
            if (project.nome) {
                projectNameToGuid[project.nome.toLowerCase()] = guid;
            }
        });
        
        // Update projects with stage statuses
        let updatedCount = 0;
        
        const updatedProjects = projects.map(project => {
            // Try to find matching project by ID or name
            const guid = statusesData[project.id] ? project.id : 
                        projectNameToGuid[project.name?.toLowerCase()];
            
            if (guid && statusesData[guid]?.details) {
                const statusDetails = statusesData[guid].details;
                const etapas = {
                    etapa2: statusDetails.etapa2 || { status: 'Not Available' },
                    etapa5: statusDetails.etapa5 || { status: 'Not Available' },
                    etapa9: statusDetails.etapa9 || { status: 'Not Available' },
                    etapa13: statusDetails.etapa13 || { status: 'Not Available' }
                };
                
                updatedCount++;
                return {
                    ...project,
                    details: {
                        ...project.details,
                        ...etapas
                    }
                };
            }
            return project;
        });
        
        // Save updated projects back to file
        fs.writeFileSync(projectsPath, JSON.stringify(updatedProjects, null, 2));
        console.log(`Successfully updated ${updatedCount} projects with stage statuses.`);
        
    } catch (error) {
        console.error('Error syncing stage statuses:', error);
        if (error.code === 'ENOENT') {
            console.error('File not found. Please check the file paths.');
        }
    }
}

syncStageStatuses();
