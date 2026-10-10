const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const lista = document.querySelector('#todo-list');
const editForm = document.querySelector('#edit-form');
const editInput = document.querySelector('#edit-input');
const cancelEditButton = document.querySelector('#cancel-edit-btn');
const authLinks = document.querySelector('.auth-links');

let tarefas = [];
let tarefaEditando = null;

async function requisitar(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...opcoes.headers
    }
  });

  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = new Error(dados?.erro || 'A solicitação não foi concluída.');
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}

function mostrarUsuario(usuario) {
  if (!authLinks) return;

  const saudacao = document.createElement('span');
  saudacao.textContent = `Olá, ${usuario.nome}`;

  const sair = document.createElement('button');
  sair.type = 'button';
  sair.textContent = 'Sair';
  sair.addEventListener('click', async () => {
    try {
      await requisitar('/api/auth/logout', { method: 'POST' });
      window.location.assign('/login.html');
    } catch (erro) {
      alert(erro.message);
    }
  });

  authLinks.replaceChildren(saudacao, sair);
}

async function carregarTarefas() {
  tarefas = await requisitar('/api/tarefas');
  desenharTarefas();
}

function desenharTarefas() {
  lista.replaceChildren();

  tarefas.forEach((tarefa) => {
    const item = document.createElement('div');
    item.className = tarefa.concluida ? 'todo done' : 'todo';

    const titulo = document.createElement('h3');
    titulo.textContent = tarefa.texto;

    const concluir = document.createElement('button');
    concluir.type = 'button';
    concluir.className = 'finish-todo';
    concluir.innerHTML = '<i class="fa-solid fa-check"></i>';
    concluir.setAttribute('aria-label', 'Concluir tarefa');

    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'edit-todo';
    editar.innerHTML = '<i class="fa-solid fa-pen"></i>';
    editar.setAttribute('aria-label', 'Editar tarefa');

    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'remove-todo';
    excluir.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    excluir.setAttribute('aria-label', 'Excluir tarefa');

    concluir.addEventListener('click', () => alternarConclusao(tarefa));
    editar.addEventListener('click', () => iniciarEdicao(tarefa));
    excluir.addEventListener('click', () => excluirTarefa(tarefa.id));

    item.append(titulo, concluir, editar, excluir);
    lista.appendChild(item);
  });
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const texto = input.value.trim();
  if (!texto) return;

  try {
    await requisitar('/api/tarefas', {
      method: 'POST',
      body: JSON.stringify({ texto })
    });

    input.value = '';
    await carregarTarefas();
  } catch (erro) {
    alert(erro.message);
  }
});

async function alternarConclusao(tarefa) {
  try {
    await requisitar(`/api/tarefas/${tarefa.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        texto: tarefa.texto,
        concluida: !Boolean(tarefa.concluida)
      })
    });

    await carregarTarefas();
  } catch (erro) {
    alert(erro.message);
  }
}

function iniciarEdicao(tarefa) {
  tarefaEditando = tarefa;
  editInput.value = tarefa.texto;
  editForm.classList.remove('hide');
  input.disabled = true;
  editInput.focus();
}

editForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!tarefaEditando) return;

  const texto = editInput.value.trim();
  if (!texto) return;

  try {
    await requisitar(`/api/tarefas/${tarefaEditando.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        texto,
        concluida: Boolean(tarefaEditando.concluida)
      })
    });

    encerrarEdicao();
    await carregarTarefas();
  } catch (erro) {
    alert(erro.message);
  }
});

function encerrarEdicao() {
  tarefaEditando = null;
  editInput.value = '';
  editForm.classList.add('hide');
  input.disabled = false;
}

cancelEditButton.addEventListener('click', (evento) => {
  evento.preventDefault();
  encerrarEdicao();
});

async function excluirTarefa(id) {
  try {
    await requisitar(`/api/tarefas/${id}`, { method: 'DELETE' });
    await carregarTarefas();
  } catch (erro) {
    alert(erro.message);
  }
}

async function iniciarPagina() {
  try {
    const usuario = await requisitar('/api/auth/me');
    mostrarUsuario(usuario);
    await carregarTarefas();
  } catch (erro) {
    if (erro.status === 401) {
      window.location.replace('/login.html');
      return;
    }

    alert(erro.message);
  }
}

iniciarPagina();
