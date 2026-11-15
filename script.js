const $=id=>document.getElementById(id);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
let S={days:{},thought:'',letter:null,topics:[]};
try{S=Object.assign(S,JSON.parse(localStorage.getItem('sanctuary')||'{}'))}catch(e){}
S.diary=S.diary||{};
const save=()=>{try{localStorage.setItem('sanctuary',JSON.stringify(S))}catch(e){}};
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 3. The room remembers ---------- */
const realTime=()=>{const h=new Date().getHours();return h>=6&&h<18?'day':'night'};
function setMenu(o){$('themeMenu').hidden=!o;$('themeBtn').setAttribute('aria-expanded',o)}
function applyTime(){const m=S.theme||'auto';document.body.dataset.time=m==='auto'?realTime():m;
  document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.theme===m));
  $('themeName').textContent=m[0].toUpperCase()+m.slice(1)}
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{S.theme=b.dataset.theme;save();applyTime();setMenu(false)});
$('themeBtn').onclick=e=>{e.stopPropagation();setMenu($('themeMenu').hidden)};
document.addEventListener('click',e=>{if(!e.target.closest('.themewrap'))setMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
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
  $('timerCard').classList.toggle('onbreak',phase==='break');
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

/* ---------- 2. Accomplishment jar: pixel bottle, living liquid ---------- */
const jc=$('jar'),jx=jc.getContext('2d'),JW=48,JH=64,CX=24;
const JP={day:{line:'#c9918f',glass:'rgba(255,255,255,.3)',shine:'rgba(255,255,255,.55)',liq:['#cfe4f6','#b4d3ee','#9bc3e6'],top:'#f1f8fe',lid:'#dba07e',lidD:'#b9805f',star:'#ffcf4d',starH:'#fff4b8',bub:'#ffffff'},
 night:{line:'#f6c3d0',glass:'rgba(255,255,255,.1)',shine:'rgba(255,255,255,.3)',liq:['#e37795','#cf6585','#b85d80'],top:'#f7a9bd',lid:'#ee9e86',lidD:'#d98068',star:'#ffe27a',starH:'#fffbe0',bub:'#fff0f3'}};
const still=matchMedia('(prefers-reduced-motion:reduce)').matches;
let jN=0,jShown=null,jStarT=[],jLevel=12,jTarget=12,jSplash=0,lastJ=0;
const jBub=[{x:-6,y:50,v:.25},{x:5,y:44,v:.18},{x:-1,y:54,v:.32}];
const jp=(x,y,c)=>{jx.fillStyle=c;jx.fillRect(Math.round(x),Math.round(y),1,1)};
const jr=(x,y,w,h,c)=>{jx.fillStyle=c;jx.fillRect(x,y,w,h)};
const hw=y=>y<6?-1:y<=12?6:y<=20?Math.min(18,6+Math.round((y-12)*1.5)):y<=55?18:([17,16,14,12,9,5][y-56]??-1);
const SP=['..X..','.XXX.','XXXXX','.XXX.','.X.X.'];
function jstar(cx,cy,c,hl){const ox=Math.round(cx)-2,oy=Math.round(cy)-2;SP.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='X')jp(ox+i,oy+j,i===2&&j===2?hl:c)}))}
function jarDraw(ts){
  const t=still?0:ts/1000,P=JP[document.body.dataset.time]||JP.day;
  jx.clearRect(0,0,JW,JH);
  jLevel+=(jTarget-jLevel)*(still?1:.05);jSplash*=.97;
  const surf=x=>60-jLevel+Math.sin(x*.45+t*2.4)*(.7+jSplash);
  jr(21,1,6,2,P.lid);jr(17,3,14,3,P.lid);jr(17,5,14,1,P.lidD);
  for(let y=6;y<=61;y++){const h=hw(y);if(h<0)continue;
    for(let dx=-h;dx<=h;dx++){const x=CX+dx,ad=Math.abs(dx);
      if(ad===h||hw(y-1)<ad||hw(y+1)<ad){jp(x,y,P.line);continue}
      const s=surf(x);
      if(y>=s){const d=y-s;jp(x,y,d<1?P.top:d<5?P.liq[0]:d<14?P.liq[1]:P.liq[2])}else jp(x,y,P.glass)}}
  jr(10,26,2,18,P.shine);
  jBub.forEach(b=>{if(!still)b.y-=b.v;const x=CX+b.x+Math.round(Math.sin(t*2+b.x));
    if(b.y<surf(x)+2||b.y<22)b.y=56-Math.random()*4;jp(x,b.y,P.bub)});
  for(let i=0;i<Math.min(jN,16);i++){
    const row=Math.floor(i/4),col=i%4,tx=12+col*8,ty=57-row*7-(col%2?3:0),age=(performance.now()-jStarT[i])/1000;
    let x=tx,y=ty;
    if(age<.9){const e=1-Math.pow(1-age/.9,3);x=CX+(tx-CX)*e;y=-3+(ty+3)*e}
    else if(!still){x+=Math.sin(t*.9+i*1.3)*1.4;y+=Math.cos(t*1.1+i*.9)*1.4}
    jstar(x,y,P.star,Math.floor(t*2+i*3)%9===0?'#fff':P.starH);
  }
}
function jarLoop(ts){if($('pJar').classList.contains('open')&&ts-lastJ>80){lastJ=ts;jarDraw(ts)}requestAnimationFrame(jarLoop)}
requestAnimationFrame(jarLoop);
function renderJar(){
  const n=S.days[today()]||0,c=Math.min(n,16);
  if(jShown===null)jStarT=Array.from({length:c},()=>-1e9);
  else for(let i=jShown;i<c;i++){jStarT[i]=performance.now();setTimeout(()=>{jSplash=2.5},850)}
  jShown=c;jN=n;jTarget=n?Math.min(34,12+Math.ceil(c/4)*7):12;
  $('jarText').textContent=n?`${n} star${n>1?'s':''} swimming in your jar today.`:'Finish a focus session and a star will drop in.';
}

/* ---------- 7. Quiet corner: a star in the window for every session ---------- */
let skyN=0,skyInit=false;
const SKY='M4 0h2v2H4zM2 2h6v2H2zM0 4h10v2H0zM2 6h6v2H2zM2 8h2v2H2zM6 8h2v2H6z';
function renderSill(){
  const n=S.days[today()]||0,c=Math.min(n,40);let s='';
  for(let i=0;i<c;i++){const x=Math.round(16+(((i+1)*.618034)%1)*268),y=Math.round(14+(((i+1)*.754877)%1)*98),pop=skyInit&&i>=skyN;
    s+=`<g transform="translate(${x-5} ${y-5})"><path class="sstar${pop?' pop':''}" style="animation-delay:${pop?0:(i%7)*.4}s" d="${SKY}"/></g>`}
  $('skyStars').innerHTML=s;skyN=c;skyInit=true;
  $('itCandle').classList.toggle('on',n>=1);$('itFlower').classList.toggle('on',n>=3);
  $('sill').dataset.l=n>=1?1:0;
  $('sillText').textContent=n?`${n} star${n>1?'s':''} in your window today.`+(n<3?' Three sessions will bloom the flower.':''):'Finish a session to place your first star in the window.';
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

/* ---------- Pixel diary ---------- */
let dDate=today();
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const blank=()=>({goals:[{t:'',d:0},{t:'',d:0},{t:'',d:0}],text:''});
const getE=d=>S.diary[d]||blank();
function putE(fn){const e=S.diary[dDate]||(S.diary[dDate]=blank());fn(e);save();renderDiaryList()}
function renderDiary(){
  const e=getE(dDate),n=S.days[dDate]||0;
  $('dDate').textContent=dDate.replace(/-/g,'.');
  $('dDay').textContent=parse(dDate).toLocaleDateString(undefined,{weekday:'long'});
  $('dStars').textContent=n?`★ ${n} focus session${n>1?'s':''} this day`:'';
  for(let i=0;i<3;i++){$('gt'+i).value=e.goals[i].t;$('gc'+i).checked=!!e.goals[i].d}
  $('dText').value=e.text;$('dNext').disabled=dDate>=today();
  renderDiaryList();
}
function renderDiaryList(){
  const ds=Object.keys(S.diary).filter(d=>{const e=S.diary[d];return e.text||e.goals.some(g=>g.t)}).sort().reverse().slice(0,20);
  $('dList').innerHTML=ds.length?ds.map(d=>{const e=S.diary[d],done=e.goals.filter(g=>g.t&&g.d).length,tot=e.goals.filter(g=>g.t).length;
    return `<button data-d="${d}" class="${d===dDate?'cur':''}">${d.replace(/-/g,'.')}${tot?` &nbsp;✓ ${done}/${tot}`:''}<small>${esc(e.text.slice(0,40))}</small></button>`}).join('')
    :'<p class="muted">Your pages will collect here.</p>';
  $('dList').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{dDate=b.dataset.d;renderDiary()});
}
for(let i=0;i<3;i++){
  $('gt'+i).oninput=e=>putE(x=>x.goals[i].t=e.target.value);
  $('gc'+i).onchange=e=>putE(x=>x.goals[i].d=e.target.checked?1:0);
}
$('dText').oninput=e=>putE(x=>x.text=e.target.value);
$('dPrev').onclick=()=>{const d=parse(dDate);d.setDate(d.getDate()-1);dDate=iso(d);renderDiary()};
$('dNext').onclick=()=>{const d=parse(dDate);d.setDate(d.getDate()+1);dDate=iso(d);renderDiary()};
$('dToday').onclick=()=>{dDate=today();renderDiary()};
const panels={jar:'pJar',sill:'pSill',shelf:'pShelf',letter:'pLetter',diary:'diary'};
function openPanel(k){
  for(const [n,id] of Object.entries(panels)){
    const on=n===k&&!$(id).classList.contains('open');
    $(id).classList.toggle('open',on);
    document.querySelector('[data-panel='+n+']').setAttribute('aria-pressed',on);
    if(on&&n==='diary')renderDiary();
  }
}
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));
$('dClose').onclick=()=>openPanel('diary');
$('diary').onclick=e=>{if(e.target===$('diary'))openPanel('diary')};
document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const [n,id] of Object.entries(panels))if($(id).classList.contains('open'))openPanel(n)});
renderDiary();

/* ---------- A little note ---------- */
if(S.seenNote)$('noteDot').classList.add('seen');
$('noteBtn').onclick=()=>{$('infoModal').classList.add('open');S.seenNote=true;save();$('noteDot').classList.add('seen');$('closeInfo').focus()};
$('closeInfo').onclick=()=>$('infoModal').classList.remove('open');
$('infoModal').onclick=e=>{if(e.target===$('infoModal'))$('infoModal').classList.remove('open')};

setUI();renderNotes();renderJar();renderSill();renderShelf();renderLetter();
