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

## Stack
- HTML + Tailwind (CDN) para layout/estilo.
- Chart.js (CDN) para gráfico de visão geral.
- JavaScript vanilla para renderização e interações (sem build).



