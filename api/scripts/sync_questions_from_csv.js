'use strict';

const fs = require('fs');
const path = require('path');

const { Project } = require('../src/models');
const questionSyncService = require('../src/services/questionSyncService');

async function main() {
  try {
    // Caminho do CSV de GUIDs (igual ao que você usa no Postman)
    const csvPath = path.join(process.cwd(), 'projects.csv');

    if (!fs.existsSync(csvPath)) {
      console.error('[sync_questions_from_csv] Arquivo projects.csv não encontrado em', csvPath);
      process.exit(1);
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && l.toLowerCase() !== 'var'); // remove cabeçalho 'var'

    if (!lines.length) {
      console.error('[sync_questions_from_csv] Nenhum GUID encontrado em projects.csv');
      process.exit(1);
    }

    console.log(`[sync_questions_from_csv] Encontrados ${lines.length} GUIDs em projects.csv`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const guid of lines) {
      try {
        // Garante que exista um Project com esse sourceId.
        // Não tentamos sincronizar todos os detalhes da SIF aqui; apenas criamos um "slot"
        // para receber Situação Atual, Próximos Passos, Pontos de Atenção e ETAPAS.
        let project = await Project.findOne({ where: { sourceId: guid } });
        if (!project) {
          project = await Project.create({
            sourceId: guid,
            name: `Projeto ${guid}`,
            description: '',
            sector: 'Outros',
            status: 'Desconhecido',
            rawData: { Guid: guid }
          });
          console.log('[sync_questions_from_csv] Criado projeto local para GUID', guid);
        }

        const { updated: didUpdate } = await questionSyncService.syncProjectQuestions(project);
        if (didUpdate) {
          updated += 1;
          console.log('[sync_questions_from_csv] Atualizado projeto', project.id, 'GUID', guid);
        } else {
          skipped += 1;
          console.log('[sync_questions_from_csv] Nenhuma mudança para projeto', project.id, 'GUID', guid);
        }
      } catch (err) {
        errors += 1;
        console.warn('[sync_questions_from_csv] Erro ao processar GUID', guid, '-', err.message);
      }
    }

    console.log('[sync_questions_from_csv] Concluído.');
    console.log('[sync_questions_from_csv] GUIDs processados:', lines.length);
    console.log('[sync_questions_from_csv] Projetos atualizados:', updated);
    console.log('[sync_questions_from_csv] Projetos sem mudança:', skipped);
    console.log('[sync_questions_from_csv] Erros:', errors);

    process.exit(0);
  } catch (err) {
    console.error('[sync_questions_from_csv] Erro fatal:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
