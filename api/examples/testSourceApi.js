require('dotenv').config();
const sourceApi = require('../src/services/sourceApiService');

async function testSourceApi() {
  try {
    console.log('1. Testando conexão com a API SOURCE...');
    const connectionTest = await sourceApi.testConnection();
    console.log('Conexão bem-sucedida:', connectionTest);

    console.log('\n2. Buscando dados de referência...');
    const referenceData = await sourceApi.getReferenceData();
    console.log('Dados de referência (primeiros 3 itens):', referenceData.slice(0, 3));

    console.log('\n3. Criando um novo projeto...');
    const newProject = {
      Name: 'Projeto de Exemplo API',
      Description: 'Este é um projeto de teste criado via API',
      Sector: { Id: 4, Value: 'Transport' },
      SubSector: { Id: 23, Value: 'Airport' },
      Territories: [{ Id: 36, Value: 'Brazil' }],
      ProjectTypes: [{ Id: 1, Value: 'New asset' }],
      EstimatedCapitalCost: 10000000, // 10 milhões
      IsUnsolicited: false,
      Status: 'Initiated'
    };

    const createdProject = await sourceApi.createProject(newProject);
    console.log('Projeto criado com sucesso!');
    console.log('ID do Projeto:', createdProject.Id);
    console.log('Nome do Projeto:', createdProject.Name);

    console.log('\n4. Buscando detalhes do projeto criado...');
    const projectDetails = await sourceApi.getProjectDetails(createdProject.Id);
    console.log('Detalhes do projeto:', JSON.stringify(projectDetails, null, 2));

    console.log('\n5. Listando todos os projetos...');
    const projects = await sourceApi.getProjects();
    console.log(`Total de projetos encontrados: ${projects.length}`);
    console.log('Primeiros 3 projetos:', projects.slice(0, 3).map(p => ({ id: p.Id, name: p.Name })));

  } catch (error) {
    console.error('Erro durante os testes:', error);
    if (error.response) {
      console.error('Detalhes do erro:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
  }
}

// Executar o teste
testSourceApi();
