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

    // Busca adicional: qualquer CSV dentro da pasta 'tabela_perguntas_ppi'
    if (!this.csvFilePath) {
      try {
        const dirCandidate = path.join(process.cwd(), 'tabela_perguntas_ppi');
        if (fs.existsSync(dirCandidate)) {
          const entries = fs.readdirSync(dirCandidate, { withFileTypes: true });
          const csvEntry = entries.find(e => e.isFile() && e.name.toLowerCase().endsWith('.csv'));
          if (csvEntry) {
            this.csvFilePath = path.join(dirCandidate, csvEntry.name);
          }
        }
      } catch (e) {
        console.warn('Falha ao varrer diretório tabela_perguntas_ppi:', e.message);
      }
    }
    
    if (this.csvFilePath) {
      console.log('Arquivo CSV encontrado em:', this.csvFilePath);
    } else {
      console.error('Arquivo CSV não encontrado em nenhum dos locais:');
      possiblePaths.forEach(p => console.log('  -', p));
      console.log('Diretório atual:', process.cwd());
      try {
        if (fs.existsSync('/usr/src/app')) {
          console.log('Conteúdo do diretório /usr/src/app:', fs.readdirSync('/usr/src/app'));
        }
      } catch {}
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
      // Lista enxuta de códigos relevantes para cards e linha do tempo
      const codes = [
        // Situação, pontos, próximos passos, benefícios
        '2000726', // Project current status
        '2000727', // Project key issues
        '2000728', // Project next steps
        '2000688', // Expected monetary benefits and beneficiaries

        // Estudos
        '2001216', // Start date - Studies
        '2001217', // End date - Studies
        '2001218', // Status of Studies

        // Consulta pública
        '2001219', // Start date - Public Consultation
        '2001220', // End date - Public Consultation
        '2001221', // Status of Public Consultation

        // Controle externo / TCU
        '2001222', // Start date - External Control
        '2001223', // End date - External Control
        '2001224', // Status of External Control

        // Edital / Tender
        '2001225', // Date of publication - Tender Notice
        '2001227', // Start date - Tender
        '2001228', // End date - Tender
        '2001229'  // Status of phase 'Tender'
      ];

      const results = [];

      for (const cod of codes) {
        try {
          const data = await sourceService.fetchQuestionByCode(projectId, cod);

          results.push({
            question_id: null,
            cod_source: cod,
            question: data?.Field?.Title || null,
            answer: data?.FieldValue ?? null,
            status: data?.Status?.Status || null,
            stage: data?.Stage?.Value || null,
            theme: data?.Theme?.Value || null,
            field_type: data?.Field?.Type || null,
            field_title: data?.Field?.Title || null,
            last_updated: new Date()
          });
        } catch (error) {
          console.error(`Error fetching answer for question code ${cod}:`, error.message);
          results.push({
            question_id: null,
            cod_source: cod,
            question: null,
            answer: null,
            status: null,
            stage: null,
            theme: null,
            field_type: null,
            field_title: null,
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

  // Utilitário: obtém valor pelo código (aceita campos 'value' ou 'answer')
  getValueByCode(answers, code) {
    const item = answers.find(a => String(a.cod_source) === String(code));
    if (!item) return null;

    // Primeiro tenta usar o valor principal (FieldValue mapeado em 'answer' ou 'value')
    const primary = item.value ?? item.answer ?? null;
    let text = this.extractText(primary);

    // Se não houver texto, usa o Status.Status da SIF (Pending, Approved, etc.)
    if (!text && item.status) {
      text = this.extractText(item.status);
    }

    return text;
  }

  // Utilitário: extrai texto de estruturas da SIF-Source (Value aninhado, arrays, objetos)
  extractText(input) {
    if (input === null || input === undefined) return null;
    // Se for array, junta textos individuais
    if (Array.isArray(input)) {
      const parts = input.map(v => this.extractText(v)).filter(Boolean);
      return parts.length ? parts.join('; ') : null;
    }
    // Se for objeto com 'Value', desce recursivamente
    if (typeof input === 'object') {
      if ('Value' in input) {
        return this.extractText(input.Value);
      }
      if ('Title' in input && typeof input.Title === 'string') {
        return input.Title;
      }
      if ('Type' in input && 'Value' in input) {
        return this.extractText(input.Value);
      }
      // Tenta pegar propriedades comuns como string
      const maybe = ['text', 'label', 'name'].map(k => input[k]).find(v => typeof v === 'string' && v.trim());
      if (maybe) return maybe;
      return null;
    }
    // Primtivo: string/number/boolean
    if (typeof input === 'string') return input.trim();
    if (typeof input === 'number' || typeof input === 'boolean') return String(input);
    return null;
  }

  // Utilitário: normaliza datas para DD/MM/YYYY quando possível
  normalizeDate(value) {
    if (value === null || value === undefined) return 'Não informado';
    const str = String(value).trim();
    if (!str) return 'Não informado';

    // Já está no formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

    // ISO 8601 ou YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }

    // Tenta parsear com Date
    const dt = new Date(str);
    if (!isNaN(dt.getTime())) {
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    return 'Não informado';
  }

  // Utilitário: normaliza percentual para "N%" quando numérico simples
  normalizePercentOrText(value) {
    if (value === null || value === undefined) return 'Não informado';
    const str = String(value).trim();
    if (!str) return 'Não informado';
    if (/^\d+%$/.test(str)) return str; // já com %
    if (/^\d+(\.\d+)?$/.test(str)) {
      // número simples
      const n = Number(str);
      if (!isNaN(n)) return `${n}%`;
    }
    return str; // texto livre
  }

  // Heurística simples: identifica se uma string parece data
  isLikelyDate(value) {
    if (value === null || value === undefined) return false;
    const str = String(value).trim();
    if (!str) return false;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return true;
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return true;
    return false;
  }

  // Formata a lista de respostas no JSON de cards e linha do tempo
  formatAnswersForCards(answers) {
    const get = (code) => this.getValueByCode(answers, code);

    const situacaoRaw = get(2000726);
    const pontosRaw = get(2000727);
    const proximosRaw = get(2000728);

    // Campos adicionais específicos
    const dataInicioGeralRaw = get(2001216); // Start date - Studies (visão geral)
    const questionsBeneficiosRaw = get(2000688); // Expected monetary benefits and beneficiaries

    const result = {
      // Situação geral do projeto (2000726), permitindo também usar Status.Pending/Approved etc.
      situacao_atual: this.isLikelyDate(situacaoRaw) ? this.normalizeDate(situacaoRaw) : this.normalizePercentOrText(situacaoRaw),
      // Pontos de atenção (2000727) – usa FieldValue ou, se nulo, Status (ex.: Pending)
      pontos_atencao: (pontosRaw === null || String(pontosRaw).trim() === '') ? 'Não informado' : String(pontosRaw),
      // Próximos passos (2000728)
      proximos_passos: (proximosRaw === null || String(proximosRaw).trim() === '') ? 'Não informado' : String(proximosRaw),
      // Data de início geral dos estudos (2001216)
      data_inicio_geral: this.normalizeDate(dataInicioGeralRaw),
      // Questões / benefícios (2000688)
      questions_beneficios: (questionsBeneficiosRaw === null || String(questionsBeneficiosRaw).trim() === '') ? 'Não informado' : String(questionsBeneficiosRaw),
      // Linha do tempo / etapas, seguindo exatamente a convenção de códigos da SIF
      etapas: {
        // Estudos: 2001216 (Start date - Studies), 2001217 (End date - Studies), 2001218 (Status of Studies)
        estudos: {
          inicio: this.normalizeDate(get(2001216)),
          fim: this.normalizeDate(get(2001217)),
          status: (get(2001218) && String(get(2001218)).trim()) || 'Não informado'
        },
        // Consulta pública: 2001219 (Start date - Public Consultation), 2001220 (End date - Public Consultation), 2001221 (Status of Public Consultation)
        consulta_publica: {
          inicio: this.normalizeDate(get(2001219)),
          fim: this.normalizeDate(get(2001220)),
          status: (get(2001221) && String(get(2001221)).trim()) || 'Não informado'
        },
        // Controle externo: 2001222 (Start date - External Control), 2001223 (End date - External Control), 2001224 (Status of External Control)
        tcu: {
          inicio: this.normalizeDate(get(2001222)),
          fim: this.normalizeDate(get(2001223)),
          status: (get(2001224) && String(get(2001224)).trim()) || 'Não informado'
        },
        // Edital / Tender: 2001225 (Date of publication - Tender Notice),
        // 2001229 (Status of phase 'Tender'), 2001227 (Start date - Tender), 2001228 (End date - Tender)
        edital: {
          publicacao: this.normalizeDate(get(2001225)),
          status: (get(2001229) && String(get(2001229)).trim()) || 'Não informado',
          inicio: this.normalizeDate(get(2001227)),
          fim: this.normalizeDate(get(2001228))
        }
      }
    };

    return result;
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
