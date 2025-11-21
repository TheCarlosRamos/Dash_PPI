const fs = require('fs');
const path = require('path');

const { Project, sequelize } = require('../src/models');

async function main() {
  try {
    const manualPath = path.join(__dirname, '..', 'projetos_descricao.json');
    if (!fs.existsSync(manualPath)) {
      console.error('[apply_manual_descriptions] Arquivo projetos_descricao.json não encontrado em', manualPath);
      process.exit(1);
    }

    const raw = fs.readFileSync(manualPath, 'utf8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) {
      console.error('[apply_manual_descriptions] JSON manual vazio ou inválido');
      process.exit(1);
    }

    const manualByGuid = {};
    for (const item of arr) {
      if (item && item.guid) {
        manualByGuid[String(item.guid)] = item;
      }
    }

    console.log('[apply_manual_descriptions] Registros manuais carregados:', Object.keys(manualByGuid).length);

    const projects = await Project.findAll();
    console.log('[apply_manual_descriptions] Projetos encontrados no banco:', projects.length);

    let updated = 0;
    let matched = 0;

    for (const project of projects) {
      const rawData = project.rawData || {};
      let guid = rawData.Guid || rawData.guid || null;

      if (!guid && typeof project.sourceId === 'string') {
        guid = project.sourceId.startsWith('source-')
          ? project.sourceId.replace('source-', '')
          : project.sourceId;
      }

      if (!guid) continue;

      const manual = manualByGuid[String(guid)];
      if (!manual) continue;

      matched++;
      const manualDescription = manual.description != null ? String(manual.description) : '';
      if (!manualDescription) continue;

      if (project.description !== manualDescription) {
        project.description = manualDescription;
        await project.save();
        updated++;
        console.log(`[apply_manual_descriptions] Atualizado projeto ${project.id} (GUID ${guid})`);
      }
    }

    console.log('[apply_manual_descriptions] Total com GUID encontrado no JSON manual:', matched);
    console.log('[apply_manual_descriptions] Projetos atualizados:', updated);
  } catch (err) {
    console.error('[apply_manual_descriptions] Erro ao aplicar descrições manuais:', err);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch {}
  }
}

main();
