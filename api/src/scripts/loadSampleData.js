const { Project } = require('../models');

const sampleProjects = [
    {
        id: 'tunel-santos',
        sector: 'Portos',
        name: 'Túnel Santos-Guarujá',
        status: 'Leilão Realizado',
        description: "Parceria Público-Privada (PPP) entre o Governo Federal e o Estado de São Paulo para a construção e operação de um túnel submerso ligando as cidades de Santos e Guarujá.",
        currentSituation: "Leilão realizado em 05 de Setembro de 2025.",
        progress: 0
    },
    {
        id: 'porto-parangua',
        sector: 'Portos',
        name: 'Porto de Paranaguá',
        status: 'Aguardando Edital',
        description: "Concessão do Canal de Acesso Aquaviário por 25 anos para modernização e operação.",
        currentSituation: "Aguardando retorno do relator para publicação do edital. A Resolução CPPI já definiu as condições da desestatização.",
        progress: 0
    },
    {
        id: 'fiol-1',
        sector: 'Ferrovias',
        name: 'FIOL 1',
        status: 'Em Obras',
        description: "Construção da Ferrovia de Integração Oeste-Leste, Trecho 1, fundamental para o escoamento da produção de grãos e minérios.",
        currentSituation: "Obras em andamento com 75% de avanço total. Lotes 1F e 2F em execução, Lote 3F concluído, Lote 4F em execução. Início da operação previsto para 2027.",
        progress: 75
    }
];

async function loadSampleData() {
    try {
        // Limpar dados existentes
        await Project.destroy({ where: {} });
        
        // Inserir projetos de exemplo
        await Project.bulkCreate(sampleProjects);
        
        console.log('Dados de exemplo carregados com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao carregar dados de exemplo:', error);
        process.exit(1);
    }
}

loadSampleData();
