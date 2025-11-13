# Exemplos de Uso da API SOURCE

Este diretório contém exemplos de como usar o `sourceApiService` para interagir com a API SOURCE.

## Pré-requisitos

1. Node.js instalado (versão 14.x ou superior)
2. npm ou yarn
3. Arquivo `.env` configurado com as credenciais da API

## Configuração

1. Copie o arquivo `.env.example` para `.env` na raiz do projeto:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e adicione suas credenciais da API SOURCE:
   ```
   SOURCE_API_URL=https://api.sif-source.org
   SOURCE_API_USER=seu_usuario@exemplo.com
   SOURCE_API_PASS=sua_senha_segura
   ```

## Executando o Exemplo

1. Instale as dependências (caso ainda não tenha feito):
   ```bash
   npm install
   ```

2. Execute o script de exemplo:
   ```bash
   node examples/testSourceApi.js
   ```

## O que o Exemplo Faz?

O script `testSourceApi.js` demonstra como:

1. Testar a conexão com a API SOURCE
2. Buscar dados de referência (territórios)
3. Criar um novo projeto
4. Buscar detalhes do projeto criado
5. Listar todos os projetos disponíveis

## Saída Esperada

Você verá uma saída semelhante a esta:

```
1. Testando conexão com a API SOURCE...
Conexão bem-sucedida: { status: 'ok', message: 'API is running' }

2. Buscando dados de referência...
Dados de referência (primeiros 3 itens): [
  { Id: 1, Value: 'Afghanistan' },
  { Id: 2, Value: 'Albania' },
  { Id: 3, Value: 'Algeria' }
]

3. Criando um novo projeto...
Projeto criado com sucesso!
ID do Projeto: 12345
Nome do Projeto: Projeto de Exemplo API

4. Buscando detalhes do projeto criado...
Detalhes do projeto: {
  "Id": 12345,
  "Name": "Projeto de Exemplo API",
  "Status": "Initiated",
  ...
}

5. Listando todos os projetos...
Total de projetos encontrados: 15
Primeiros 3 projetos: [
  { id: 12345, name: 'Projeto de Exemplo API' },
  { id: 12344, name: 'Outro Projeto' },
  { id: 12343, name: 'Projeto de Infraestrutura' }
]
```

## Solução de Problemas

- **Erro de autenticação**: Verifique se as credenciais no arquivo `.env` estão corretas.
- **Erro de conexão**: Verifique se a URL da API está correta e se você tem acesso à internet.
- **Erro 405 (Method Not Allowed)**: Alguns métodos podem não estar habilitados na API. Verifique a documentação da API SOURCE.
