const fs = require('fs');
const path = require('path');

function checkStructure() {
    try {
        const statusesPath = path.join(__dirname, 'apresentacao', 'projetos_descricao.json');
        console.log(`Checking structure of: ${statusesPath}`);
        
        // Read the first 5 entries
        const statusesData = JSON.parse(fs.readFileSync(statusesPath, 'utf8'));
        const firstFiveEntries = Object.entries(statusesData).slice(0, 5);
        
        console.log('First 5 entries in projetos_descricao.json:');
        firstFiveEntries.forEach(([guid, project], index) => {
            console.log(`\nEntry ${index + 1}:`);
            console.log(`GUID: ${guid}`);
            console.log('Project keys:', Object.keys(project));
            if (project.details) {
                console.log('Details keys:', Object.keys(project.details));
                if (project.details.etapa2) {
                    console.log('etapa2 exists:', project.details.etapa2);
                }
            }
            if (project.nome) {
                console.log('Project name:', project.nome);
            }
        });
        
    } catch (error) {
        console.error('Error checking structure:', error);
    }
}

checkStructure();
