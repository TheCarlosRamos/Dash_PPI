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

Acesse em: http://localhost:5500/apresentacao.html

## Estrutura do projeto
```
Proj_Apresentacao/
├─ apresentacao.html        # Página principal (HTML + CSS + JS)
└─ data/
   └─ projects.json         # Fonte de dados dos projetos
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



