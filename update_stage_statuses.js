const fs = require('fs');
const path = require('path');

async function updateStageStatuses() {
    try {
        console.log('Starting to update stage statuses...');
        
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
        
        // Create a map of project names to their status data for easier lookup
        const projectNameToStatus = {};
        Object.values(statusesData).forEach(project => {
            if (project.name) {
                projectNameToStatus[project.name.toLowerCase()] = project;
            }
        });
        
        // Update projects with stage statuses
        let updatedCount = 0;
        
        const updatedProjects = projects.map(project => {
            // Try to find matching project by name (case-insensitive)
            const matchingStatus = projectNameToStatus[project.name?.toLowerCase()];
            
            if (matchingStatus?.details) {
                const { details } = matchingStatus;
                const etapas = {
                    etapa2: details.etapa2 || { status: 'Not Available' },
                    etapa5: details.etapa5 || { status: 'Not Available' },
                    etapa9: details.etapa9 || { status: 'Not Available' },
                    etapa13: details.etapa13 || { status: 'Not Available' }
                };
                
                updatedCount++;
                console.log(`Updating project: ${project.name}`);
                console.log('Stage statuses:', JSON.stringify(etapas, null, 2));
                
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
        console.log(`\nSuccessfully updated ${updatedCount} projects with stage statuses.`);
        
    } catch (error) {
        console.error('Error updating stage statuses:', error);
        if (error.code === 'ENOENT') {
            console.error('File not found. Please check the file paths.');
        }
    }
}

updateStageStatuses();
