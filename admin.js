const $ = s => document.querySelector(s);
let data = null;
const status = (t, bad=false) => { $('#status').textContent=t; $('#status').style.color=bad?'#a52b36':''; };
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('#loadButton').addEventListener('click', async()=>{
  try{
    const r=await fetch('./data/instructions.json',{cache:'no-store'});
    if(!r.ok) throw new Error('Не удалось загрузить JSON');
    data=await r.json(); $('#editor').classList.remove('hidden'); draw(); status('Инструкции загружены. Изменения пока хранятся в этом окне.');
  }catch(e){status('Ошибка загрузки: '+e.message,true);}
});
function draw(){
  const host=$('#instructionList'); host.innerHTML='';
  data.instructions.forEach((ins,idx)=>{
    const box=document.createElement('div'); box.className='edit-card';
    box.innerHTML=`<h3>Инструкция ${idx+1}</h3>
      <label class="field-label">Раздел</label><select class="text-input cat">${data.categories.map(c=>`<option value="${esc(c.id)}" ${c.id===ins.categoryId?'selected':''}>${esc(c.title)}</option>`).join('')}</select>
      <label class="field-label">Название</label><input class="text-input title" value="${esc(ins.title)}">
      <div class="steps"></div>
      <div class="edit-actions"><button class="secondary-button add-step">＋ Добавить шаг</button><button class="danger-button delete-ins">Удалить инструкцию</button></div>`;
    box.querySelector('.cat').onchange=e=>ins.categoryId=e.target.value;
    box.querySelector('.title').oninput=e=>ins.title=e.target.value;
    const steps=box.querySelector('.steps');
    ins.steps.forEach((s,si)=>{
      const card=document.createElement('div'); card.className='edit-card';
      card.innerHTML=`<h3>Шаг ${si+1}</h3><label class="field-label">Заголовок шага</label><input class="text-input stitle" value="${esc(s.title)}">
        <label class="field-label">Пояснение</label><textarea class="text-area stext">${esc(s.text)}</textarea>
        <label class="field-label">Изображение</label><input class="text-input file" type="file" accept="image/*">
        ${s.image?`<img class="image-preview" src="${s.image}" alt="Предпросмотр">`:''}
        <div class="edit-actions"><button class="secondary-button up">↑ Выше</button><button class="secondary-button down">↓ Ниже</button><button class="danger-button del">Удалить шаг</button></div>`;
      card.querySelector('.stitle').oninput=e=>s.title=e.target.value;
      card.querySelector('.stext').oninput=e=>s.text=e.target.value;
      card.querySelector('.file').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>2*1024*1024){status('Для этой версии выбери изображение до 2 МБ.',true);e.target.value='';return;}s.image=await toDataUrl(f);draw();};
      card.querySelector('.up').onclick=()=>{if(si>0){[ins.steps[si-1],ins.steps[si]]=[ins.steps[si],ins.steps[si-1]];draw();}};
      card.querySelector('.down').onclick=()=>{if(si<ins.steps.length-1){[ins.steps[si+1],ins.steps[si]]=[ins.steps[si],ins.steps[si+1]];draw();}};
      card.querySelector('.del').onclick=()=>{if(confirm('Удалить этот шаг?')){ins.steps.splice(si,1);draw();}};
      steps.append(card);
    });
    box.querySelector('.add-step').onclick=()=>{ins.steps.push({title:'Новый шаг',text:'Добавь пояснение.',image:''});draw();};
    box.querySelector('.delete-ins').onclick=()=>{if(confirm('Удалить инструкцию?')){data.instructions.splice(idx,1);draw();}};
    host.append(box);
  });
}
function toDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
$('#newInstruction').addEventListener('click',()=>{
  if(!data)return;
  data.instructions.push({id:'instruction-'+Date.now(),categoryId:data.categories[0]?.id||'',title:'Новая инструкция',steps:[{title:'Первый шаг',text:'Добавь пояснение.',image:''}]});draw();
});
$('#publishButton').addEventListener('click',async()=>{
  if(!data)return;
  const worker=$('#workerUrl').value.trim(), password=$('#adminPassword').value;
  if(!worker||!password){status('Укажи адрес Worker и пароль администратора.',true);return;}
  status('Публикуем изменения…');
  try{
    const r=await fetch(worker.replace(/\/$/,'')+'/publish',{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Password':password},body:JSON.stringify(data)});
    const result=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(result.error||'Ошибка публикации');
    status('Опубликовано! Бабушка увидит изменения после обновления приложения.');
  }catch(e){status('Не удалось опубликовать: '+e.message,true);}
});
