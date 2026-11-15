const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const KEY='lilypond-v1',GOAL=8,MIN={focus:25,break:5,long:15};
let S={};try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
S.stars=S.stars||{};S.diary=S.diary||[];S.books=S.books||[];S.cycles=S.cycles||0;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const day=()=>new Date().toLocaleDateString('en-CA');
const esc=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
let mode='focus',left=MIN.focus*60,total=left,end=0,timer=null;

/* popups */
function openTool(id){if(id==='d-thought')ask('What were you in the middle of? Future-you will thank you.',()=>{});else{render();$('#'+id).showModal();}}
$$('[data-open]').forEach(b=>b.onclick=()=>openTool(b.dataset.open));
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-close]'))d.close()}));
function ask(msg,after){$('#dlgMsg').textContent=msg;$('#prevThought').textContent=S.thought?'Your last note: '+S.thought:'';
  $('#thought').value='';const d=$('#d-thought');d.returnValue='';d.showModal();
  d.onclose=()=>{const v=$('#thought').value.trim();if(d.returnValue==='save'&&v){S.thought=v;save();}after();render();};}

/* timer */
function paint(){$('#clock').textContent=fmt(left);document.title=(timer?fmt(left)+' · ':'')+'By the Lily Pad ♡';
  const brk=mode!=='focus',p=brk?Math.min(1,1-left/total):0;
  $('#liquid').setAttribute('fill',p<.5?'#C9763D':p<.85?'#B98A5E':'#9aa7b8');
  $('#steam').style.opacity=brk?Math.max(0,1-p*1.3):1;
  $('#teaTxt').textContent=!brk?'Your cup is waiting. Start a tea break to watch it cool.':p>=1?'Your tea is finished ♡':p<.35?'Your tea is steaming hot':p<.7?'Your tea is warm and cozy':'Your tea is cooling down…';
  $('#teaTime').textContent=brk?fmt(left)+' left on your break':'';
  $('#b-tea').classList.toggle('live',brk&&!!timer);
  const idle=!timer&&left===total;$('#go').textContent=timer?'Running ♡':idle?'Start ♡':'Resume ♡';$('#go').disabled=!!timer;$('#pause').disabled=!timer;$('#stop').disabled=idle;}
function setMode(m){clearInterval(timer);timer=null;mode=m;left=total=MIN[m]*60;
  $$('.mode').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m));paint();}
$$('.mode').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
$('#go').onclick=()=>{if(timer)return;end=Date.now()+left*1000;timer=setInterval(tick,500);paint();};
$('#pause').onclick=()=>{if(!timer)return;clearInterval(timer);timer=null;paint();};
function tick(){left=Math.max(0,Math.round((end-Date.now())/1000));paint();if(left<=0)finish();}
function finish(){clearInterval(timer);timer=null;
  if(mode==='focus'){const d=day();S.stars[d]=(S.stars[d]||0)+1;S.cycles++;save();
    ask('Star added to your meter! What were you in the middle of?',()=>setMode(S.cycles%4===0?'long':'break'));}
  else setMode('focus');}
$('#stop').onclick=()=>{if(mode==='focus'&&total-left>60){clearInterval(timer);timer=null;ask('Stopping early is okay. What were you doing?',()=>setMode('focus'));}else setMode(mode);};

/* render */
function render(){
  const n=S.stars[day()]||0,f=Math.min(n,GOAL);
  $('#today').textContent=n?`Today: ${n} little star${n>1?'s':''} ✨`:'Your meter is waiting for its first star.';
  $('#meter').innerHTML=Array.from({length:GOAL},(_,i)=>`<i class="seg${i<f?' on':''}"></i>`).join('');
  $('#meterTxt').textContent=`${n} of ${GOAL} stars · ${Math.round(f/GOAL*100)}%`;
  $('#hist').innerHTML=Object.keys(S.stars).sort().reverse().slice(0,7).map(d=>`<div class="hrow"><small>${d}</small><div class="mini"><b style="width:${Math.min(100,S.stars[d]/GOAL*100)}%"></b></div><span>${S.stars[d]}</span></div>`).join('');
  $('#thoughtNote').hidden=!S.thought;$('#thoughtText').textContent=S.thought||'';
  const L=S.letter,show=!!(L&&L.date<day()&&!L.read);$('#letterNote').hidden=!show;if(show)$('#letterText').textContent=L.text;
  $('[data-open=d-letter]').classList.toggle('new',show);
  $('#dDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  $('#dList').innerHTML=S.diary.length?S.diary.map(e=>`<div class="entry"><small>${esc(e.d)}</small>${esc(e.t)}</div>`).join(''):'<p class="entry">No pages yet. Your first entry will land here.</p>';
  const now=Date.now();
  $('#books').innerHTML=S.books.length?S.books.map((b,i)=>{const dd=Math.floor((now-b.last)/864e5);
    return `<div class="book"><button class="xb" data-del="${i}" aria-label="Remove ${esc(b.name)}">×</button><b>${esc(b.name)}</b><span>${dd?dd+'d untouched':'fresh today'}</span><div class="dust" style="opacity:${Math.min(1,dd/10).toFixed(2)}"></div><button data-dust="${i}">Dust off ✨</button></div>`}).join(''):'<p class="sub">Your shelf is empty. Add a topic to come back to.</p>';}
/* diary, letter, shelf */
$('#dSave').onclick=()=>{const t=$('#dText').value.trim();if(!t)return;S.diary.unshift({d:new Date().toLocaleString(),t});$('#dText').value='';save();render();};
$('#lSave').onclick=()=>{const t=$('#lText').value.trim();if(!t)return;S.letter={text:t,date:day(),read:false};$('#lText').value='';save();$('#lMsg').textContent='Sealed. It will be waiting for you tomorrow ♡';};
$('#letterOk').onclick=()=>{S.letter.read=true;save();render();};
$('#bAdd').onclick=()=>{const v=$('#bIn').value.trim();if(!v)return;S.books.push({name:v,last:Date.now()});$('#bIn').value='';save();render();};
$('#bIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('#bAdd').click()});
$('#books').onclick=e=>{const t=e.target;if(t.dataset.dust!==undefined){S.books[t.dataset.dust].last=Date.now();save();render();}
  if(t.dataset.del!==undefined){S.books.splice(t.dataset.del,1);save();render();}};
/* backgrounds: gradient themes that change the whole page */
const THEMES=[
  {name:'Twilight pond',g:['#F8E6D6','#F4C1BB','#DAC2CA','#F9D3C4','#9ACAF2']},
  {name:'Rose dusk',g:['#b24a8f','#e58a6a','#4a2252']},
  {name:'Mint moon',g:['#2f8f86','#4a6fb5','#17304f']},
  {name:'Lavender night',g:['#2E1A47','#5C3A8B','#8B5CB8','#B88BD4','#D4B8E8']}];
S.themeId=S.themeId||0;
function applyTheme(){const t=THEMES[S.themeId]||THEMES[0],r=document.documentElement.style;r.setProperty('--g1',t.g[0]);r.setProperty('--g2',t.g[1]);r.setProperty('--g3',t.g[2]);}
function drawThemes(){$('#themes').innerHTML=THEMES.map((t,i)=>`<button class="theme${S.themeId===i?' on':''}" data-th="${i}" aria-label="${esc(t.name)}" title="${esc(t.name)}" style="background:linear-gradient(160deg,${t.g[0]},${t.g[1]} 60%,${t.g[2]})"></button>`).join('');}
$('#themes').onclick=e=>{const b=e.target.closest('[data-th]');if(!b)return;S.themeId=+b.dataset.th;save();applyTheme();drawThemes();};
applyTheme();drawThemes();
paint();render();
