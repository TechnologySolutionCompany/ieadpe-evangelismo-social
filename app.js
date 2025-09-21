// Navegação SPA
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('[data-target]');

// Autenticação simples (state em sessionStorage)
const ADMINS = [
  { user: 'estevao', pass: '1709' },
  { user: 'rodrigo', pass: '2025' },
  { user: 'coordenador', pass: 'ieadpe' }
];

function findAdmin(u, p) {
  return ADMINS.some(a => a.user === u && a.pass === p);
}

function isAdminAuthed() {
  try { return sessionStorage.getItem('admin_authed') === '1'; } catch { return false; }
}

function setAdminAuthed(v) {
  try {
    if (v) sessionStorage.setItem('admin_authed', '1');
    else sessionStorage.removeItem('admin_authed');
  } catch { }
  updateAdminUI();
}

function updateAdminUI() {
  const btn = document.getElementById('btnLogout');
  if (btn) btn.style.display = isAdminAuthed() ? '' : 'none';
}

function getActiveAdmin() {
  try { return sessionStorage.getItem('admin_active') || null; } catch { return null; }
}

function setActiveAdmin(user) {
  try {
    if (user) sessionStorage.setItem('admin_active', user);
    else sessionStorage.removeItem('admin_active');
  } catch { }
  updateAdminUI();
}

function populateAdminSelector() {
  const sel = document.getElementById('adminSelector');
  if (!sel) return;
  sel.innerHTML = '';
  ADMINS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.user;
    opt.textContent = a.user;
    sel.appendChild(opt);
  });
  const active = getActiveAdmin();
  if (active) sel.value = active;
}

function showAdminControls(visible) {
  const sel = document.getElementById('adminSelector');
  const btn = document.getElementById('btnLogout');
  if (sel) sel.classList.toggle('hidden', !visible);
  if (btn) btn.classList.toggle('hidden', !visible);
}

function showView(id) {
  views.forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(b => {
    if (b.dataset.target) b.classList.remove('active');
  });
  
  const targetView = document.getElementById(id);
  const targetNav = document.querySelector(`[data-target="${id}"]`);
  
  if (targetView) targetView.classList.add('active');
  if (targetNav) targetNav.classList.add('active');
  
  if (id === 'resumo') atualizarResumo();
  if (id === 'cadastros') document.getElementById('cad-nome')?.focus();
}

navLinks.forEach(btn => {
  btn.addEventListener('click', e => {
    const t = btn.dataset.target;
    if (t) {
      e.preventDefault();
      if (t === 'administracao' && !isAdminAuthed()) {
        document.getElementById('modalLogin')?.setAttribute('aria-hidden', 'false');
        return;
      }
      showView(t);
      history.replaceState(null, '', `#${t}`);
    }
  });
});

// Storage keys
const STORAGE_KEY = 'cadastros_evangelismo_v1';
const PRESENCA_KEY = 'presencas_confirmadas_v1';

// LocalStorage helpers
function lerCadastros() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function salvarCadastros(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
function lerPresencas() { try { return JSON.parse(localStorage.getItem(PRESENCA_KEY)) || []; } catch { return []; } }
function salvarPresencas(arr) { localStorage.setItem(PRESENCA_KEY, JSON.stringify(arr)); }

// DOM refs
const tabelaBody = () => document.querySelector('#tabelaCadastros tbody');
const form = document.getElementById('cadastroForm');
const inputId = document.getElementById('cad-id');
const inputNome = document.getElementById('cad-nome');
const inputIdade = document.getElementById('cad-idade');
const inputTelefone = document.getElementById('cad-telefone');
const inputDateTimeDisplay = document.getElementById('cad-datetime');
const btnSalvar = document.getElementById('btnSalvar');
const formError = document.getElementById('formError');
const busca = () => document.getElementById('busca');

// modais
const modalConfirm = document.getElementById('modalConfirm');
const modalNome = document.getElementById('modalNome');
const modalIdEl = document.getElementById('modalId');
const modalClose = document.getElementById('modalClose');

// login modal elements (Admin)
const modalLogin = document.getElementById('modalLogin');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginSubmit = document.getElementById('loginSubmit');
const loginCancel = document.getElementById('loginCancel');
const btnLogout = document.getElementById('btnLogout');

// DataTime padrão: agora (display)
let currentDateTime = new Date();
function updateDateTimeDisplay() {
  const pad = n => String(n).padStart(2, '0');
  const local = `${pad(currentDateTime.getDate())}/${pad(currentDateTime.getMonth() + 1)}/${currentDateTime.getFullYear()} ${pad(currentDateTime.getHours())}:${pad(currentDateTime.getMinutes())}`;
  if (inputDateTimeDisplay) inputDateTimeDisplay.textContent = local;
}
updateDateTimeDisplay();
setInterval(() => { currentDateTime = new Date(); updateDateTimeDisplay(); }, 60000);

// Funções CRUD
function gerarId() {
  const cadastros = lerCadastros();
  const ultimoId = cadastros.length > 0 ? cadastros[cadastros.length - 1].id : 'A0000';
  const numero = parseInt(ultimoId.substring(1)) + 1;
  return `A${String(numero).padStart(4, '0')}`;
}

function salvarCadastro(e) {
  e.preventDefault();
  
  const nome = inputNome.value.trim();
  const idade = parseInt(inputIdade.value);
  const telefone = inputTelefone.value.trim();
  
  if (!nome || isNaN(idade) || !telefone) {
    formError.classList.add('active');
    return;
  }
  
  formError.classList.remove('active');
  
  const cadastros = lerCadastros();
  const id = inputId.value || gerarId();
  const dataHora = currentDateTime.toISOString();
  
  const cadastro = {
    id,
    nome,
    idade,
    telefone,
    dataHora,
    atividade: ''
  };
  
  if (inputId.value) {
    // Edição
    const index = cadastros.findIndex(c => c.id === id);
    if (index !== -1) {
      cadastros[index] = { ...cadastros[index], nome, idade, telefone };
    }
  } else {
    // Novo cadastro
    cadastros.push(cadastro);
  }
  
  salvarCadastros(cadastros);
  
  // Mostrar modal de confirmação
  if (modalNome && modalIdEl) {
    modalNome.textContent = nome;
    modalIdEl.textContent = id;
    modalConfirm.setAttribute('aria-hidden', 'false');
  }
  
  form.reset();
  inputId.value = '';
  renderTabela();
  atualizarResumo();
}

function renderTabela() {
  const tbody = tabelaBody();
  if (!tbody) return;
  
  const cadastros = lerCadastros();
  const termoBusca = busca()?.value.toLowerCase() || '';
  const filtrados = cadastros.filter(c => 
    c.nome.toLowerCase().includes(termoBusca) || 
    c.telefone.includes(termoBusca)
  );
  
  tbody.innerHTML = '';
  
  filtrados.forEach(cadastro => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${cadastro.id}</td>
      <td>${cadastro.nome}</td>
      <td>${cadastro.idade}</td>
      <td>${cadastro.telefone}</td>
      <td>${cadastro.atividade || 'Não confirmada'}</td>
      <td>${new Date(cadastro.dataHora).toLocaleString('pt-BR')}</td>
      <td>
        <button class="btn btn-sm" onclick="editarCadastro('${cadastro.id}')">Editar</button>
        <button class="btn btn-sm danger" onclick="excluirCadastro('${cadastro.id}')">Excluir</button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

function editarCadastro(id) {
  const cadastros = lerCadastros();
  const cadastro = cadastros.find(c => c.id === id);
  
  if (cadastro) {
    inputId.value = cadastro.id;
    inputNome.value = cadastro.nome;
    inputIdade.value = cadastro.idade;
    inputTelefone.value = cadastro.telefone;
    
    inputNome.focus();
  }
}

function excluirCadastro(id) {
  if (confirm('Tem certeza que deseja excluir este cadastro?')) {
    const cadastros = lerCadastros();
    const novosCadastros = cadastros.filter(c => c.id !== id);
    salvarCadastros(novosCadastros);
    renderTabela();
    atualizarResumo();
  }
}

function atualizarResumo() {
  const cadastros = lerCadastros();
  const presencas = lerPresencas();
  
  document.getElementById('kpiTotal').textContent = cadastros.length;
  document.getElementById('kpiTotalConfirmacoes').textContent = presencas.length;
  
  // Calcular atividades mais e menos frequentes
  const atividadesCount = {};
  presencas.forEach(p => {
    atividadesCount[p.atividade] = (atividadesCount[p.atividade] || 0) + 1;
  });
  
  const atividadesArray = Object.entries(atividadesCount);
  if (atividadesArray.length > 0) {
    const maisFrequente = atividadesArray.reduce((a, b) => a[1] > b[1] ? a : b);
    const menosFrequente = atividadesArray.reduce((a, b) => a[1] < b[1] ? a : b);
    
    document.getElementById('kpiMaisFrequentes').textContent = `${maisFrequente[0]} (${maisFrequente[1]})`;
    document.getElementById('kpiMenosFrequentes').textContent = `${menosFrequente[0]} (${menosFrequente[1]})`;
  } else {
    document.getElementById('kpiMaisFrequentes').textContent = 'S/ dados';
    document.getElementById('kpiMenosFrequentes').textContent = 'S/ dados';
  }
}

function exportarCSV() {
  const cadastros = lerCadastros();
  const presencas = lerPresencas();
  
  // Combinar dados de cadastros com presenças
  const dadosCompletos = cadastros.map(cadastro => {
    const presenca = presencas.find(p => p.id === cadastro.id);
    return {
      ...cadastro,
      atividadeConfirmada: presenca ? presenca.atividade : 'Não confirmada',
      dataHoraPresenca: presenca ? presenca.dataHora : ''
    };
  });
  
  if (dadosCompletos.length === 0) {
    alert('Não há dados para exportar');
    return;
  }
  
  const headers = ['ID', 'Nome', 'Idade', 'Telefone', 'Data Cadastro', 'Atividade Confirmada', 'Data/Hora Confirmação'];
  const csvRows = [headers.join(',')];
  
  dadosCompletos.forEach(row => {
    const values = [
      row.id,
      `"${row.nome}"`,
      row.idade,
      `"${row.telefone}"`,
      `"${new Date(row.dataHora).toLocaleString('pt-BR')}"`,
      `"${row.atividadeConfirmada}"`,
      row.dataHoraPresenca ? `"${new Date(row.dataHoraPresenca).toLocaleString('pt-BR')}"` : ''
    ];
    csvRows.push(values.join(','));
  });
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `evangelismo_solidario_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function limparTudo() {
  if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PRESENCA_KEY);
    renderTabela();
    atualizarResumo();
    alert('Todos os dados foram removidos.');
  }
}

function atualizaEstadoSalvar() {
  if (btnSalvar) {
    const nome = inputNome.value.trim();
    const idade = inputIdade.value;
    const telefone = inputTelefone.value.trim();
    
    btnSalvar.disabled = !nome || !idade || !telefone;
    btnSalvar.textContent = inputId.value ? 'Atualizar' : 'Salvar';
  }
}

// Event Listeners
if (form) {
  form.addEventListener('submit', salvarCadastro);
  form.addEventListener('input', atualizaEstadoSalvar);
}

if (modalClose) {
  modalClose.addEventListener('click', () => {
    modalConfirm.setAttribute('aria-hidden', 'true');
  });
}

if (busca()) {
  busca().addEventListener('input', renderTabela);
}

if (loginSubmit) {
  loginSubmit.addEventListener('click', () => {
    const user = loginUser.value.trim();
    const pass = loginPass.value;
    
    if (findAdmin(user, pass)) {
      setAdminAuthed(true);
      setActiveAdmin(user);
      modalLogin.setAttribute('aria-hidden', 'true');
      showView('administracao');
      history.replaceState(null, '', '#administracao');
      showAdminControls(true);
    } else {
      alert('Usuário ou senha incorretos');
    }
  });
}

if (loginCancel) {
  loginCancel.addEventListener('click', () => {
    modalLogin.setAttribute('aria-hidden', 'true');
    loginUser.value = '';
    loginPass.value = '';
  });
}

if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    setAdminAuthed(false);
    setActiveAdmin(null);
    showAdminControls(false);
    showView('inicio');
    history.replaceState(null, '', '#inicio');
  });
}

// Atividades - confirmação de presença
document.querySelectorAll('.activity-card').forEach(card => {
  card.addEventListener('click', function() {
    const atividade = this.getAttribute('data-atividade');
    document.getElementById('modalAtividadeTitulo').textContent = atividade;
    document.getElementById('modalSelecaoId').setAttribute('aria-hidden', 'false');
    
    // Armazenar a atividade selecionada no botão de confirmação
    const btnConfirmar = document.getElementById('btnConfirmarPresenca');
    btnConfirmar.setAttribute('data-atividade', atividade);
  });
});

// Confirmar presença
if (document.getElementById('btnConfirmarPresenca')) {
  document.getElementById('btnConfirmarPresenca').addEventListener('click', function() {
    const id = document.getElementById('presencaIdInput').value.trim().toUpperCase();
    const atividade = this.getAttribute('data-atividade');
    
    if (!id) {
      alert('Por favor, informe o ID');
      return;
    }
    
    const cadastros = lerCadastros();
    const cadastro = cadastros.find(c => c.id === id);
    
    if (!cadastro) {
      alert('ID não encontrado. Verifique o código e tente novamente.');
      return;
    }
    
    const presencas = lerPresencas();
    
    // Verificar se já confirmou presença
    if (presencas.some(p => p.id === id)) {
      alert('Este ID já confirmou presença em uma atividade.');
      return;
    }
    
    // Adicionar confirmação
    presencas.push({
      id,
      nome: cadastro.nome,
      atividade,
      dataHora: new Date().toISOString()
    });
    
    salvarPresencas(presencas);
    
    // Atualizar cadastro com a atividade
    const index = cadastros.findIndex(c => c.id === id);
    if (index !== -1) {
      cadastros[index].atividade = atividade;
      salvarCadastros(cadastros);
    }
    
    // Mostrar confirmação
    document.getElementById('modalPresencaNome').textContent = cadastro.nome;
    document.getElementById('modalPresencaId').textContent = id;
    document.getElementById('modalPresencaAtividade').textContent = atividade;
    
    document.getElementById('modalSelecaoId').setAttribute('aria-hidden', 'true');
    document.getElementById('modalPresencaConfirmada').setAttribute('aria-hidden', 'false');
    
    // Limpar campo
    document.getElementById('presencaIdInput').value = '';
    
    // Atualizar tabela e resumo
    renderTabela();
    atualizarResumo();
  });
}

// Fechar modais
document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
  btn.addEventListener('click', function() {
    this.closest('.modal').setAttribute('aria-hidden', 'true');
  });
});

// Exportar CSV
if (document.getElementById('btnExportar')) {
  document.getElementById('btnExportar').addEventListener('click', exportarCSV);
}

// Limpar tudo
if (document.getElementById('btnLimparTudo')) {
  document.getElementById('btnLimparTudo').addEventListener('click', limparTudo);
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
  renderTabela();
  atualizarResumo();
  atualizaEstadoSalvar();
  updateAdminUI();
  populateAdminSelector();
  showAdminControls(isAdminAuthed());
  
  // Verificar hash na URL
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    if (hash === 'administracao' && !isAdminAuthed()) {
      document.getElementById('modalLogin')?.setAttribute('aria-hidden', 'false');
    } else {
      showView(hash);
    }
  }
  
  // Adicionar estilo pequeno para botões
  const style = document.createElement('style');
  style.textContent = `.btn-sm{padding:6px 10px;border-radius:8px;font-size:.9rem}`;
  document.head.appendChild(style);
});