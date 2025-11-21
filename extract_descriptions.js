const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'Descrição.txt');
const csvPath = path.join(__dirname, 'projetos_descricao.csv');
const jsonPath = path.join(__dirname, 'projetos_descricao.json');

console.log('Lendo arquivo grande:', inputPath);

// Lê o arquivo inteiro como texto (pode demorar alguns segundos, é normal)
const raw = fs.readFileSync(inputPath, 'utf8');

console.log('Arquivo carregado, tamanho em caracteres:', raw.length);

// Cabeçalho do CSV
let csvOut = 'Guid;Name;Description\n';
const jsonOut = [];

// Regex global para capturar Guid, Name e Description dentro do JSON escapado
// Usa [\s\S]*? (não guloso) para atravessar qualquer coisa entre os campos
const re = /"Guid":"(.*?)"[\s\S]*?"Name":"(.*?)"[\s\S]*?"Description":"(.*?)"/g;

let match;
let count = 0;

while ((match = re.exec(raw)) !== null) {
  const guid = match[1];
  const name = match[2];
  const desc = match[3];

  // Escapa aspas duplas para CSV
  const guidCsv = guid.replace(/"/g, '""');
  const nameCsv = name.replace(/"/g, '""');
  const descCsv = desc.replace(/"/g, '""');

  csvOut += `"${guidCsv}";"${nameCsv}";"${descCsv}"\n`;
  jsonOut.push({ guid, name, description: desc });
  count++;
}

fs.writeFileSync(csvPath, csvOut, 'utf8');
fs.writeFileSync(jsonPath, JSON.stringify(jsonOut, null, 2), 'utf8');

console.log(`Extração concluída. Projetos encontrados: ${count}`);
console.log('CSV gerado em:', csvPath);
console.log('JSON gerado em:', jsonPath);
