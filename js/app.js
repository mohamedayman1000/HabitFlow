const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEFAULT_CATS = {
  sleep:  { label:'Sleep',  cls:'tag-sleep',  cbcls:'cb-sleep',  color:'#2a78d6', icon:'😴', builtin:true },
  health: { label:'Health', cls:'tag-health', cbcls:'cb-health', color:'#1baf7a', icon:'💪', builtin:true },
  mind:   { label:'Mind',   cls:'tag-mind',   cbcls:'cb-mind',   color:'#4a3aa7', icon:'🧠', builtin:true },
  work:   { label:'Work',   cls:'tag-work',   cbcls:'cb-work',   color:'#eda100', icon:'💼', builtin:true },
  social: { label:'Social', cls:'tag-social', cbcls:'cb-social', color:'#e87ba4', icon:'👥', builtin:true },
};
const LS_CATS = 'habitTracker_customCats';
const COLOR_PRESETS = ['#2a78d6','#1baf7a','#4a3aa7','#eda100','#e87ba4','#3ac7a8','#f0a830','#c0392b','#9b87e5','#06b6d4','#84cc16','#f43f5e'];

function loadCustomCats(){
  try{
    const raw = localStorage.getItem(LS_CATS);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function saveCustomCats(){
  try{ localStorage.setItem(LS_CATS, JSON.stringify(customCats)); }catch(e){}
}
let customCats = loadCustomCats();
function allCats(){ return Object.assign({}, DEFAULT_CATS, customCats); }
const CATS = allCats();
function refreshCats(){ Object.keys(CATS).forEach(k=>delete CATS[k]); Object.assign(CATS, allCats()); }
const DONUT_COLORS = ['#2a78d6','#9b87e5','#3ac7a8','#e87ba4','#f0a830'];
const LS_HABITS = 'habitTracker_habits';
const LS_CHECKS = 'habitTracker_checks';

let today = new Date();
let curYear = today.getFullYear(), curMonth = today.getMonth();
let editingId = null, deletingId = null, filteredHabits = null;

// ── Custom Dropdown logic ──
const ddState = {};  // { id: currentValue }

function toggleDD(id) {
  const menu    = document.getElementById(id + 'Menu');
  const trigger = document.getElementById(id + 'Trigger');
  const isOpen  = menu.classList.contains('open');
  // close all
  document.querySelectorAll('.dd-menu').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.dd-trigger').forEach(t => t.classList.remove('open'));
  if (!isOpen) {
    menu.classList.add('open');
    trigger.classList.add('open');
  }
}

function selectDD(id, val, label) {
  ddState[id] = val;
  document.getElementById(id + 'Label').textContent = label;
  // update selected highlight
  document.querySelectorAll(`#${id}Menu .dd-item`).forEach(el => {
    el.classList.toggle('selected', el.dataset.val === val);
  });
  // close
  document.getElementById(id + 'Menu').classList.remove('open');
  document.getElementById(id + 'Trigger').classList.remove('open');
  // trigger filter
  if (id === 'ddCat' || id === 'ddSort') applyFilters();
}

// close dropdowns when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.dd-wrap')) {
    document.querySelectorAll('.dd-menu').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.dd-trigger').forEach(t => t.classList.remove('open'));
  }
});

// ── Data ──
function loadData() {
  try {
    const h = localStorage.getItem(LS_HABITS);
    const c = localStorage.getItem(LS_CHECKS);
    habits = h ? JSON.parse(h) : defaultHabits();
    checks = c ? JSON.parse(c) : defaultChecks();
  } catch(e) { habits = defaultHabits(); checks = defaultChecks(); }
}
function saveData() {
  try {
    localStorage.setItem(LS_HABITS, JSON.stringify(habits));
    localStorage.setItem(LS_CHECKS, JSON.stringify(checks));
  } catch(e) {}
}
function defaultHabits() {
  return [
    {id:1,name:'Sleep 8 hours',cat:'sleep'},
    {id:2,name:'Exercise',cat:'health'},
    {id:3,name:'Meditate',cat:'mind'},
    {id:4,name:'Read',cat:'mind'},
    {id:5,name:'No junk food',cat:'health'},
    {id:6,name:'Deep work 2h',cat:'work'},
  ];
}
function defaultChecks() {
  const y=today.getFullYear(), m=today.getMonth(), d=today.getDate(), c={};
  const p={1:[1,2,3,4,5,6,29],2:[1,2,3,4,8,29],3:[2,7,29],4:[2,5,8,10,12,29],5:[1,2,3,4,6,7,10,29],6:[5,29]};
  Object.entries(p).forEach(([hid,days])=>days.filter(dd=>dd<=d).forEach(dd=>{c[`${y}-${m}-${hid}-${dd}`]=true;}));
  return c;
}
let habits=[], checks={};
loadData();

// ── Helpers ──
function key(hid,day){return `${curYear}-${curMonth}-${hid}-${day}`;}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function firstDay(y,m){return new Date(y,m,1).getDay();}
function getCheck(hid,day){return !!checks[key(hid,day)];}
function toggleCheck(hid,day){checks[key(hid,day)]=!checks[key(hid,day)];saveData();render();}

function getWeeks(y,m){
  const days=daysInMonth(y,m),weeks=[],fd=firstDay(y,m);
  let week=[];
  for(let d=1;d<=days;d++){
    week.push(d);
    if((fd+d-1)%7===6||d===days){weeks.push(week);week=[];}
  }
  return weeks;
}

function weekPct(days){
  if(!habits.length||!days.length)return 0;
  let t=habits.length*days.length,done=0;
  for(const h of habits)for(const d of days)if(getCheck(h.id,d))done++;
  return t?Math.round(done/t*100):0;
}
function monthPct(){
  const days=daysInMonth(curYear,curMonth);
  if(!habits.length||!days)return 0;
  let t=habits.length*days,done=0;
  for(const h of habits)for(let d=1;d<=days;d++)if(getCheck(h.id,d))done++;
  return Math.round(done/t*100);
}
function habitPct(hid){
  const days=daysInMonth(curYear,curMonth);
  let done=0;
  for(let d=1;d<=days;d++)if(getCheck(hid,d))done++;
  return Math.round(done/days*100);
}
function habitStreak(hid){
  let s=0,d=new Date(today);
  while(true){
    const y=d.getFullYear(),m=d.getMonth(),day=d.getDate();
    if(!checks[`${y}-${m}-${hid}-${day}`])break;
    s++;d.setDate(d.getDate()-1);
  }
  return s;
}
function habitBest(hid){
  let best=0,cur=0,days=daysInMonth(curYear,curMonth);
  for(let d=1;d<=days;d++){if(getCheck(hid,d)){cur++;best=Math.max(best,cur);}else cur=0;}
  return best;
}
function currentStreak(){
  if(!habits.length)return 0;
  let s=0,d=new Date(today);
  while(true){
    const y=d.getFullYear(),m=d.getMonth(),day=d.getDate();
    if(!habits.every(h=>!!checks[`${y}-${m}-${h.id}-${day}`]))break;
    s++;d.setDate(d.getDate()-1);
  }
  return s;
}
function todayCompletion(){
  const y=today.getFullYear(),m=today.getMonth(),d=today.getDate();
  return{done:habits.filter(h=>checks[`${y}-${m}-${h.id}-${d}`]).length,total:habits.length};
}
function bestHabit(){
  if(!habits.length)return{name:'—'};
  return habits.reduce((b,h)=>habitPct(h.id)>habitPct(b.id)?h:b,habits[0]);
}

function donutSVG(pct,color){
  const r=13.5,circ=2*Math.PI*r,filled=(pct/100)*circ;
  return `<svg viewBox="0 0 36 36" class="donut"><circle class="track" cx="18" cy="18" r="${r}"/>
    <circle cx="18" cy="18" r="${r}" stroke="${color}" stroke-dasharray="${filled} ${circ-filled}"
    stroke-dashoffset="${circ*.25}" transform="rotate(-90 18 18)" stroke-linecap="round" fill="none" stroke-width="6"/></svg>`;
}

function renderStats(){
  const s=currentStreak(),tc=todayCompletion(),mp=monthPct(),bh=bestHabit();
  document.getElementById('streakValue').textContent    = s+(s===1?' day':' days');
  document.getElementById('completionValue').textContent= mp+'%';
  document.getElementById('todayValue').textContent     = tc.done+'/'+tc.total;
  document.getElementById('bestHabitValue').textContent = bh.name;
}

// ── Dynamic category dropdown rendering ──
function catItemHTML(ddId, val, c, selected){
  const isBuiltin = c.builtin;
  return `<div class="dd-item dd-item-cat${selected?' selected':''}" data-val="${val}" onclick="selectDD('${ddId}','${val}','${escAttr(c.icon)} ${escAttr(c.label)}')">
      <span class="dd-item-cat-main">
        <span class="dd-item-cat-icon">${c.icon}</span><span>${c.label}</span>
      </span>
      ${isBuiltin ? '' : `<span class="dd-item-cat-actions">
        <button class="edit-cat-btn" title="Edit" onclick="event.stopPropagation();openCatModal('${val}')">✏️</button>
        <button class="del-cat-btn" title="Delete" onclick="event.stopPropagation();deleteCategory('${val}')">🗑</button>
      </span>`}
    </div>`;
}
function escAttr(s){ return (s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

function renderCatDropdown(ddId, opts){
  const { includeAll, menuId } = opts;
  const menu = document.getElementById(menuId || (ddId+'Menu'));
  if(!menu) return;
  const current = ddState[ddId];
  let html = '';
  if(includeAll){
    html += `<div class="dd-item${!current?' selected':''}" data-val="" onclick="selectDD('${ddId}','','All Categories')">All Categories</div>`;
  }
  Object.entries(CATS).forEach(([v,c])=>{
    html += catItemHTML(ddId, v, c, v===current);
  });
  html += `<div class="dd-item dd-item-create" onclick="openCatModal()">➕ Create New Category</div>`;
  menu.innerHTML = html;
}

function renderAllCatDropdowns(){
  renderCatDropdown('ddCat', {includeAll:true});
  renderCatDropdown('ddModalCat', {includeAll:false});
}

// ── Create / Edit / Delete Category ──
let catEditingKey = null;
let selectedCatColor = COLOR_PRESETS[0];

function openCatModal(editKey){
  catEditingKey = editKey || null;
  const titleEl = document.getElementById('catModalTitle');
  const nameInput = document.getElementById('catNameInput');
  const iconInput = document.getElementById('catIconInput');
  const saveBtn = document.getElementById('catModalSaveBtn');
  document.getElementById('catNameErr').textContent = '';

  if(editKey && customCats[editKey]){
    const c = customCats[editKey];
    titleEl.textContent = 'Edit Category';
    nameInput.value = c.label;
    iconInput.value = c.icon;
    selectedCatColor = c.color;
    saveBtn.textContent = 'Save Changes';
  } else {
    titleEl.textContent = 'Create New Category';
    nameInput.value = '';
    iconInput.value = '✨';
    selectedCatColor = COLOR_PRESETS[Math.floor(Math.random()*COLOR_PRESETS.length)];
    saveBtn.textContent = 'Create Category';
  }
  document.getElementById('catColorCustom').value = selectedCatColor;

  // icon: free text input, user types their own emoji

  // color swatches
  const colorRow = document.getElementById('catColorRow');
  colorRow.querySelectorAll('.color-swatch').forEach(el=>el.remove());
  const customWrap = colorRow.querySelector('.color-custom-wrap');
  COLOR_PRESETS.forEach(col=>{
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (col.toLowerCase()===selectedCatColor.toLowerCase() ? ' selected' : '');
    sw.style.background = col;
    sw.dataset.color = col;
    sw.onclick = ()=>selectCatColor(col);
    colorRow.insertBefore(sw, customWrap);
  });

  updateCatPreview();

  // close any open dropdown menus first so they don't sit above modal oddly
  document.querySelectorAll('.dd-menu').forEach(m=>m.classList.remove('open'));
  document.querySelectorAll('.dd-trigger').forEach(t=>t.classList.remove('open'));

  const bg = document.getElementById('catModalBg');
  bg.classList.add('open');
  requestAnimationFrame(()=>bg.classList.add('show'));
  setTimeout(()=>nameInput.focus(), 50);
}

function closeCatModal(){
  const bg = document.getElementById('catModalBg');
  bg.classList.remove('show');
  setTimeout(()=>bg.classList.remove('open'), 200);
  catEditingKey = null;
}

function selectCatColor(col){
  selectedCatColor = col;
  document.getElementById('catColorCustom').value = col;
  document.querySelectorAll('#catColorRow .color-swatch').forEach(el=>{
    el.classList.toggle('selected', el.dataset.color && el.dataset.color.toLowerCase()===col.toLowerCase());
  });
  updateCatPreview();
}

function updateCatPreview(){
  const name = document.getElementById('catNameInput').value.trim() || 'Category Name';
  const icon = document.getElementById('catIconInput').value.trim() || '✨';
  document.getElementById('catPreview').innerHTML =
    `<span class="cat-preview-label">Preview:</span>
     <span class="tag" style="background:${selectedCatColor}2e;color:${selectedCatColor};">${icon} ${name}</span>`;
}

function slugify(name){
  let base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'category';
  let slug = base, i = 1;
  while(CATS[slug]) slug = `${base}-${i++}`;
  return slug;
}

function saveCategoryModal(){
  const nameInput = document.getElementById('catNameInput');
  const errEl = document.getElementById('catNameErr');
  let name = nameInput.value.replace(/\s+/g,' ').trim();
  const icon = document.getElementById('catIconInput').value.trim() || '✨';

  if(!name){ errEl.textContent = 'Category name cannot be empty.'; nameInput.focus(); return; }
  if(name.length>20){ errEl.textContent = 'Category name is too long (max 20 characters).'; return; }

  const dupKey = Object.entries(CATS).find(([k,c]) =>
    c.label.toLowerCase()===name.toLowerCase() && k!==catEditingKey
  );
  if(dupKey){ errEl.textContent = 'A category with this name already exists.'; return; }

  errEl.textContent = '';

  if(catEditingKey){
    // editing existing custom category: name/icon/color editable, key stays the same
    const c = customCats[catEditingKey];
    c.label = name; c.icon = icon; c.color = selectedCatColor;
    saveCustomCats();
  } else {
    const key = slugify(name);
    customCats[key] = { label:name, icon, color:selectedCatColor, builtin:false };
    saveCustomCats();
    refreshCats();
    // auto-select newly created category in whichever dropdown is most relevant
    ddState['ddModalCat'] = key;
    if(document.getElementById('modalBg').classList.contains('open')){
      document.getElementById('ddModalCatLabel').textContent = `${icon} ${name}`;
    }
    ddState['ddCat'] = key;
    document.getElementById('ddCatLabel').textContent = `${icon} ${name}`;
    catEditingKey = key;
  }
  refreshCats();
  renderAllCatDropdowns();
  closeCatModal();
  filteredHabits=null; applyFilters(); render();
}

function deleteCategory(key){
  if(!customCats[key]) return;
  const c = customCats[key];
  if(!confirm(`Delete category "${c.label}"? Habits using it will be moved to "Health".`)) return;
  delete customCats[key];
  saveCustomCats();
  refreshCats();
  // reassign any habits using this category to a safe default
  habits.forEach(h=>{ if(h.cat===key) h.cat='health'; });
  saveData();
  if(ddState['ddCat']===key){ ddState['ddCat']=''; document.getElementById('ddCatLabel').textContent='All Categories'; }
  if(ddState['ddModalCat']===key){ ddState['ddModalCat']='health'; document.getElementById('ddModalCatLabel').textContent='💪 Health'; }
  renderAllCatDropdowns();
  filteredHabits=null; applyFilters(); render();
}

// ── Inline edit category dropdown (rendered in JS) ──
function editCatDD(hid, currentCat) {
  const ddId = `ddEdit${hid}`;
  return `<div class="dd-wrap" id="${ddId}Wrap">
    <div class="dd-trigger" id="${ddId}Trigger" onclick="toggleDD('${ddId}')" style="padding:5px 9px;border-radius:9px;">
      <span id="${ddId}Label">${CATS[currentCat]?.icon||''} ${CATS[currentCat]?.label||'Health'}</span>
      <span class="dd-arrow">▼</span>
    </div>
    <div class="dd-menu" id="${ddId}Menu">
      ${Object.entries(CATS).map(([v,c])=>catItemHTML(ddId, v, c, v===currentCat)).join('')}
      <div class="dd-item dd-item-create" onclick="openCatModal()">➕ Create New Category</div>
    </div>
  </div>`;
}

// ── Filters ──
function applyFilters(){
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase();
  const cat=ddState['ddCat']||'';
  const sort=ddState['ddSort']||'default';
  let r=[...habits];
  if(q)r=r.filter(h=>h.name.toLowerCase().includes(q));
  if(cat)r=r.filter(h=>h.cat===cat);
  if(sort==='name')r.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='pct') r.sort((a,b)=>habitPct(b.id)-habitPct(a.id));
  filteredHabits=r;
  render();
}

// ── Export ──
function exportData(){
  const days=daysInMonth(curYear,curMonth);
  const hdr=['Habit','Category',...Array.from({length:days},(_,i)=>'Day '+(i+1))];
  const rows=habits.map(h=>[h.name,h.cat,...Array.from({length:days},(_,i)=>getCheck(h.id,i+1)?'1':'0')]);
  const csv=[hdr,...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download=`habits_${MONTHS[curMonth]}_${curYear}.csv`;
  a.click();
}

// ── Render ──
function render(){
  document.getElementById('monthLabel').textContent=`${MONTHS[curMonth]} ${curYear}`;
  renderStats();
  const weeks=getWeeks(curYear,curMonth);

  // donuts
  const mp=monthPct();
  let whtml=`<div class="week-card"><div class="wlabel">MONTHLY</div>${donutSVG(mp,DONUT_COLORS[0])}<div class="wpct">${mp}%</div></div>`;
  weeks.forEach((w,i)=>{
    const p=weekPct(w),col=DONUT_COLORS[(i+1)%DONUT_COLORS.length];
    whtml+=`<div class="week-card"><div class="wlabel">WEEK ${i+1}</div>${donutSVG(p,col)}<div class="wpct">${p}%</div></div>`;
  });
  document.getElementById('weekSummary').innerHTML=whtml;

  // table head
  let head=`<tr><th class="habit-col">HABIT</th><th></th>`;
  weeks.forEach((w,wi)=>{
    w.forEach(d=>{
      const isToday=curYear===today.getFullYear()&&curMonth===today.getMonth()&&d===today.getDate();
      head+=`<th style="${isToday?'color:#2a78d6;font-weight:800;':''}">${d}</th>`;
    });
    if(wi<weeks.length-1)head+=`<th class="week-sep"></th>`;
  });
  head+=`<th style="min-width:90px">Progress</th><th>Streak</th><th>Best</th><th>Actions</th></tr>`;
  document.getElementById('tableHead').innerHTML=head;

  // table body
  const display=filteredHabits||habits;
  let body='';
  display.forEach(h=>{
    const cat=CATS[h.cat]||CATS.health;
    const hp=habitPct(h.id), str=habitStreak(h.id), bst=habitBest(h.id);

    if(editingId===h.id){
      body+=`<tr>
        <td class="habit-name" colspan="2">
          <div class="inline-edit-wrap">
            <input id="edit-name-${h.id}" class="inline-edit-name" value="${h.name.replace(/"/g,'&quot;')}"
              onkeydown="if(event.key==='Enter')confirmEdit(${h.id});if(event.key==='Escape')cancelEdit();" />
            ${editCatDD(h.id, h.cat)}
            <button class="btn-confirm" onclick="confirmEdit(${h.id})">✓</button>
            <button class="btn-cancel-inline" onclick="cancelEdit()">✕</button>
          </div>
        </td>`;
      weeks.forEach((w,wi)=>{
        w.forEach(d=>{const done=getCheck(h.id,d);body+=`<td><span class="cb ${done?'done':''}" style="${done?`background:${cat.color};`:''}" onclick="toggleCheck(${h.id},${d})"></span></td>`;});
        if(wi<weeks.length-1)body+=`<td></td>`;
      });
      body+=`<td><div class="prog-wrap"><div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${hp}%;background:${cat.color};"></div></div><span class="pct-text">${hp}%</span></div></td>
        <td class="streak-cell">🔥 ${str}</td><td class="best-cell">🏆 ${bst}</td><td></td></tr>`;
    } else {
      body+=`<tr>
        <td class="habit-name">${h.name}</td>
        <td class="cat-tag"><span class="tag" style="background:${cat.color}2e;color:${cat.color};">${cat.icon||''} ${cat.label}</span></td>`;
      weeks.forEach((w,wi)=>{
        w.forEach(d=>{const done=getCheck(h.id,d);body+=`<td><span class="cb ${done?'done':''}" style="${done?`background:${cat.color};`:''}" onclick="toggleCheck(${h.id},${d})" role="checkbox" aria-checked="${done}"></span></td>`;});
        if(wi<weeks.length-1)body+=`<td class="week-sep"></td>`;
      });
      body+=`<td><div class="prog-wrap"><div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${hp}%;background:${cat.color};"></div></div><span class="pct-text">${hp}%</span></div></td>
        <td class="streak-cell">🔥 ${str}</td>
        <td class="best-cell">🏆 ${bst}</td>
        <td><div class="action-btns">
          <button class="btn-edit" onclick="startEdit(${h.id})" title="Edit">✏️</button>
          <button class="btn-del"  onclick="askDelete(${h.id})" title="Delete">🗑</button>
        </div></td></tr>`;
    }
  });
  document.getElementById('tableBody').innerHTML=body;
}

function changeMonth(dir){
  curMonth+=dir;
  if(curMonth>11){curMonth=0;curYear++;}
  if(curMonth<0) {curMonth=11;curYear--;}
  filteredHabits=null; render();
}

function openModal() {
  document.getElementById('modalBg').classList.add('open');
  document.getElementById('habitInput').focus();
  if(!ddState['ddModalCat'] || !CATS[ddState['ddModalCat']]){
    const c = CATS['sleep'];
    ddState['ddModalCat']='sleep';
    document.getElementById('ddModalCatLabel').textContent = `${c.icon} ${c.label}`;
    renderCatDropdown('ddModalCat',{includeAll:false});
  }
}
function closeModal(){document.getElementById('modalBg').classList.remove('open');document.getElementById('habitInput').value='';}
function addHabit(){
  const name=document.getElementById('habitInput').value.trim();
  const cat=ddState['ddModalCat']||'sleep';
  if(!name)return;
  habits.push({id:Date.now(),name,cat});
  saveData();closeModal();filteredHabits=null;render();
}

function startEdit(hid){editingId=hid;render();const el=document.getElementById('edit-name-'+hid);if(el){el.focus();el.select();}}
function confirmEdit(hid){
  const ne=document.getElementById('edit-name-'+hid);
  if(!ne)return;
  const nm=ne.value.trim();if(!nm)return;
  const h=habits.find(x=>x.id===hid);
  if(h){h.name=nm;h.cat=ddState[`ddEdit${hid}`]||h.cat;}
  editingId=null;saveData();render();
}
function cancelEdit(){editingId=null;render();}

function askDelete(hid){
  deletingId=hid;
  const h=habits.find(x=>x.id===hid);
  document.getElementById('confirmText').textContent=`Delete "${h?h.name:'this habit'}"? All data will be lost.`;
  document.getElementById('confirmBg').classList.add('open');
}
function closeConfirm(){deletingId=null;document.getElementById('confirmBg').classList.remove('open');}
function confirmDelete(){
  if(deletingId===null)return;
  Object.keys(checks).forEach(k=>{const p=k.split('-');if(p.length===4 && p[2]===String(deletingId))delete checks[k];});
  habits=habits.filter(h=>h.id!==deletingId);
  saveData();closeConfirm();filteredHabits=null;render();
}

function openStats(){document.getElementById('statsBg').classList.add('open');renderStatsModal();}
function closeStats(){document.getElementById('statsBg').classList.remove('open');}
function renderStatsModal(){
  const s=currentStreak();
  document.getElementById('statsStreakCurrent').textContent=s+' days';
  document.getElementById('statsStreakLongest').textContent=s+' days';
  document.getElementById('statsTotalHabits').textContent=habits.length;
  document.getElementById('statsOverallCompletion').textContent=monthPct()+'%';
  const weeks=getWeeks(curYear,curMonth);
  const canvas=document.getElementById('weeklyChart');
  if(canvas){
    const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    const data=weeks.map(w=>weekPct(w));
    const barW=(W-40)/data.length-8;
    data.forEach((v,i)=>{
      const x=20+i*(barW+8),bh=(v/100)*(H-30),y=H-20-bh;
      ctx.fillStyle=DONUT_COLORS[i%DONUT_COLORS.length]+'66';
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,barW,bh,4);else ctx.rect(x,y,barW,bh);ctx.fill();
      ctx.fillStyle=DONUT_COLORS[i%DONUT_COLORS.length];
      ctx.fillRect(x,y,barW,3);
      ctx.fillStyle='#94a3b8';ctx.font='10px Inter';ctx.textAlign='center';ctx.fillText(`W${i+1}`,x+barW/2,H-4);
      ctx.fillStyle='#fff';ctx.fillText(v+'%',x+barW/2,y-4);
    });
  }
  document.getElementById('categoryBars').innerHTML=Object.entries(CATS).map(([k,c])=>{
    const hs=habits.filter(h=>h.cat===k);
    const pct=hs.length?Math.round(hs.reduce((s,h)=>s+habitPct(h.id),0)/hs.length):0;
    return `<div class="category-bar"><span class="category-bar-label">${c.label}</span>
      <div class="category-bar-track"><div class="category-bar-fill" style="width:${pct}%;background:${c.color};"></div></div>
      <span style="font-size:0.8rem;color:#94a3b8;min-width:36px">${pct}%</span></div>`;
  }).join('');
  document.getElementById('habitComparison').innerHTML=[...habits].sort((a,b)=>habitPct(b.id)-habitPct(a.id)).slice(0,4).map(h=>{
    const cat=CATS[h.cat]||CATS.health;
    return `<div class="habit-card"><div class="habit-card-label">${cat.label}</div>
      <div class="habit-card-name">${h.name}</div>
      <div style="font-size:1.1rem;font-weight:700;color:${cat.color};margin-top:4px">${habitPct(h.id)}%</div></div>`;
  }).join('');
}

renderAllCatDropdowns();
render();
