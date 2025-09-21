// Navegação SPA
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('[data-target]');

// Autenticação simples (state em sessionStorage)
const ADMINS = [
  { user: 'estevao',    pass: '1709' },
  { user: 'rodrigo',    pass: '2025' },
  { user: 'coordenador', pass: 'ieadpe' }
];
function findAdmin(u, p){ return ADMINS.some(a => a.user === u && a.pass === p); }
function isAdminAuthed(){ try { return sessionStorage.getItem('admin_authed') === '1'; } catch { return false; } }
function setAdminAuthed(v){ try { if (v) sessionStorage.setItem('admin_authed','1'); else sessionStorage.removeItem('admin_authed'); } catch {} updateAdminUI(); }
function updateAdminUI(){ const btn = document.getElementById('btnLogout'); if (btn) btn.style.display = isAdminAuthed() ? '' : 'none'; }
function getActiveAdmin(){ try { return sessionStorage.getItem('admin_active') || null; } catch { return null; } }
function setActiveAdmin(user){ try { if (user) sessionStorage.setItem('admin_active', user); else sessionStorage.removeItem('admin_active'); } catch {} updateAdminUI(); }

function populateAdminSelector(){
  const sel = document.getElementById('adminSelector');
  if (!sel) return;
  sel.innerHTML = '';
  ADMINS.forEach(a => {
    const opt = document.createElement('option'); opt.value = a.user; opt.textContent = a.user; sel.appendChild(opt);
  });
  const active = getActiveAdmin();
  if (active) sel.value = active;
}

function showAdminControls(visible){
  const sel = document.getElementById('adminSelector');
  const btn = document.getElementById('btnLogout');
  if (sel) sel.classList.toggle('hidden', !visible);
  if (btn) btn.classList.toggle('hidden', !visible);
}

function showView(id) {
  views.forEach(v => v.classList.toggle('active', v.id === id));
  document.querySelectorAll('.nav-link').forEach(b => {
    if (b.dataset.target) b.classList.toggle('active', b.dataset.target === id);
  });
  // Atualiza KPIs quando entrar no resumo
  if (id === 'resumo') atualizarResumo();
  // Foco inicial útil
  if (id === 'cadastros') document.getElementById('cad-nome').focus();
}
navLinks.forEach(btn => {
  btn.addEventListener('click', e => {
    const t = btn.dataset.target;
    if (t) {
      e.preventDefault();
      if (t === 'administracao' && !isAdminAuthed()){
        const m = document.getElementById('modalLogin'); if (m) m.setAttribute('aria-hidden','false');
        return;
      }
      showView(t); history.replaceState(null, '', `#${t}`);
    }
  });
});
window.addEventListener('load', () => {
  const target = location.hash?.replace('#','') || 'inicio';
  showView(target);
});

// Firestore Storage (substituindo localStorage)
async function lerCadastros() {
  const { collection, getDocs } = window.firestoreModules;
  const querySnapshot = await getDocs(collection(window.db, "cadastros"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function salvarCadastro(cadastro) {
  const { collection, addDoc } = window.firestoreModules;
  await addDoc(collection(window.db, "cadastros"), cadastro);
}

async function atualizarCadastro(id, dados) {
  const { doc, updateDoc } = window.firestoreModules;
  await updateDoc(doc(window.db, "cadastros", id), dados);
}

async function removerCadastro(id) {
  const { doc, deleteDoc } = window.firestoreModules;
  await deleteDoc(doc(window.db, "cadastros", id));
}

// Observador em tempo real
function observarCadastros() {
  const { collection, onSnapshot } = window.firestoreModules;
  const q = collection(window.db, "cadastros");
  onSnapshot(q, (snapshot) => {
    const arr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTabelaComDados(arr);
    atualizarResumoComDados(arr);
  });
}

// Helpers

const tabelaBody = () => document.querySelector('#tabelaCadastros tbody');
const form = document.getElementById('cadastroForm');
const inputId = document.getElementById('cad-id');
const inputNome = document.getElementById('cad-nome');
const inputIdade = document.getElementById('cad-idade');
const inputTelefone = document.getElementById('cad-telefone');
const inputDateTime = document.getElementById('cad-datetime');
const btnSalvar = document.getElementById('btnSalvar');
const formError = document.getElementById('formError');
const busca = () => document.getElementById('busca');
const btnExportar = () => document.getElementById('btnExportar');
const btnLimparTudo = () => document.getElementById('btnLimparTudo');
// modal elements
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

// DataTime padrão: agora
(function setDefaultDateTime(){
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  inputDateTime.value = local;
})();

// Renderização da tabela
function renderTabela(filtro = '') {
  const cadastros = lerCadastros();
  const f = filtro.trim().toLowerCase();
  const visiveis = cadastros.filter(c =>
    !f ||
    c.nome.toLowerCase().includes(f) ||
    (c.telefone || '').toLowerCase().includes(f)
  );
  const tb = tabelaBody();
  if (!tb) return;
  tb.innerHTML = '';
  if (visiveis.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.style.color = '#9fb0ffbd';
    td.textContent = 'Nenhum cadastro encontrado.';
    tr.appendChild(td);
    tb.appendChild(tr);
    return;
  }
  visiveis.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${escapeHtml(c.nome)}</td>
      <td>${c.idade ?? ''}</td>
      <td>${escapeHtml(c.telefone || '')}</td>
        <td>${formatarDataHora(c.datetime)}</td>
        <td>${(c.atividades && c.atividades.length) ? escapeHtml(c.atividades.join(', ')) : '-'}</td>
      <td>
        <button class="btn outline btn-sm" data-act="edit" data-id="${c.id}">Editar</button>
      </td>
    `;
    tb.appendChild(tr);
  });
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function formatarDataHora(iso){
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  // dd/mm/yyyy hh:mm
  const pad = n => String(n).padStart(2,'0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// CRUD
// Gera um ID no formato Letter + 4 dígitos (ex: A0101)
function gerarIdAleatorio(arr){
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letra = letras[Math.floor(Math.random()*letras.length)];
  // geramos dois pares de números de 0..99 e formatamos com 2 dígitos cada
  const n1 = String(Math.floor(Math.random()*100)).padStart(2,'0');
  const n2 = String(Math.floor(Math.random()*100)).padStart(2,'0');
  const id = `${letra}${n1}${n2}`;
  // garantir unicidade simples (re-tentar se já existir)
  if (arr.some(c => c.id === id)) return gerarIdAleatorio(arr);
  return id;
}
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validarFormulario()) {
    formError.classList.add('active');
    return;
  }

  const cadastro = {
    nome: inputNome.value.trim(),
    idade: Number(inputIdade.value),
    telefone: inputTelefone.value.trim(),
    datetime: new Date().toISOString(),
    atividades: Array.from(document.querySelectorAll('input[name="cad-atividades"]:checked')).map(i => i.value)
  };

  if (inputId.value) {
    await atualizarCadastro(inputId.value, cadastro);
  } else {
    await salvarCadastro(cadastro);
  }

  form.reset();
  inputId.value = '';
});
document.getElementById('btnLimpar').addEventListener('click', () => {
  inputId.value = '';
  atualizaEstadoSalvar();
});

// Handlers de login/logout
document.addEventListener('DOMContentLoaded', () => {
  const loginSubmit = document.getElementById('loginSubmit');
  const loginCancel = document.getElementById('loginCancel');
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  const modalLogin = document.getElementById('modalLogin');
  const btnLogout = document.getElementById('btnLogout');

  if (loginSubmit) loginSubmit.addEventListener('click', () => {
    const u = loginUser?.value?.trim();
    const p = loginPass?.value || '';
    if (findAdmin(u,p)){
      setAdminAuthed(true);
      setActiveAdmin(u);
      populateAdminSelector();
      showAdminControls(true);
      if (modalLogin) modalLogin.setAttribute('aria-hidden','true');
      showView('administracao'); history.replaceState(null,'',`#administracao`);
    } else alert('Usuário ou senha incorretos.');
  });
  if (loginCancel) loginCancel.addEventListener('click', () => { if (modalLogin) modalLogin.setAttribute('aria-hidden','true'); });
  if (btnLogout) btnLogout.addEventListener('click', () => { if (!confirm('Deseja sair da Administração?')) return; setAdminAuthed(false); showView('inicio'); history.replaceState(null,'',`#inicio`); });
  updateAdminUI();
  // preencher seletor e preparar listener
  populateAdminSelector();
  const sel = document.getElementById('adminSelector');
  if (sel) sel.addEventListener('change', (e) => { setActiveAdmin(e.target.value); });
  // mostrar controles se já autenticado
  showAdminControls(isAdminAuthed());
});

document.querySelector('#tabelaCadastros tbody')?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  const arr = lerCadastros();
  const idx = arr.findIndex(c => c.id === id);
  if (idx < 0) return;

  if (act === 'edit') {
    const c = arr[idx];
    inputId.value = c.id;
    inputNome.value = c.nome;
    inputIdade.value = c.idade;
    inputTelefone.value = c.telefone || '';
    inputDateTime.value = c.datetime ? new Date(c.datetime).toISOString().slice(0,16) : '';
    // marcar checkboxes de atividades
    document.querySelectorAll('input[name="cad-atividades"]').forEach(cb => cb.checked = false);
    if (c.atividades && c.atividades.length) {
      c.atividades.forEach(a => {
        const cb = document.querySelector(`input[name="cad-atividades"][value="${CSS.escape ? CSS.escape(a) : a}"]`);
        if (cb) cb.checked = true;
      });
    }
    showView('cadastros');
    inputNome.focus();
    atualizaEstadoSalvar();
  }
});

// Note: geração/confirmação manual de ID foi removida — ID agora é gerado automaticamente ao salvar.

// Busca
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t && t.id === 'busca') renderTabela(busca()?.value);
  // também escuta mudanças no formulário para validar
  if (t && (t.id === 'cad-nome' || t.id === 'cad-idade' || t.id === 'cad-telefone' || t.id === 'cad-datetime' || t.name === 'cad-atividades')) {
    formError.classList.remove('active');
    atualizaEstadoSalvar();
  }
});

function validarFormulario(){
  const nome = inputNome.value.trim();
  const idade = Number(inputIdade.value);
  const telefone = inputTelefone.value.trim();
  const datetime = inputDateTime.value;
  const atividadesEls = Array.from(document.querySelectorAll('input[name="cad-atividades"]:checked'));
  const temAtividade = atividadesEls.length > 0;

  // validações simples
  const ok = nome.length > 0 && !isNaN(idade) && String(idade).length > 0 && telefone.length > 0 && datetime && temAtividade;

  // atualizar classes visuais
  toggleInvalid(inputNome, !nome);
  toggleInvalid(inputIdade, isNaN(idade) || String(idade).length === 0);
  toggleInvalid(inputTelefone, !telefone);
  toggleInvalid(inputDateTime, !datetime);

  return ok;
}

function toggleInvalid(el, invalid){
  const field = el.closest('.form-field');
  if (!field) return;
  field.classList.toggle('invalid', invalid);
}

function atualizaEstadoSalvar(){
  const ok = validarFormulario();
  if (btnSalvar) btnSalvar.disabled = !ok;
}

// Exportar CSV
function handleExport(){
  const arr = lerCadastros();
  if (!arr.length) return alert('Não há cadastros para exportar.');
  const header = ['ID','Nome','Idade','Telefone','DataHoraISO','Atividades'];
  const rows = arr.map(c => [
    c.id, csvSafe(c.nome), c.idade, csvSafe(c.telefone || ''), c.datetime || '', csvSafe((c.atividades || []).join('; '))
  ]);
  const csvBody = [header, ...rows].map(r => r.join(',')).join('\n');
  const exporter = getActiveAdmin() || 'unknown';
  const exportedAt = new Date().toISOString();
  const csv = csvBody + '\n' + `"Exportado por: ${exporter} em ${exportedAt}"`;
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const hoje = new Date().toISOString().slice(0,10);
  a.download = `cadastros_evangelismo_${hoje}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener('click', (e) => {
  const exp = e.target.closest('#btnExportar');
  if (exp) { e.preventDefault(); if (!isAdminAuthed()){ const m = document.getElementById('modalLogin'); if (m) m.setAttribute('aria-hidden','false'); return; } handleExport(); }
  const lim = e.target.closest('#btnLimparTudo');
  if (lim) {
    e.preventDefault();
    if (!isAdminAuthed()){ const m = document.getElementById('modalLogin'); if (m) m.setAttribute('aria-hidden','false'); return; }
    if (!confirm('Tem certeza que deseja remover TODOS os cadastros?')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderTabela(busca()?.value);
    atualizarResumo();
  }
});

if (modalClose) modalClose.addEventListener('click', () => {
  if (modalConfirm) modalConfirm.setAttribute('aria-hidden','true');
  const nomeEl = document.getElementById('cad-nome');
  if (nomeEl) nomeEl.focus();
});
function csvSafe(s){
  const str = String(s ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g,'""')}"`;
  return str;
}

// nota: handlers de export/limpar são tratados pelo listener de clique delegado

// KPIs / Resumo
function atualizarResumo(){
  const arr = lerCadastros();
  document.getElementById('kpiTotal').textContent = arr.length;

  const comIdade = arr.filter(c => typeof c.idade === 'number' && !isNaN(c.idade));
  const media = comIdade.length ? Math.round(comIdade.reduce((s,c)=>s+c.idade,0)/comIdade.length) : '-';
  document.getElementById('kpiMediaIdade').textContent = media;

  const comTel = arr.filter(c => (c.telefone || '').trim()).length;
  document.getElementById('kpiComTelefone').textContent = comTel;

  const hoje = new Date();
  const isSameDay = (d1, d2) => d1.getFullYear()===d2.getFullYear() && d1.getMonth()===d2.getMonth() && d1.getDate()===d2.getDate();
  const hojeCount = arr.filter(c => c.datetime && isSameDay(new Date(c.datetime), hoje)).length;
  document.getElementById('kpiHoje').textContent = hojeCount;

  // Faixas etárias
  const faixas = [
    { rotulo: '0–12', de:0, ate:12 },
    { rotulo: '13–17', de:13, ate:17 },
    { rotulo: '18–29', de:18, ate:29 },
    { rotulo: '30–44', de:30, ate:44 },
    { rotulo: '45–59', de:45, ate:59 },
    { rotulo: '60+',  de:60, ate:200 },
  ];
  const contagens = faixas.map(fx => ({
    rotulo: fx.rotulo,
    qtd: comIdade.filter(c => c.idade >= fx.de && c.idade <= fx.ate).length
  }));
  const ul = document.getElementById('listaFaixas');
  ul.innerHTML = '';
  contagens.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.rotulo}</span><strong>${item.qtd}</strong>`;
    ul.appendChild(li);
  });
}

// Inicialização
renderTabela();
atualizarResumo();
// definir estado inicial do botão salvar (desabilitar/habilitar conforme validação)
atualizaEstadoSalvar();

// Navegação via “href” dos botões
document.querySelectorAll('a[data-target]').forEach(a => {
  a.addEventListener('click', (e) => {
    const t = a.dataset.target;
    if (t) { e.preventDefault(); showView(t); history.replaceState(null, '', `#${t}`); }
  });
});

// Estilo pequeno para botões na tabela
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `.btn-sm{padding:6px 10px;border-radius:8px;font-size:.9rem}`;
  document.head.appendChild(style);
});