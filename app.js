const app = document.getElementById('app');
const homeButton = document.getElementById('homeButton');
let content = null, categoryId = null, instructionId = null, stepIndex = 0;
const fallback = async () => {
  const r = await fetch('./data/instructions.json', {cache:'no-store'});
  if (!r.ok) throw new Error('Не удалось загрузить инструкции');
  return r.json();
};
async function init(){
  try { content = await fallback(); renderHome(); }
  catch(e){ app.innerHTML = '<section class="panel"><h1>Не удалось загрузить инструкции</h1><p>Проверь подключение к интернету и обнови страницу.</p></section>'; }
}
function renderHome(){
  categoryId = instructionId = null;
  app.innerHTML = '<h1>Чем тебе помочь?</h1><div class="tile-grid"></div>';
  const grid = app.querySelector('.tile-grid');
  content.categories.forEach(c=>{
    const b=document.createElement('button'); b.className='tile '+(c.color||'c1');
    b.innerHTML=`<span class="emoji">${c.emoji||'⭐'}</span>${escapeHtml(c.title)}`;
    b.onclick=()=>renderCategory(c.id); grid.append(b);
  });
}
function renderCategory(id){
  categoryId=id; instructionId=null;
  const c=content.categories.find(x=>x.id===id);
  app.innerHTML=`<h1>${escapeHtml(c?.title||'Инструкции')}</h1><div id="instructionItems"></div><button class="secondary-button" id="backHome">← На главную</button>`;
  const list=app.querySelector('#instructionItems');
  content.instructions.filter(x=>x.categoryId===id).forEach(i=>{
    const b=document.createElement('button'); b.className='list-button'; b.textContent=i.title; b.onclick=()=>{instructionId=i.id;stepIndex=0;renderStep();}; list.append(b);
  });
  app.querySelector('#backHome').onclick=renderHome;
}
function renderStep(){
  const i=content.instructions.find(x=>x.id===instructionId); if(!i)return renderCategory(categoryId);
  const s=i.steps[stepIndex];
  app.innerHTML=`<section class="step-card"><div class="step-count">ШАГ ${stepIndex+1} ИЗ ${i.steps.length}</div><div class="step-title">${escapeHtml(s.title||'Шаг')}</div><p class="step-text">${escapeHtml(s.text||'')}</p>${s.image?`<img class="step-image" src="${s.image}" alt="Иллюстрация к шагу">`:''}<div class="actions"><button class="secondary-button" id="prev" ${stepIndex===0?'disabled':''}>← Назад</button><button class="primary-button" id="next">${stepIndex===i.steps.length-1?'Завершить':'Дальше →'}</button></div><button class="secondary-button" id="toCategory" style="width:100%;margin-top:12px">К списку инструкций</button></section>`;
  app.querySelector('#prev').onclick=()=>{stepIndex--;renderStep();};
  app.querySelector('#next').onclick=()=>{if(stepIndex<i.steps.length-1){stepIndex++;renderStep();}else renderCategory(categoryId);};
  app.querySelector('#toCategory').onclick=()=>renderCategory(categoryId);
}
function escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
homeButton?.addEventListener('click',()=>content&&renderHome());
init();
