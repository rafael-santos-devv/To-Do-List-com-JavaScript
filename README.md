# Lembretes RF

O Lembretes RF é um sistema de lembretes com cadastro e login. Cada usuário tem sua própria lista de tarefas.

## Funcionalidades

- Criar uma conta e entrar com e-mail e senha.
- Criar, listar, editar, concluir e excluir lembretes.
- Manter os lembretes separados por usuário.
- Alternar entre os temas claro e escuro.

## Tecnologias

- **HTML** define as páginas e os formulários.
- **CSS** controla a aparência do site e os temas.
- **JavaScript** conecta a interface às rotas do servidor.
- **Node.js e Express** fornecem a API e controlam o cadastro, o login e as tarefas.
- **MySQL** armazena usuários e lembretes.
- **bcryptjs** protege as senhas usando hash.
- **express-session** mantém a sessão do usuário conectado.

## Organização dos arquivos

- `index.html`: página principal da lista de lembretes.
- `cadastro.html`: formulário para criar uma conta.
- `login.html`: formulário para entrar em uma conta.
- `css/styles.css`: estilos das páginas, dos formulários e dos lembretes.
- `js/scripts.js`: carregamento e operações dos lembretes na página principal.
- `js/auth.js`: envio dos formulários de cadastro e login.
- `server.js`: servidor Express, rotas da API, autenticação e acesso ao banco.
- `database/schema.sql`: estrutura das tabelas MySQL e relação entre usuários e lembretes.
- `package.json`: dependências usadas pelo projeto.
- `.env`: configurações locais e credenciais; esse arquivo não é publicado no GitHub.
