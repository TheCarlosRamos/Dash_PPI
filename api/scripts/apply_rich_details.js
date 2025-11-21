const fs = require('fs');
const path = require('path');

const { Project, sequelize } = require('../src/models');

/**
 * Lê projetos_detalhes.json (gerado a partir de Descrição.txt) e aplica
 * alguns campos úteis na tabela Projects, SEM sobrescrever o que já está bom.
 *
 * - Se progress estiver nulo/0 e houver completion -> define progress
 * - Se estimatedCost estiver nulo/0 e houver estimatedCapitalCost -> define estimatedCost
 * - Se status estiver vazio/genérico, pode usar currentProjectStatus como fallback (opcional)
 * - Enriquecer rawData.ManualDetails com localização, órgão, etc. para uso futuro no frontend
 */

async function main() {
  try {
    const rootPath = path.join(__dirname, '..', '..');
    const richPath = path.join(rootPath, 'projetos_detalhes.json');

    if (!fs.existsSync(richPath)) {
      console.error('[apply_rich_details] Arquivo projetos_detalhes.json não encontrado em', richPath);
      process.exit(1);
    }

    const raw = fs.readFileSync(richPath, 'utf8');
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || !arr.length) {
      console.error('[apply_rich_details] JSON rico vazio ou inválido');
      process.exit(1);
    }

    const manualByGuid = new Map();
    for (const item of arr) {
      if (item && item.guid) {
        manualByGuid.set(String(item.guid), item);
      }
    }

    console.log('[apply_rich_details] Registros ricos carregados:', manualByGuid.size);

    const projects = await Project.findAll();
    console.log('[apply_rich_details] Projetos encontrados no banco:', projects.length);

    let touched = 0;

    for (const project of projects) {
      const rawData = project.rawData || {};
      let guid = rawData.Guid || rawData.guid || null;

      if (!guid && typeof project.sourceId === 'string') {
        guid = project.sourceId.startsWith('source-')
          ? project.sourceId.replace('source-', '')
          : project.sourceId;
      }

      if (!guid) continue;

      const rich = manualByGuid.get(String(guid));
      if (!rich) continue;

      let changed = false;

      // 1) progress a partir de completion, se ainda não definido
      if ((project.progress === null || project.progress === undefined || project.progress === 0) &&
          typeof rich.completion === 'number') {
        const pct = Math.max(0, Math.min(100, Math.round(rich.completion * 100)));
        if (!Number.isNaN(pct)) {
          project.progress = pct;
          changed = true;
        }
      }

      // 2) estimatedCost a partir de estimatedCapitalCost
      if ((project.estimatedCost === null || project.estimatedCost === undefined || project.estimatedCost === 0) &&
          typeof rich.estimatedCapitalCost === 'number') {
        project.estimatedCost = rich.estimatedCapitalCost;
        changed = true;
      }

      // 3) status de fallback a partir de currentProjectStatus, se status vazio/nulo
      if ((!project.status || String(project.status).trim() === '') && rich.currentProjectStatus) {
        project.status = String(rich.currentProjectStatus);
        changed = true;
      }

      // 4) setor/subsetor de fallback, se ainda não definidos
      if ((!project.sector || String(project.sector).trim() === '') && rich.sector) {
        project.sector = String(rich.sector);
        changed = true;
      }
      if ((!project.subSector || String(project.subSector).trim() === '') && rich.subSector) {
        project.subSector = String(rich.subSector);
        changed = true;
      }

      // 5) Enriquecer rawData.ManualDetails com informações úteis para o frontend
      const manualDetails = {
        locations: rich.locations || [],
        territories: rich.territories || [],
        ownerOrganisation: rich.ownerOrganisation || null,
        typeOfProject: rich.typeOfProject || [],
        otherSubsector: rich.otherSubsector || null,
        completion: rich.completion,
        currentProjectStatus: rich.currentProjectStatus || null,
        currentProjectStatusCustom: rich.currentProjectStatusCustom || null,
        estimatedCapitalCost: rich.estimatedCapitalCost,
        originalCurrency: rich.originalCurrency || null,
        originalCurrencyEstimatedCapitalCost: rich.originalCurrencyEstimatedCapitalCost,
        projectEstimatedDueDate: rich.projectEstimatedDueDate || null,
        created: rich.created || null,
        modified: rich.modified || null,
        gpsCoordinates: rich.gpsCoordinates || []
      };

      rawData.ManualDetails = manualDetails;
      project.rawData = rawData;
      changed = true;

      if (changed) {
        await project.save();
        touched++;
      }
    }

    console.log('[apply_rich_details] Projetos atualizados:', touched);
  } catch (err) {
    console.error('[apply_rich_details] Erro ao aplicar detalhes ricos:', err);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch {}
  }
}

main();
