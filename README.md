# Dashboard de Acompanhamento de Projetos – PPI

Aplicação estática para acompanhamento de projetos do PPI com cards por setor, modal de detalhes, linha do tempo horizontal fixa por fases e espaço para mapa do projeto.

## Principais recursos
- **Cards por projeto** com setor, nome e status.
- **Modal de detalhes** com layout padronizado (posições fixas):
  - Descrição do Projeto, Situação Atual, Próximos Passos, Deliberação, Pontos de Atenção, Avanço Físico, Mapa do Projeto (direita).
- **Linha do tempo horizontal** fixa com 6 fases, círculos igualmente espaçados:
  - Estudos, Consulta Pública, TCU, Edital, Leilão, Assinatura do Contrato.
  - Pendente: preto e branco; Concluída: verde.
- **Grade responsiva** de projetos: até 6 colunas em telas muito largas.

## Como executar localmente
Requer apenas Python (para servir arquivos estáticos).

```bash
python -m http.server 5500 --directory "c:\\Users\\carlos.ramos\\OneDrive - Presidência da República\\Área de Trabalho\\Proj_Apresentacao"
```

Acesse em: http://localhost:5500/apresentacao.html

## Estrutura do projeto
```
Proj_Apresentacao/
├─ apresentacao.html        # Página principal (HTML + CSS + JS)
└─ data/
   └─ projects.json         # Fonte de dados dos projetos
```

## Editando os dados (`data/projects.json`)
Cada item representa um projeto. Campos principais:

```json
{
  "id": "br-381-mg",
  "sector": "Rodovias",
  "name": "BR-381/MG",
  "status": "Contrato Assinado",
  "statusColor": "bg-green-500",
  "details": {
    "description": "...",
    "currentSituation": "...",
    "nextSteps": "...",
    "deliberation": "CPPI nº ...",
    "risks": ["Risco 1", "Risco 2"],
    "progress": 62,
    "timeline": [
      { "milestone": "Estudos", "date": "01/2025", "status": "completed" },
      { "milestone": "Consulta Pública", "status": "pending" },
      { "milestone": "TCU", "status": "pending" },
      { "milestone": "Edital", "status": "pending" },
      { "milestone": "Leilão", "status": "completed" },
      { "milestone": "Assinatura do Contrato", "status": "completed" }
    ],
    "timelineNote": "Observações do cronograma (opcional)",
    "mapEmbed": "<iframe src='https://...' width='100%' height='100%' style='border:0' loading='lazy'></iframe>",
    "mapImageUrl": "https://.../mini-mapa.jpg"
  }
}
```

Observações sobre a timeline:
- Fases reconhecidas: `Estudos`, `Consulta Pública`, `TCU`, `Edital`, `Leilão`, `Assinatura do Contrato` (com aliases comuns mapeados automaticamente, ex.: "Análise TCU" → "TCU", "Contrato/Assinatura" → "Assinatura do Contrato", "EVTEA" → "Estudos").
- A cor verde aparece quando `status` da fase é `completed` (ou `concluded`).

Mapa do projeto (opcional):
- Use `mapEmbed` para HTML/iframe (preferível). Caso não exista, `mapImageUrl` exibe uma miniatura. Se nenhum presente, aparece um placeholder.

## Stack
- HTML + Tailwind (CDN) para layout/estilo.
- Chart.js (CDN) para gráfico de visão geral.
- JavaScript vanilla para renderização e interações (sem build).

## Publicação
Por ser estático, pode ser hospedado em GitHub Pages, Netlify, Vercel, etc.

### GitHub Pages (opcional)
1. Commit/push do conteúdo para a branch `main`.
2. Em Settings → Pages, selecione `Deploy from a branch`, `main` e pasta `/root`.
3. Aguarde o deploy e acesse a URL fornecida.

## Contribuindo
- Ajustes de dados: editar `data/projects.json`.
- Estilos e comportamento: editar `apresentacao.html` (contém CSS e JS inline).

## Licença
Definir conforme necessidade do projeto.