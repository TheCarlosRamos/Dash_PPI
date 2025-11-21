const fs = require('fs');
const path = require('path');

/**
 * Lê o arquivo "Descrição.txt" (log do Postman com Response Body em JSON escapado)
 * e gera um JSON rico por GUID com campos úteis para os cards.
 *
 * Saída: projetos_detalhes.json na raiz do projeto, no formato:
 * [
 *   {
 *     guid,
 *     name,
 *     description,
 *     sector,
 *     subSector,
 *     otherSubsector,
 *     locations,
 *     territories,
 *     isPPP,
 *     isUnsolicited,
 *     typeOfProject,
 *     ownerOrganisation,
 *     currentProjectStatus,
 *     currentProjectStatusCustom,
 *     completion,
 *     estimatedCapitalCost,
 *     originalCurrency,
 *     originalCurrencyEstimatedCapitalCost,
 *     projectEstimatedDueDate,
 *     created,
 *     modified,
 *     gpsCoordinates
 *   }, ...
 * ]
 */

function extractProjectsFromDescricao() {
  const rootPath = path.join(__dirname, '..');
  const descricaoPath = path.join(rootPath, 'Descrição.txt');

  if (!fs.existsSync(descricaoPath)) {
    console.error('[extract_rich_from_descricao] Arquivo Descrição.txt não encontrado em', descricaoPath);
    process.exit(1);
  }

  console.log('[extract_rich_from_descricao] Lendo arquivo:', descricaoPath);
  const content = fs.readFileSync(descricaoPath, 'utf8');

  // Captura o valor da chave "Response Body": "..." (JSON escapado)
  const regex = /"Response Body":\s*"([\s\S]*?)"\s*}/g;

  const byGuid = new Map();
  let match;
  let totalBodies = 0;
  let parsed = 0;
  let errors = 0;

  while ((match = regex.exec(content)) !== null) {
    totalBodies++;
    const escaped = match[1];
    try {
      // Desescapa a string JSON (que veio com \" etc.)
      let jsonText = escaped
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');

      // Garante que começa com { e termina com }
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('Trecho sem chaves JSON aparentes');
      }
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);

      const obj = JSON.parse(jsonText);
      parsed++;

      const guid = obj.Guid || obj.guid;
      if (!guid) continue;

      const locations = Array.isArray(obj.Locations) ? obj.Locations.slice() : [];
      const territories = Array.isArray(obj.Territories) ? obj.Territories.map(t => t.Value || t.value || t) : [];
      const sector = obj.Sector && (obj.Sector.Value || obj.Sector.value || obj.Sector.Name || obj.Sector.name) || null;
      const subSector = obj.SubSector && (obj.SubSector.Value || obj.SubSector.value || obj.SubSector.Name || obj.SubSector.name) || null;
      const otherSubsector = obj.OtherSubsector && (obj.OtherSubsector.Value || obj.OtherSubsector.value || null);
      const typeOfProject = Array.isArray(obj.TypeOfProject) ? obj.TypeOfProject.slice() : [];
      const ownerOrganisation = obj.OwnerOrganisation && (obj.OwnerOrganisation.Value || obj.OwnerOrganisation.value || null);
      const currentProjectStatus = obj.CurrentProjectStatus && (obj.CurrentProjectStatus.Value || obj.CurrentProjectStatus.value || null);
      const currentProjectStatusCustom = obj.CurrentProjectStatusCustom && (obj.CurrentProjectStatusCustom.Value || obj.CurrentProjectStatusCustom.value || null);
      const completion = typeof obj.Completion === 'number' ? obj.Completion : null;
      const estimatedCapitalCost = typeof obj.EstimatedCapitalCost === 'number' ? obj.EstimatedCapitalCost : null;
      const originalCurrency = obj.OriginalCurrency && (obj.OriginalCurrency.Value || obj.OriginalCurrency.value || null);
      const originalCurrencyEstimatedCapitalCost = typeof obj.OriginalCurrencyEstimatedCapitalCost === 'number' ? obj.OriginalCurrencyEstimatedCapitalCost : null;
      const projectEstimatedDueDate = obj.ProjectEstimatedDueDate || null;
      const created = obj.Created || null;
      const modified = obj.Modified || null;
      const gpsCoordinates = Array.isArray(obj.GPSCoordinates) ? obj.GPSCoordinates.slice() : [];

      const entry = {
        guid: String(guid),
        name: obj.Name || obj.name || null,
        description: obj.Description || obj.description || null,
        sector,
        subSector,
        otherSubsector,
        locations,
        territories,
        isPPP: Boolean(obj.IsPPP),
        isUnsolicited: Boolean(obj.IsUnsolicited),
        typeOfProject,
        ownerOrganisation,
        currentProjectStatus,
        currentProjectStatusCustom,
        completion,
        estimatedCapitalCost,
        originalCurrency,
        originalCurrencyEstimatedCapitalCost,
        projectEstimatedDueDate,
        created,
        modified,
        gpsCoordinates
      };

      // Se houver múltiplas respostas para o mesmo GUID, mantém a última
      byGuid.set(String(guid), entry);
    } catch (e) {
      errors++;
      if (errors <= 10) {
        console.warn('[extract_rich_from_descricao] Erro ao parsear Response Body:', e.message);
      }
    }
  }

  const richArray = Array.from(byGuid.values());
  const outPath = path.join(rootPath, 'projetos_detalhes.json');
  fs.writeFileSync(outPath, JSON.stringify(richArray, null, 2), 'utf8');

  console.log('[extract_rich_from_descricao] Response Bodies encontrados:', totalBodies);
  console.log('[extract_rich_from_descricao] JSONs parseados com sucesso:', parsed);
  console.log('[extract_rich_from_descricao] GUIDs únicos extraídos:', richArray.length);
  console.log('[extract_rich_from_descricao] Arquivo gerado em:', outPath);
}

extractProjectsFromDescricao();
