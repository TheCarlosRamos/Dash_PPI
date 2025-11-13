const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const Question = require('../models/Question');
const sourceService = require('./sourceService');

class QuestionService {
  constructor() {
    // Lista de possíveis locais do arquivo CSV
    const possiblePaths = [
      '/usr/src/app/tabela_perguntas_ppi.csv',
      '/usr/src/app/api/tabela_perguntas_ppi.csv',
      '/usr/src/app/volume/tabela_perguntas_ppi.csv',
      path.join(process.cwd(), 'tabela_perguntas_ppi.csv')
    ];

    // Encontra o primeiro caminho que existe
    this.csvFilePath = possiblePaths.find(fs.existsSync);
    
    if (this.csvFilePath) {
      console.log('Arquivo CSV encontrado em:', this.csvFilePath);
    } else {
      console.error('Arquivo CSV não encontrado em nenhum dos locais:');
      possiblePaths.forEach(p => console.log('  -', p));
      console.log('Diretório atual:', process.cwd());
      console.log('Conteúdo do diretório:', fs.readdirSync('/usr/src/app'));
    }
  }

  async importQuestionsFromCSV() {
    const results = [];
    const seenCodes = new Set();
    let duplicates = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(this.csvFilePath)
        .pipe(csv({
          headers: ['cod_source', 'question_id', 'dsc_type', 'dsc_title'],
          skipLines: 1,
          trim: true,
          mapValues: ({ value }) => value ? value.trim() : ''
        }))
        .on('data', (data) => {
          if (data.cod_source && data.dsc_title) {
            const question = {
              cod_source: data.cod_source.trim(),
              dsc_title: data.dsc_title.trim(),
              dsc_type: (data.dsc_type || 'Text').trim(),
              question_id: data.question_id ? data.question_id.trim() : null
            };
            
            // Garante que question_id seja null se estiver vazio
            if (question.question_id === '') {
              question.question_id = null;
            }
            
            // Verifica por códigos duplicados
            if (seenCodes.has(question.cod_source)) {
              console.warn(`Código duplicado encontrado: ${question.cod_source} - ${question.dsc_title}`);
              duplicates.push(question.cod_source);
              return; // Pula esta entrada
            }
            
            seenCodes.add(question.cod_source);
            results.push(question);
          } else {
            console.warn('Entrada inválida ignorada:', data);
          }
        })
        .on('end', async () => {
          if (duplicates.length > 0) {
            console.warn(`Foram encontrados ${duplicates.length} códigos duplicados e foram ignorados.`);
          }
          try {
            // Limpar tabela existente
            await Question.destroy({ truncate: true });
            
            // Inserir novas perguntas
            const created = await Question.bulkCreate(results);
            resolve(created);
          } catch (error) {
            console.error('Error saving questions to database:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
  }

  async getProjectQuestionAnswers(projectId) {
    try {
      // Buscar todas as perguntas ativas
      const questions = await Question.findAll({
        where: { is_active: true },
        attributes: ['id', 'cod_source', 'question_id', 'dsc_type', 'dsc_title']
      });

      // Para cada pergunta, buscar a resposta na API
      const results = [];
      
      for (const question of questions) {
        try {
          const data = await sourceService.fetchQuestionByCode(projectId, question.cod_source);

          results.push({
            question_id: question.id,
            cod_source: question.cod_source,
            question: question.dsc_title,
            answer: data?.FieldValue ?? null,
            status: data?.Status?.Status || null,
            stage: data?.Stage?.Value || null,
            theme: data?.Theme?.Value || null,
            field_type: data?.Field?.Type || null,
            field_title: data?.Field?.Title || null,
            last_updated: new Date()
          });
        } catch (error) {
          console.error(`Error fetching answer for question ${question.id}:`, error.message);
          results.push({
            question_id: question.id,
            cod_source: question.cod_source,
            question: question.dsc_title,
            answer: null,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in getProjectQuestionAnswers:', error);
      throw error;
    }
  }

  async getAllQuestions() {
    return Question.findAll({
      where: { is_active: true },
      attributes: ['id', 'cod_source', 'question_id', 'dsc_type', 'dsc_title'],
      order: [['dsc_title', 'ASC']]
    });
  }
}

module.exports = new QuestionService();
