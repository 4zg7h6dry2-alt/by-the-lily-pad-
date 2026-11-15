const $=id=>document.getElementById(id);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
let S={days:{},thought:'',letter:null,topics:[]};
try{S=Object.assign(S,JSON.parse(localStorage.getItem('sanctuary')||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem('sanctuary',JSON.stringify(S))}catch(e){}};
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 3. The room remembers ---------- */
const times=['morning','afternoon','evening','night'];
let override=null;
function realTime(){const h=new Date().getHours();return h>=5&&h<12?'morning':h<17?'afternoon':h<20?'evening':'night'}
function applyTime(){const t=override||realTime();document.body.dataset.time=t;$('timeBtn').textContent=(override?'Previewing: ':'Room: ')+t}
$('timeBtn').onclick=()=>{const cur=override||realTime();const n=times[(times.indexOf(cur)+1)%4];override=(n===realTime()&&!override&&false)?null:n;applyTime()};
$('timeBtn').ondblclick=()=>{override=null;applyTime()};
applyTime();setInterval(applyTime,60000);

/* ---------- Timer ---------- */
let phase='idle',endAt=0,left=0,running=false,tick=null;
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
const mins=id=>Math.max(1,Math.min(120,+$(id).value||25));
function setUI(){
  $('go').hidden=phase!=='idle';$('pause').hidden=phase==='idle';$('stop').hidden=phase==='idle';
  $('pause').textContent=running?'Pause':'Resume';
  $('mode').textContent={idle:'Ready when you are',focus:'Focus time',break:'Break time. Sip your tea.'}[phase];
  $('tea').style.display=phase==='break'?'block':'none';
  $('clock').textContent=fmt(phase==='idle'?mins('fMin')*60:left);
  document.title=phase==='idle'?'Study Sanctuary':fmt(left)+' · '+(phase==='focus'?'Focus':'Break');
}
function begin(p){phase=p;left=mins(p==='focus'?'fMin':'bMin')*60;run();renderNotes()}
function run(){running=true;endAt=Date.now()+left*1000;clearInterval(tick);tick=setInterval(step,250);setUI();updateTea()}
function step(){left=Math.max(0,(endAt-Date.now())/1000);
  if(left<=0){clearInterval(tick);running=false;done();return}
  $('clock').textContent=fmt(left);document.title=fmt(left)+' · '+(phase==='focus'?'Focus':'Break');
  if(phase==='break')updateTea()}
function done(){
  try{new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=').play()}catch(e){}
  if(phase==='focus'){S.days[today()]=(S.days[today()]||0)+1;save();renderJar();renderSill();askThought(()=>begin('break'))}
  else{phase='idle';setUI()}
}
$('go').onclick=()=>begin('focus');
$('pause').onclick=()=>{if(running){clearInterval(tick);running=false;left=Math.max(0,(endAt-Date.now())/1000);setUI()}else run()};
$('stop').onclick=()=>{clearInterval(tick);running=false;const was=phase;phase='idle';setUI();if(was==='focus')askThought(()=>{})};

/* ---------- 1. The last thought ---------- */
let afterThought=null;
function askThought(cb){afterThought=cb;$('thoughtIn').value='';$('modal').classList.add('open');$('thoughtIn').focus()}
function closeThought(){$('modal').classList.remove('open');const cb=afterThought;afterThought=null;renderNotes();cb&&cb()}
$('saveThought').onclick=()=>{const v=$('thoughtIn').value.trim();if(v){S.thought=v;save()}closeThought()};
$('skipThought').onclick=closeThought;

function renderNotes(){
  let h='';
  if(S.thought&&phase!=='break')h+=`<div class="note"><b>Where you left off</b><p style="margin:4px 0 6px">${esc(S.thought)}</p><button class="ghost" id="clearThought" style="padding:3px 10px;font-size:.8rem">Got it</button></div>`;
  const L=S.letter;
  if(L&&L.written<today())h+=`<div class="note"><b>A letter from ${L.written}</b><p style="margin:4px 0 6px">${esc(L.text)}</p><button class="ghost" id="clearLetter" style="padding:3px 10px;font-size:.8rem">Tuck it away</button></div>`;
  $('notes').innerHTML=h;
  if($('clearThought'))$('clearThought').onclick=()=>{S.thought='';save();renderNotes()};
  if($('clearLetter'))$('clearLetter').onclick=()=>{S.letter=null;save();renderNotes();renderLetter()};
}

/* ---------- 2. Accomplishment jar ---------- */
function renderJar(){
  const n=S.days[today()]||0;
  let s='<path d="M38 20h44v10c14 6 22 18 22 36v50c0 14-10 22-24 22H40c-14 0-24-8-24-22V66c0-18 8-30 22-36z" style="fill:var(--jarfill);stroke:var(--line)" stroke-width="3"/><rect x="34" y="10" width="52" height="12" rx="4" fill="#a15b7e"/>';
  const cols=5,shown=Math.min(n,30);
  for(let i=0;i<shown;i++){const r=Math.floor(i/cols),c=i%cols;
    const x=30+c*15+(r%2?6:0),y=130-r*14;
    s+=`<path transform="translate(${x} ${y}) scale(.55)" d="M0-10l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#f2b84b" style="filter:drop-shadow(0 0 3px #f6d28b)"/>`}
  $('jar').innerHTML=s;
  $('jarText').textContent=n?`${n} star${n>1?'s':''} today. Nice and steady.`:'Finish a focus session to add your first star.';
}

/* ---------- 7. Quiet achievement ---------- */
function renderSill(){
  const n=S.days[today()]||0;
  $('itCandle').classList.toggle('on',n>=1);$('itFlower').classList.toggle('on',n>=3);$('itStar').classList.toggle('on',n>=5);
  $('sill').dataset.l=n>=1?1:0;
  $('sillText').textContent=n>=5?'A star has appeared in your window.':n>=3?'Your flower has bloomed.':n>=1?'A candle is glowing.':'Complete sessions and this corner comes alive: a candle (1), a flower (3), a window star (5).';
}

/* ---------- 5. Tea temperature ---------- */
function updateTea(){
  const total=mins('bMin')*60,f=Math.max(0,Math.min(1,left/total));
  $('liquid').setAttribute('y',42+(1-f)*34);
  const hot=[192,112,58],cool=[222,190,170];
  $('liquid').setAttribute('fill',`rgb(${hot.map((h,i)=>Math.round(cool[i]+(h-cool[i])*f)).join()})`);
  $('steam').style.opacity=f>.15?f:0;
  $('teaText').textContent=f>.66?'Piping hot':f>.33?'Pleasantly warm':f>0?'Cooling down':'Finished. Your tea is gone.';
}

/* ---------- 6. Forgotten bookshelf ---------- */
function renderShelf(){
  const now=Date.now();
  $('shelf').innerHTML=S.topics.length?S.topics.map((t,i)=>{
    const days=Math.floor((now-t.last)/864e5),dust=Math.min(1,days/10);
    return `<div class="topic"><div class="dust" style="opacity:${dust}"></div><span>${esc(t.name)}<small>${days<1?'fresh today':days+' day'+(days>1?'s':'')+' since you opened it'}</small></span>
    <span><button data-d="${i}">Dust off</button> <button class="ghost" data-x="${i}" aria-label="Remove ${esc(t.name)}">×</button></span></div>`}).join('')
    :'<p class="muted">Add subjects you want to return to. They gather dust if you leave them too long.</p>';
  $('shelf').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.topics[+b.dataset.d].last=Date.now();save();renderShelf()});
  $('shelf').querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{S.topics.splice(+b.dataset.x,1);save();renderShelf()});
}
function addTopic(){const v=$('topicIn').value.trim();if(!v)return;S.topics.push({name:v,last:Date.now()});$('topicIn').value='';save();renderShelf()}
$('addTopic').onclick=addTopic;$('topicIn').onkeydown=e=>{if(e.key==='Enter')addTopic()};

/* ---------- 4. Letter to tomorrow ---------- */
function renderLetter(){
  const L=S.letter;
  $('letterOut').innerHTML=L&&L.written===today()?'<p class="muted">Your letter is sealed. It will appear tomorrow.</p>':'';
}
$('saveLetter').onclick=()=>{const v=$('letterIn').value.trim();if(!v)return;S.letter={text:v,written:today()};save();$('letterIn').value='';renderLetter();$('letterMsg').textContent='Sealed.';setTimeout(()=>$('letterMsg').textContent='',2500)};

/* ---------- A little note ---------- */
if(S.seenNote)$('noteDot').classList.add('seen');
$('noteBtn').onclick=()=>{$('infoModal').classList.add('open');S.seenNote=true;save();$('noteDot').classList.add('seen');$('closeInfo').focus()};
$('closeInfo').onclick=()=>$('infoModal').classList.remove('open');
$('infoModal').onclick=e=>{if(e.target===$('infoModal'))$('infoModal').classList.remove('open')};

setUI();renderNotes();renderJar();renderSill();renderShelf();renderLetter();
