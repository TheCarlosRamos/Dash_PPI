const axios = require('axios');

// URL base da API - ajuste conforme necessário
// Dentro do container, use o nome do serviço (ex: 'api' ou 'backend')
// Para testar de fora do container, use 'localhost' ou o IP do host
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

// Configuração do axios para lidar com timeouts
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

async function testSync() {
  try {
    console.log('Iniciando teste de sincronização...');
    console.log(`Conectando em: ${API_BASE_URL}`);
    
    // 1. Verificar saúde da API
    console.log('\n1. Verificando saúde da API...');
    const health = await api.get('/health');
    console.log('Status da API:', health.data);

    // 2. Sincronizar todos os dados
    console.log('\n2. Sincronizando todos os dados...');
    const syncAll = await api.post('/sync/all');
    console.log('Resposta da sincronização:', syncAll.data);

    // 3. Listar projetos sincronizados
    console.log('\n3. Listando projetos sincronizados...');
    const projects = await api.get('/projects');
    console.log(`Total de projetos: ${projects.data.length}`);
    if (projects.data.length > 0) {
      console.log('Primeiro projeto:', {
        id: projects.data[0].id,
        name: projects.data[0].name,
        sector: projects.data[0].sector,
        status: projects.data[0].status
      });
    }

    // 4. Listar setores
    console.log('\n4. Listando setores...');
    const sectors = await api.get('/sectors');
    console.log(`Total de setores: ${sectors.data.length}`);
    console.log('Setores:', sectors.data);

    // 5. Listar status
    console.log('\n5. Listando status...');
    const statuses = await api.get('/statuses');
    console.log(`Total de status: ${statuses.data.length}`);
    console.log('Status:', statuses.data);

    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro no teste de sincronização:');
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status de erro
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
      console.error('Cabeçalhos:', error.response.headers);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor. Verifique se o servidor está rodando e acessível.');
      console.error('URL:', error.config?.url);
    } else {
      // Erro ao configurar a requisição
      console.error('Erro:', error.message);
    }
    console.error('Stack:', error.stack);
  }
}

testSync();