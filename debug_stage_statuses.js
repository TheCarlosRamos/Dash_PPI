const fs = require('fs');
const path = require('path');

async function debugStageStatuses() {
    try {
        console.log('Starting debug...');
        
        // Load projects data
        const projectsPath = path.join(__dirname, 'apresentacao', 'projects.json');
        console.log(`\nLoading projects from: ${projectsPath}`);
        const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        console.log(`Loaded ${projects.length} projects.`);
        
        // Log first few project names
        console.log('\nSample project names from projects.json:');
        projects.slice(0, 5).forEach((p, i) => {
            console.log(`${i + 1}. ${p.name} (ID: ${p.id})`);
        });
        
        // Load statuses data
        const statusesPath = path.join(__dirname, 'apresentacao', 'projetos_descricao.json');
        console.log(`\nLoading statuses from: ${statusesPath}`);
        const statusesData = JSON.parse(fs.readFileSync(statusesPath, 'utf8'));
        console.log(`Loaded statuses for ${Object.keys(statusesData).length} projects.`);
        
        // Get first few status entries
        console.log('\nSample project names from projetos_descricao.json:');
        const statusEntries = Object.entries(statusesData);
        statusEntries.slice(0, 5).forEach(([guid, project], i) => {
            console.log(`${i + 1}. ${project.name || 'No name'} (GUID: ${guid})`);
        });
        
        // Check for direct matches
        console.log('\nChecking for direct matches...');
        let matchFound = false;
        
        projects.some(project => {
            return Object.values(statusesData).some(statusProject => {
                if (statusProject.name && statusProject.name.toLowerCase() === project.name.toLowerCase()) {
                    console.log(`\nMatch found!`);
                    console.log(`Project: ${project.name}`);
                    console.log(`Status project: ${statusProject.name}`);
                    console.log('Status details:', JSON.stringify({
                        etapa2: statusProject.details?.etapa2,
                        etapa5: statusProject.details?.etapa5,
                        etapa9: statusProject.details?.etapa9,
                        etapa13: statusProject.details?.etapa13
                    }, null, 2));
                    matchFound = true;
                    return true;
                }
                return false;
            });
        });
        
        if (!matchFound) {
            console.log('\nNo direct name matches found. Trying partial matches...');
            
            projects.some(project => {
                return Object.values(statusesData).some(statusProject => {
                    if (statusProject.name && 
                        project.name && 
                        statusProject.name.toLowerCase().includes(project.name.toLowerCase())) {
                        console.log(`\nPartial match found!`);
                        console.log(`Project: ${project.name}`);
                        console.log(`Status project: ${statusProject.name}`);
                        matchFound = true;
                        return true;
                    }
                    return false;
                });
            });
        }
        
        if (!matchFound) {
            console.log('\nNo matches found. Here are the first few project names from both files for comparison:');
            
            console.log('\nProjects in projects.json:');
            projects.slice(0, 5).forEach((p, i) => {
                console.log(`- ${p.name}`);
            });
            
            console.log('\nProjects in projetos_descricao.json:');
            statusEntries.slice(0, 5).forEach(([_, p]) => {
                console.log(`- ${p.name || 'No name'}`);
            });
        }
        
    } catch (error) {
        console.error('Error during debug:', error);
    }
}

debugStageStatuses();
