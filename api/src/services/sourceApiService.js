const axios = require('axios');

class SourceApiService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.SOURCE_API_URL || 'https://app-ff23f69925b5c2.apps.sif-source.org/sites/appCatalog/IISS',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'SPHostUrl': 'https://www.sif-source.org',
        'SPLanguage': 'pt-BR',
        'X-Requested-With': 'XMLHttpRequest'
      },
      params: {
        SPClientTag: '0',
        SPProductNumber: '15.0.5023.1005'
      },
      auth: {
        username: process.env.SOURCE_API_USER || 'adminppi.source@presidencia.gov.br',
        password: process.env.SOURCE_API_PASS || 'PPI#source147'
      },
      maxRedirects: 5,
      timeout: 30000,
      withCredentials: true
    });
  }

  /**
   * Testa a conexão com a API SOURCE
   * @returns {Promise<Object>} Dados de teste de conexão
   */
  async testConnection() {
    try {
      const response = await this.client.get('/api/Test/Connection');
      return response.data;
    } catch (error) {
      this._handleError(error, 'Erro ao testar conexão com a API SOURCE');
    }
  }

  /**
   * Busca todos os projetos
   * @param {Object} filters - Filtros opcionais para a busca
   * @returns {Promise<Array>} Lista de projetos
   */
  async getProjects(filters = {}) {
    try {
      const response = await this.client.get('/api/Projects', { params: filters });
      return response.data;
    } catch (error) {
      this._handleError(error, 'Erro ao buscar projetos');
    }
  }

  /**
   * Busca um projeto específico por ID
   * @param {number} projectId - ID do projeto
   * @returns {Promise<Object>} Dados do projeto
   */
  async getProjectById(projectId) {
    try {
      const response = await this.client.get(`/api/Projects/${projectId}`);
      return response.data;
    } catch (error) {
      this._handleError(error, `Erro ao buscar projeto com ID ${projectId}`);
    }
  }

  /**
   * Cria um novo projeto
   * @param {Object} projectData - Dados do projeto a ser criado
   * @returns {Promise<Object>} Projeto criado
   */
  async createProject(projectData) {
    try {
      const response = await this.client.post('/api/Projects', projectData);
      return response.data;
    } catch (error) {
      this._handleError(error, 'Erro ao criar projeto');
    }
  }

  /**
   * Atualiza um projeto existente
   * @param {number} projectId - ID do projeto
   * @param {Object} projectData - Dados atualizados do projeto
   * @returns {Promise<Object>} Projeto atualizado
   */
  async updateProject(projectId, projectData) {
    try {
      const response = await this.client.put(`/api/Projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      this._handleError(error, `Erro ao atualizar projeto com ID ${projectId}`);
    }
  }

  /**
   * Remove um projeto
   * @param {number} projectId - ID do projeto a ser removido
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  async deleteProject(projectId) {
    try {
      await this.client.delete(`/api/Projects/${projectId}`);
      return true;
    } catch (error) {
      this._handleError(error, `Erro ao remover projeto com ID ${projectId}`);
    }
  }

  /**
   * Busca dados de referência (setores, subsectores, etc.)
   * @returns {Promise<Object>} Dados de referência
   */
  async getReferenceData() {
    try {
      const response = await this.client.get('/api/ReferenceData');
      return response.data;
    } catch (error) {
      this._handleError(error, 'Erro ao buscar dados de referência');
    }
  }

  /**
   * Sincroniza os dados do projeto com a fonte externa
   * @param {number} projectId - ID do projeto
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async syncProject(projectId) {
    try {
      const response = await this.client.post(`/api/Projects/${projectId}/sync`);
      return response.data;
    } catch (error) {
      this._handleError(error, `Erro ao sincronizar projeto com ID ${projectId}`);
    }
  }

  /**
   * Tratamento de erros personalizado
   * @private
   */
  _handleError(error, customMessage = 'Erro na requisição') {
    if (error.response) {
      // O servidor respondeu com um status de erro
      const { status, data } = error.response;
      const errorMessage = data?.message || data?.error || 'Erro desconhecido';
      throw new Error(`${customMessage}: ${status} - ${errorMessage}`);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      throw new Error(`${customMessage}: Sem resposta do servidor`);
    } else {
      // Erro ao configurar a requisição
      throw new Error(`${customMessage}: ${error.message}`);
    }
  }
}

module.exports = new SourceApiService();