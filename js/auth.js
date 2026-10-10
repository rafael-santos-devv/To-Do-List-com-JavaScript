const form = document.querySelector('.auth-form');
const mensagem = document.createElement('p');
mensagem.className = 'auth-message';
mensagem.setAttribute('role', 'alert');
mensagem.setAttribute('aria-live', 'polite');
form.before(mensagem);

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensagem.textContent = '';

  const botao = form.querySelector('button[type="submit"]');
  botao.disabled = true;

  const cadastro = window.location.pathname.endsWith('/cadastro.html');
  const dados = {
    email: form.elements.email.value.trim(),
    senha: form.elements.password.value
  };

  if (cadastro) {
    dados.nome = form.elements.name.value.trim();
  }

  try {
    const resposta = await fetch(cadastro ? '/api/auth/cadastro' : '/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();
    if (!resposta.ok) {
      throw new Error(resultado.erro || 'Não foi possível concluir a solicitação.');
    }

    window.location.assign('/');
  } catch (erro) {
    mensagem.textContent = erro.message || 'Não foi possível conectar ao servidor.';
  } finally {
    botao.disabled = false;
  }
});
