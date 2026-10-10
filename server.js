require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/cadastro.html', (req, res) => res.sendFile(path.join(__dirname, 'cadastro.html')));

app.use(session({
  name: 'lembretes.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 60 * 60 * 1000
  }
}));

const conexao = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

function exigirLogin(req, res, next) {
  if (!req.session.usuarioId) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }

  next();
}

function iniciarSessao(req, usuarioId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((erro) => {
      if (erro) return reject(erro);

      req.session.usuarioId = usuarioId;
      req.session.save((erroAoSalvar) => {
        if (erroAoSalvar) return reject(erroAoSalvar);
        resolve();
      });
    });
  });
}

app.post('/api/auth/cadastro', async (req, res) => {
  try {
    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const senha = req.body.senha;

    if (!nome || !email || typeof senha !== 'string' || senha.length < 8) {
      return res.status(400).json({
        erro: 'Informe nome, e-mail e uma senha com pelo menos 8 caracteres.'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const [resultado] = await conexao.execute(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );

    const usuarioId = resultado.insertId;
    const [usuarios] = await conexao.query('SELECT COUNT(*) AS total FROM usuarios');
    if (Number(usuarios[0].total) === 1) {
      await conexao.execute(
        'UPDATE tarefas SET usuario_id = ? WHERE usuario_id IS NULL',
        [usuarioId]
      );
    }

    await iniciarSessao(req, usuarioId);
    res.status(201).json({ mensagem: 'Conta criada.' });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Esse e-mail já tem uma conta.' });
    }

    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível criar a conta.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const senha = req.body.senha;

    if (!email || typeof senha !== 'string') {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const [usuarios] = await conexao.execute(
      'SELECT id, senha_hash FROM usuarios WHERE email = ?',
      [email]
    );

    if (usuarios.length === 0 || !(await bcrypt.compare(senha, usuarios[0].senha_hash))) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    await iniciarSessao(req, usuarios[0].id);
    res.json({ mensagem: 'Login realizado.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível entrar.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((erro) => {
    if (erro) {
      return res.status(500).json({ erro: 'Não foi possível sair.' });
    }

    res.clearCookie('lembretes.sid');
    res.json({ mensagem: 'Você saiu da conta.' });
  });
});

app.get('/api/auth/me', exigirLogin, async (req, res) => {
  try {
    const [usuarios] = await conexao.execute(
      'SELECT id, nome, email FROM usuarios WHERE id = ?',
      [req.session.usuarioId]
    );

    if (usuarios.length === 0) {
      req.session.destroy(() => {});
      return res.status(401).json({ erro: 'Faça login para continuar.' });
    }

    res.json(usuarios[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível verificar a sessão.' });
  }
});

app.get('/api/tarefas', exigirLogin, async (req, res) => {
  try {
    const [tarefas] = await conexao.execute(
      'SELECT id, texto, concluida FROM tarefas WHERE usuario_id = ? ORDER BY id DESC',
      [req.session.usuarioId]
    );

    res.json(tarefas);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível buscar as tarefas.' });
  }
});

app.post('/api/tarefas', exigirLogin, async (req, res) => {
  try {
    const texto = typeof req.body.texto === 'string' ? req.body.texto.trim() : '';

    if (!texto) {
      return res.status(400).json({ erro: 'O texto da tarefa é obrigatório.' });
    }

    const [resultado] = await conexao.execute(
      'INSERT INTO tarefas (texto, usuario_id) VALUES (?, ?)',
      [texto, req.session.usuarioId]
    );

    res.status(201).json({ id: resultado.insertId, texto, concluida: false });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível criar a tarefa.' });
  }
});

app.put('/api/tarefas/:id', exigirLogin, async (req, res) => {
  try {
    const texto = typeof req.body.texto === 'string' ? req.body.texto.trim() : '';
    const concluida = req.body.concluida;

    if (!texto || typeof concluida !== 'boolean') {
      return res.status(400).json({ erro: 'Informe o texto e o status da tarefa.' });
    }

    const [resultado] = await conexao.execute(
      'UPDATE tarefas SET texto = ?, concluida = ? WHERE id = ? AND usuario_id = ?',
      [texto, concluida, req.params.id, req.session.usuarioId]
    );

    if (resultado.affectedRows === 0) {
      const [tarefas] = await conexao.execute(
        'SELECT id FROM tarefas WHERE id = ? AND usuario_id = ?',
        [req.params.id, req.session.usuarioId]
      );

      if (tarefas.length === 0) {
        return res.status(404).json({ erro: 'Tarefa não encontrada.' });
      }
    }

    res.json({ mensagem: 'Tarefa atualizada.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível atualizar a tarefa.' });
  }
});

app.delete('/api/tarefas/:id', exigirLogin, async (req, res) => {
  try {
    const [resultado] = await conexao.execute(
      'DELETE FROM tarefas WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.session.usuarioId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    }

    res.json({ mensagem: 'Tarefa excluída.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Não foi possível excluir a tarefa.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor disponível em http://localhost:${port}`);
});
