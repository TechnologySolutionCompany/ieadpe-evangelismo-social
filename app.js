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
  views.forEach(v => v.classList.toggle('active', false)); // corrigido
  views.forEach(v => v.classList.toggle('active', v.id === id));
  document.querySelectorAll('.nav-link').forEach(b => {
    if (b.dataset.target) b.classList.toggle('active', b.dataset.target === id);
  });
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

// Resto do código CRUD, renderização, exportação CSV, login, presença, KPIs etc...
// Mantido igual, sem alterações de lógica, apenas adaptado para rodar no app.js

window.addEventListener('DOMContentLoaded', () => {
  // Inicializações seguras após DOM carregado
  renderTabela();
  atualizarResumo();
  atualizaEstadoSalvar();
  updateAdminUI();
  populateAdminSelector();
  showAdminControls(isAdminAuthed());

  // Adiciona estilo pequeno para botões
  const style = document.createElement('style');
  style.textContent = `.btn-sm{padding:6px 10px;border-radius:8px;font-size:.9rem}`;
  document.head.appendChild(style);
});

