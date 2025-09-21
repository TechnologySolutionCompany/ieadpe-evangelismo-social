// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.24.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.24.0/firebase-analytics.js";
import { getDatabase, ref, push, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.24.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPvRqk-TBbYVJa9josOo07ovWPWPR2W28",
  authDomain: "social-ieadpe.firebaseapp.com",
  databaseURL: "https://social-ieadpe-default-rtdb.firebaseio.com",
  projectId: "social-ieadpe",
  storageBucket: "social-ieadpe.firebasestorage.app",
  messagingSenderId: "833311830469",
  appId: "1:833311830469:web:a81651c3b118cf4f8ddbac",
  measurementId: "G-BGVRHJW9QP"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const cadastrosRef = ref(db, 'cadastros/');

// SPA
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('[data-target]');
const ADMINS = [
  { user: 'estevao', pass: '1709' },
  { user: 'rodrigo', pass: '2025' },
  { user: 'coordenador', pass: 'ieadpe' }
];
function findAdmin(u,p){return ADMINS.some(a=>a.user===u && a.pass===p);}
function isAdminAuthed(){return sessionStorage.getItem('admin_authed')==='1';}
function setAdminAuthed(v){ if(v) sessionStorage.setItem('admin_authed','1'); else sessionStorage.removeItem('admin_authed'); updateAdminUI(); }
function getActiveAdmin(){ return sessionStorage.getItem('admin_active') || null; }
function setActiveAdmin(user){ if(user) sessionStorage.setItem('admin_active',user); else sessionStorage.removeItem('admin_active'); updateAdminUI(); }
function updateAdminUI(){ const btn=document.getElementById('btnLogout'); if(btn) btn.style.display=isAdminAuthed()?'':'none'; }

function populateAdminSelector(){
  const sel=document.getElementById('adminSelector'); if(!sel)return;
  sel.innerHTML='';
  ADMINS.forEach(a=>{const opt=document.createElement('option'); opt.value=a.user; opt.textContent=a.user; sel.appendChild(opt);});
  const active=getActiveAdmin(); if(active) sel.value=active;
}

function showAdminControls(visible){
  const sel=document.getElementById('adminSelector'); const btn=document.getElementById('btnLogout');
  if(sel) sel.classList.toggle('hidden',!visible);
  if(btn) btn.classList.toggle('hidden',!visible);
}

function showView(id){
  views.forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('.nav-link').forEach(b=>{if(b.dataset.target) b.classList.toggle('active',b.dataset.target===id)});
}

// Navegação
navLinks.forEach(btn=>{ btn.addEventListener('click', e=>{
  const t=btn.dataset.target;
  if(t){ e.preventDefault(); if(t==='administracao' && !isAdminAuthed()){ const m=document.getElementById('modalLogin'); if(m) m.classList.remove('hidden'); return;} showView(t); history.replaceState(null,'',`#${t}`);}
});});
window.addEventListener('load',()=>{ const target=location.hash?.replace('#','')||'inicio'; showView(target); });

// DOM
const form=document.getElementById('cadastroForm');
const inputId=document.getElementById('cad-id');
const inputNome=document.getElementById('cad-nome');
const inputIdade=document.getElementById('cad-idade');
const inputTelefone=document.getElementById('cad-telefone');
const inputDateTime=document.getElementById('cad-datetime');
const btnSalvar=document.getElementById('btnSalvar');
const formError=document.getElementById('formError');
const tabelaBody=()=>document.querySelector('#tabelaCadastros tbody');
const buscaInput=document.getElementById('busca');

// Default datetime
(function setDefaultDateTime(){
  const now=new Date(); const pad=n=>String(n).padStart(2,'0');
  inputDateTime.value=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
})();

// CRUD Firebase
async function salvarCadastroFirebase(cadastro){
  const novoRef=push(cadastrosRef);
  await set(novoRef,cadastro);
}
async function atualizarCadastroFirebase(id, dados){
  const cRef=ref(db,'cadastros/'+id);
  await update(cRef,dados);
}
async function removerCadastroFirebase(id){
  const cRef=ref(db,'cadastros/'+id);
  await remove(cRef);
}

// Observador em tempo real
onValue(cadastrosRef, snapshot=>{
  const data=snapshot.val()||{};
  const arr=Object.entries(data).map(([id, val])=>({id,...val}));
  renderTabela(arr);
  atualizarResumo(arr);
});

// Render tabela
function renderTabela(arr){
  const filtro=buscaInput?.value?.toLowerCase()||'';
  const tb=tabelaBody(); if(!tb) return; tb.innerHTML='';
  const visiveis=arr.filter(c=>!filtro || c.nome.toLowerCase().includes(filtro) || (c.telefone||'').toLowerCase().includes(filtro));
  if(visiveis.length===0){ const tr=document.createElement('tr'); const td=document.createElement('td'); td.colSpan=7; td.style.color='#9fb0ffbd'; td.textContent='Nenhum cadastro encontrado.'; tr.appendChild(td); tb.appendChild(tr); return;}
  visiveis.forEach(c=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${c.id}</td>
      <td>${escapeHtml(c.nome)}</td>
      <td>${c.idade??''}</td>
      <td>${escapeHtml(c.telefone||'')}</td>
      <td>${formatarDataHora(c.datetime)}</td>
      <td>${(c.atividades?.length)?escapeHtml(c.atividades.join(', ')):'-'}</td>
      <td><button data-act="edit" data-id="${c.id}">Editar</button></td>
    `;
    tb.appendChild(tr);
  });
}

// Helpers
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function formatarDataHora(iso){ if(!iso) return ''; const d=new Date(iso); if(isNaN(d)) return iso; const pad=n=>String(n).padStart(2,'0'); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }

// Form submit
form.addEventListener('submit', async e=>{
  e.preventDefault();
  if(!validarFormulario()){ formError.classList.add('active'); return; }

  const cadastro={
    nome: inputNome.value.trim(),
    idade: Number(inputIdade.value),
    telefone: inputTelefone.value.trim(),
    datetime: inputDateTime.value,
    atividades: Array.from(document.querySelectorAll('input[name="cad-atividades"]:checked')).map(i=>i.value)
  };

  if(inputId.value){ await atualizarCadastroFirebase(inputId.value,cadastro); }
  else{ await salvarCadastroFirebase(cadastro); }

  form.reset(); inputId.value='';
});

// Edit buttons
document.querySelector('#tabelaCadastros tbody').addEventListener('click', e=>{
  const btn=e.target.closest('button[data-act]'); if(!btn) return;
  const id=btn.dataset.id; 
  onValue(ref(db,'cadastros/'+id), snap=>{
    const c=snap.val(); if(!c) return;
    inputId.value=id;
    inputNome.value=c.nome;
    inputIdade.value=c.idade;
    inputTelefone.value=c.telefone;
    inputDateTime.value=c.datetime||'';
    document.querySelectorAll('input[name="cad-atividades"]').forEach(cb=>cb.checked=false);
    if(c.atividades?.length){ c.atividades.forEach(a=>{ const cb=document.querySelector(`input[name="cad-atividades"][value="${CSS.escape?a: a}"]`); if(cb) cb.checked=true; }); }
    showView('cadastros');
  });
});

// Busca
buscaInput?.addEventListener('input',()=>{ /* re-render tabela via onValue já atualiza em tempo real */ });

// Login/Logout
const loginSubmit=document.getElementById('loginSubmit');
const loginCancel=document.getElementById('loginCancel');
const loginUser=document.getElementById('loginUser');
const loginPass=document.getElementById('loginPass');
const modalLogin=document.getElementById('modalLogin');
const btnLogout=document.getElementById('btnLogout');

loginSubmit?.addEventListener('click',()=>{
  const u=loginUser.value.trim(), p=loginPass.value;
  if(findAdmin(u,p)){ setAdminAuthed(true); setActiveAdmin(u); populateAdminSelector(); showAdminControls(true); modalLogin.classList.add('hidden'); showView('administracao'); }
  else alert('Usuário ou senha incorretos.');
});
loginCancel?.addEventListener('click',()=>modalLogin.classList.add('hidden'));
btnLogout?.addEventListener('click',()=>{ if(confirm('Deseja sair?')){ setAdminAuthed(false); showView('inicio'); } });

// KPIs
function atualizarResumo(arr){
  arr=arr||[];
  document.getElementById('kpiTotal').textContent=arr.length;
  const comIdade=arr.filter(c=>typeof c.idade==='number');
  const media=comIdade.length?Math.round(comIdade.reduce((s,c)=>s+c.idade,0)/comIdade.length):'-';
  document.getElementById('kpiMediaIdade').textContent=media;
  const comTel=arr.filter(c=>c.telefone?.trim()).length;
  document.getElementById('kpiComTelefone').textContent=comTel;
  const hoje=new Date(); const isSameDay=(d1,d2)=>d1.getFullYear()===d2.getFullYear() && d1.getMonth()===d2.getMonth() && d1.getDate()===d2.getDate();
  const hojeCount=arr.filter(c=>c.datetime && isSameDay(new Date(c.datetime),hoje)).length;
  document.getElementById('kpiHoje').textContent=hojeCount;
  const faixas=[{rotulo:'0–12',de:0,ate:12},{rotulo:'13–17',de:13,ate:17},{rotulo:'18–29',de:18,ate:29},{rotulo:'30–44',de:30,ate:44},{rotulo:'45–59',de:45,ate:59},{rotulo:'60+',de:60,ate:200}];
  const ul=document.getElementById('listaFaixas'); ul.innerHTML='';
  faixas.forEach(fx=>{ const qtd=comIdade.filter(c=>c.idade>=fx.de && c.idade<=fx.ate).length; const li=document.createElement('li'); li.innerHTML=`<span>${fx.rotulo}</span><strong>${qtd}</strong>`; ul.appendChild(li); });
}

// Inicialização
updateAdminUI();
populateAdminSelector();
showAdminControls(isAdminAuthed());
