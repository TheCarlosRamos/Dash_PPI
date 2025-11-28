const fs = require('fs');
const path = require('path');

async function syncStageStatuses() {
    try {
        // Load projects data
        const projectsPath = path.join(__dirname, 'apresentacao', 'projects.json');
        const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        
        // Load stage statuses from projetos_descricao.json
        const statusesPath = path.join(__dirname, 'apresentacao', 'projetos_descricao.json');
        const statusesData = JSON.parse(fs.readFileSync(statusesPath, 'utf8'));
        
        // Create a map of project GUIDs to their statuses for faster lookup
        const statusesMap = {};
        Object.entries(statusesData).forEach(([guid, project]) => {
            if (project.details) {
                statusesMap[guid] = {
                    etapa2: project.details.etapa2,
                    etapa5: project.details.etapa5,
                    etapa9: project.details.etapa9,
                    etapa13: project.details.etapa13
                };
            }
        });
        
        // Update projects with stage statuses
        let updatedCount = 0;
        const updatedProjects = projectsData.map(project => {
            // Try to find matching project in statuses by ID or name
            const projectStatus = statusesMap[project.id] || 
                                 Object.values(statusesData).find(p => 
                                     p.nome === project.name || 
                                     p.id === project.id
                                 )?.details;
            
            if (projectStatus) {
                updatedCount++;
                return {
                    ...project,
                    details: {
                        ...project.details,
                        etapa2: projectStatus.etapa2 || { status: 'Not Available' },
                        etapa5: projectStatus.etapa5 || { status: 'Not Available' },
                        etapa9: projectStatus.etapa9 || { status: 'Not Available' },
                        etapa13: projectStatus.etapa13 || { status: 'Not Available' }
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
    }
}

syncStageStatuses();
