# Lembretes RF

Aplicação de lista de tarefas com cadastro, login e lembretes privados por usuário. Projeto de estudo feito com HTML, CSS, JavaScript, Node.js, Express e MySQL.

## Funcionalidades

- Criar conta e entrar com e-mail e senha.
- Armazenar senhas usando hash.
- Criar, listar, editar, concluir e excluir lembretes.
- Manter os lembretes separados por usuário.

## Requisitos

- Node.js e npm.
- MySQL Server e MySQL Workbench.

## Configuração

1. No MySQL Workbench, abra e execute [`database/schema.sql`](database/schema.sql).
2. Na pasta do projeto, instale as dependências:

   ```powershell
   npm install
   ```

3. Crie um arquivo chamado `.env` na raiz do projeto com estas variáveis e preencha os valores da sua máquina. Não envie `.env` ao GitHub.

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha_local_do_mysql
   DB_NAME=tarefas_db
   SESSION_SECRET=cole_a_chave_aleatoria_aqui
   ```
4. Gere uma chave de sessão local com:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Coloque o resultado em `SESSION_SECRET` no `.env`. Não compartilhe nem publique essa chave.
5. Inicie o servidor:

   ```powershell
   npm start
   ```

6. Abra `http://localhost:3000/cadastro.html` para criar a primeira conta.

## Variáveis locais

O arquivo `.env` contém `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `SESSION_SECRET`. Ele está ignorado pelo Git e não deve ser publicado.

## Observação

O armazenamento de sessão padrão do Express serve para desenvolvimento local. Para publicar a aplicação em produção, configure um armazenamento de sessões apropriado e credenciais próprias para o servidor.
