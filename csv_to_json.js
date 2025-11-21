const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'projetos_descricao.csv');
const jsonPath = path.join(__dirname, 'projetos_descricao.json');

console.log('Lendo CSV:', csvPath);

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);

// primeira linha é o cabeçalho
const data = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/^"(.*)";"(.*)";"(.*)"$/);
  if (!match) continue;
  const guid = match[1];
  const name = match[2];
  const description = match[3];
  data.push({ guid, name, description });
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Convertido ${data.length} registros para`, jsonPath);
