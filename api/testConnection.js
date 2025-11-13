require('dotenv').config();
const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testando conexão com a API SOURCE...');
    console.log('URL:', process.env.SOURCE_API_URL);
    console.log('Usuário:', process.env.SOURCE_API_USER);
    
    const response = await axios({
      method: 'get',
      url: `${process.env.SOURCE_API_URL}/projects/test`,
      auth: {
        username: process.env.SOURCE_API_USER,
        password: process.env.SOURCE_API_PASS
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'SPHostUrl': 'https://www.sif-source.org',
        'SPLanguage': 'pt-BR'
      },
      params: {
        SPClientTag: '0',
        SPProductNumber: '15.0.5023.1005'
      }
    });
    
    console.log('Conexão bem-sucedida!');
    console.log('Resposta:', response.data);
  } catch (error) {
    console.error('Erro ao conectar à API:');
    
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status de erro
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
      console.error('Cabeçalhos:', error.response.headers);
      
      // Verificar se o problema é de autenticação
      if (error.response.status === 401) {
        console.error('\nERRO DE AUTENTICAÇÃO:');
        console.error('- Verifique se o nome de usuário e senha estão corretos');
        console.error('- Verifique se a conta está ativa e tem permissão para acessar a API');
        console.error('- Verifique se o domínio está correto (presidencia.gov.br)');
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Não foi possível conectar ao servidor');
      console.error('URL:', error.config.url);
    } else {
      // Ocorreu um erro ao montar a requisição
      console.error('Erro:', error.message);
    }
  }
}

testConnection();
