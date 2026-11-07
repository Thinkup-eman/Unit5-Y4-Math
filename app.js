(function(){
'use strict';
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[rnd(0,a.length-1)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const T=(h,m=0)=>h*60+m, p2=n=>String(n).padStart(2,'0');
const d24=t=>{t=((t%1440)+1440)%1440;return p2(Math.floor(t/60))+':'+p2(t%60)};
const d12=t=>{t=((t%1440)+1440)%1440;const h=Math.floor(t/60),m=t%60;return ((h%12)||12)+':'+p2(m)+' '+(h<12?'a.m.':'p.m.')};
const ap=t=>((t%1440)<720?'a.m.':'p.m.');
const hm=n=>{const h=Math.floor(n/60),m=n%60,o=[];if(h)o.push(h+(h===1?' hour':' hours'));if(m||!h)o.push(m+(m===1?' minute':' minutes'));return o.join(' ')};
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const NS='http://www.w3.org/2000/svg';

/* ---------- answer parsing ---------- */
function parseTime(v){ // returns {t, padded}
  v=String(v).trim().replace(/[.\s]/g,':').replace(/:+/g,':');
  if(/^\d{4}$/.test(v))v=v.slice(0,2)+':'+v.slice(2);
  const m=/^(\d{1,2}):(\d{2})$/.exec(v);if(!m)return null;
  return {t:T(+m[1],+m[2]),padded:m[1].length===2};
}
const num=v=>{v=String(v).trim().replace(/,/g,'');return /^-?\d+(\.\d+)?$/.test(v)?Number(v):NaN};

/* ---------- question building blocks ---------- */
function inputs(box,spec){ // spec: [{id,label,suffix,w}]
  const row=document.createElement('div');row.className='row';const refs={};
  spec.forEach(s=>{
    if(s.label){const l=document.createElement('label');l.textContent=s.label;row.appendChild(l)}
    const i=document.createElement('input');i.type='text';i.inputMode=s.mode||'text';i.autocomplete='off';i.setAttribute('aria-label',s.aria||s.label||'answer');
    if(s.w)i.style.width=s.w;refs[s.id]=i;row.appendChild(i);
    if(s.suffix){const x=document.createElement('span');x.textContent=s.suffix;row.appendChild(x)}
  });
  box.appendChild(row);return refs;
}
function choices(box,opts,answer){
  const wrap=document.createElement('div');wrap.className='opts';let sel=null;const btns=[];
  opts.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='opt';b.textContent=o;
    b.onclick=()=>{if(b.disabled)return;btns.forEach(x=>x.classList.remove('sel'));b.classList.add('sel');sel=o};
    wrap.appendChild(b);btns.push(b)});
  box.appendChild(wrap);
  return {btns,get:()=>sel,lock:()=>btns.forEach(b=>{b.disabled=true;if(b.textContent===answer)b.classList.add('right')}),reveal:()=>btns.forEach(b=>{if(b.textContent===answer)b.classList.add('right')})};
}

/* ---------- Unit 5 components ---------- */
const PAL=['#1F7A7A','#E0A21B','#C8452F','#6A5ACD','#2E8B57','#D2691E'];
const sample=(a,n)=>shuffle(a).slice(0,n);
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function sorter(box,items,kind,labels,opt){opt=opt||{};
  const st={sel:null,locked:false};
  const wrap=document.createElement('div');wrap.className='sorter';
  const pool=document.createElement('div');pool.className='pool';
  const chips=items.map(it=>{const c=document.createElement('button');c.type='button';c.className='chip';c.textContent=it.t;c._z=it.z;c._at=null;
    c.onclick=e=>{e.stopPropagation();if(st.locked)return;if(st.sel&&st.sel!==c&&c._at){move(st.sel,c._at);return}st.sel=(st.sel===c?null:c);chips.forEach(x=>x.classList.toggle('sel',x===st.sel))};return c});
  const zoneEls={};
  const mkZone=id=>{const d=document.createElement('div');d.className='zone';d.dataset.z=id;d.onclick=()=>{if(st.locked||!st.sel)return;move(st.sel,id)};zoneEls[id]=d;return d};
  function move(c,id){c._at=id;(id?zoneEls[id]:pool).appendChild(c);st.sel=null;chips.forEach(x=>x.classList.remove('sel'))}
  let dia;
  if(kind==='venn'){
    dia=document.createElement('div');dia.className='venn';
    dia.innerHTML='<svg viewBox="0 0 360 230" aria-hidden="true"><rect x="2" y="2" width="356" height="226" rx="14" fill="none" stroke="var(--ink)" stroke-width="2.5"/><circle cx="135" cy="118" r="90" fill="#1F7A7A" fill-opacity=".14" stroke="#1F7A7A" stroke-width="3"/><circle cx="225" cy="118" r="90" fill="#E0A21B" fill-opacity=".18" stroke="#E0A21B" stroke-width="3"/><text x="60" y="20" font-size="13" font-weight="800" fill="#1F7A7A" text-anchor="middle">'+esc(labels[0])+'</text><text x="300" y="20" font-size="13" font-weight="800" fill="#B07F0F" text-anchor="middle">'+esc(labels[1])+'</text></svg>';
    [['A',12.5],['AB',37.5],['B',62.5]].forEach(([id,l])=>{const z=mkZone(id);z.style.left=l+'%';z.style.width='25%';z.style.top='25%';z.style.height='60%';dia.appendChild(z)});
  }else{
    dia=document.createElement('table');dia.className='carroll';
    const [cl,rl]=labels;let h='<tr><th></th><th>'+esc(cl[0])+'</th><th>'+esc(cl[1])+'</th></tr>';
    dia.innerHTML=h+'<tr><th>'+esc(rl[0])+'</th><td data-c="00"></td><td data-c="01"></td></tr><tr><th>'+esc(rl[1])+'</th><td data-c="10"></td><td data-c="11"></td></tr>';
    ['00','01','10','11'].forEach(id=>{const td=dia.querySelector('[data-c="'+id+'"]');const z=mkZone(id);td.appendChild(z)});
  }
  wrap.append(dia);
  let out=null;
  if(kind==='venn'){out=mkZone('O');out.classList.add('out');const l=document.createElement('div');l.className='outl';l.textContent='Outside both circles';out.before&&0;const ow=document.createElement('div');ow.className='outwrap';ow.append(l,out);wrap.append(ow)}
  pool.onclick=()=>{if(st.locked||!st.sel)return;move(st.sel,null)};
  if(!opt.fixed){const pl=document.createElement('div');pl.className='hint';pl.textContent='Tap a card, then tap the place where it goes. Tap a card again to take it back.';wrap.append(pl);chips.forEach(c=>pool.appendChild(c));wrap.append(pool)}
  else chips.forEach(c=>move(c,c._z));
  box.append(wrap);
  return{check:()=>chips.every(c=>c._at===c._z),placed:()=>chips.filter(c=>c._at!==null).length,total:chips.length,auto:()=>chips.forEach(c=>move(c,c._z)),lock:()=>{st.locked=true;chips.forEach(c=>c.disabled=true)}};
}
function tallySVG(n){const g=Math.floor(n/5),r=n%5;const w=g*44+r*9+4;let s='<svg class="tally" viewBox="0 0 '+Math.max(w,12)+' 34" width="'+Math.max(w,12)+'" height="34" role="img" aria-label="tally">';let x=4;
  for(let i=0;i<g;i++){for(let k=0;k<4;k++)s+='<line x1="'+(x+k*8)+'" y1="4" x2="'+(x+k*8)+'" y2="30"/>';s+='<line x1="'+(x-3)+'" y1="25" x2="'+(x+34)+'" y2="9"/>';x+=44}
  for(let k=0;k<r;k++)s+='<line x1="'+(x+k*9)+'" y1="4" x2="'+(x+k*9)+'" y2="30"/>';return s+'</svg>'}
function tallyTable(cats,vals,o){o=o||{};return '<div class="tbl"><table class="dt"><tr><th>'+(o.head||'')+'</th><th>Tally</th>'+(o.freq?'<th>Frequency</th>':'')+'</tr>'+cats.map((c,i)=>'<tr><td>'+esc(c)+'</td><td>'+tallySVG(vals[i])+'</td>'+(o.freq?'<td>'+(o.hide===i?'?':vals[i])+'</td>':'')+'</tr>').join('')+'</table></div>'}
function barSVG(cats,vals,o){const W=360,H=230,L=36,B=40,T=14,pw=W-L-8,ph=H-B-T,n=cats.length,bw=Math.min(46,pw/n*.6);
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="bar chart">';
  for(let v=0;v<=o.max;v+=o.step){const y=T+ph*(1-v/o.max);s+='<line x1="'+L+'" y1="'+y+'" x2="'+(W-8)+'" y2="'+y+'" stroke="var(--ink)" stroke-opacity="'+(v?0.2:0.9)+'" stroke-width="'+(v?1:2)+'"/><text x="'+(L-5)+'" y="'+(y+4)+'" font-size="11" text-anchor="end" fill="var(--ink)">'+v+'</text>'}
  cats.forEach((c,i)=>{const cx=L+pw/n*(i+.5),h=ph*vals[i]/o.max;s+='<rect x="'+(cx-bw/2)+'" y="'+(T+ph-h)+'" width="'+bw+'" height="'+h+'" fill="'+(o.col||PAL[i%PAL.length])+'" stroke="var(--ink)" stroke-width="1.5"/>'+(o.labels?'<text x="'+cx+'" y="'+(T+ph-h-4)+'" font-size="11" font-weight="800" text-anchor="middle" fill="var(--ink)">'+vals[i]+'</text>':'')+'<text x="'+cx+'" y="'+(H-B+15)+'" font-size="11" text-anchor="middle" fill="var(--ink)">'+esc(c)+'</text>'});
  if(o.title)s+='<text x="'+(W/2)+'" y="'+(H-4)+'" font-size="11" font-weight="800" text-anchor="middle" fill="var(--ink)">'+esc(o.title)+'</text>';
  return s+'</svg>'}
function dotSVG(vals,lo,hi){const W=360,cnt={};vals.forEach(v=>cnt[v]=(cnt[v]||0)+1);const mx=Math.max(...Object.values(cnt)),H=30+mx*17+26,L=20,pw=W-2*L,n=hi-lo+1;
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="dot plot"><line x1="'+L+'" y1="'+(H-26)+'" x2="'+(W-L)+'" y2="'+(H-26)+'" stroke="var(--ink)" stroke-width="2"/>';
  for(let v=lo;v<=hi;v++){const x=L+pw/(n-1)*(v-lo);s+='<line x1="'+x+'" y1="'+(H-26)+'" x2="'+x+'" y2="'+(H-20)+'" stroke="var(--ink)" stroke-width="2"/><text x="'+x+'" y="'+(H-6)+'" font-size="12" font-weight="800" text-anchor="middle" fill="var(--ink)">'+v+'</text>';
    for(let k=0;k<(cnt[v]||0);k++)s+='<circle cx="'+x+'" cy="'+(H-26-9-k*17)+'" r="7" fill="#C8452F" stroke="var(--ink)" stroke-width="1"/>'}
  return s+'</svg>'}
function picto(cats,vals,icon,per){return '<div class="tbl"><table class="dt pic">'+cats.map((c,i)=>{const w=Math.floor(vals[i]/per),h=(vals[i]%per)?1:0;return '<tr><td>'+esc(c)+'</td><td class="ic">'+Array(w).fill(icon).join('')+(h?'<span class="half">'+icon+'</span>':'')+'</td></tr>'}).join('')+'</table><div class="hint">Key: '+icon+' = '+per+' children'+(per>1?'; half '+icon+' = '+(per/2):'')+'</div></div>'}
function tallyBuilder(box,cats){const cnt=cats.map(()=>0);const wrap=document.createElement('div');wrap.className='tb2';
  const rows=cats.map((c,i)=>{const r=document.createElement('div');r.className='trow';r.innerHTML='<b>'+esc(c)+'</b>';const m=mkbtn2('−',()=>{if(cnt[i]>0){cnt[i]--;upd()}});const p=mkbtn2('+',()=>{if(cnt[i]<30){cnt[i]++;upd()}});const n=document.createElement('span');n.className='tn';const t=document.createElement('span');t.className='tt';r.append(m,n,p,t);wrap.append(r);return{n,t,m,p}});
  function upd(){rows.forEach((r,i)=>{r.n.textContent=cnt[i];r.t.innerHTML=tallySVG(cnt[i])})}upd();box.append(wrap);
  return{get:()=>cnt.slice(),set:v=>{v.forEach((x,i)=>cnt[i]=x);upd()},lock:()=>rows.forEach(r=>{r.m.disabled=r.p.disabled=true})}}
function mkbtn2(t,fn){const b=document.createElement('button');b.type='button';b.className='sm';b.textContent=t;b.onclick=fn;return b}
function barBuilder(box,cats,target,max,step){const vals=cats.map(()=>0);const wrap=document.createElement('div');const ch=document.createElement('div');ch.className='chartbox';const ctr=document.createElement('div');ctr.className='bctr';
  const cells=cats.map((c,i)=>{const d=document.createElement('div');d.className='bc';const n=document.createElement('span');n.className='tn';d.append(Object.assign(document.createElement('b'),{textContent:c}),mkbtn2('−',()=>{if(vals[i]>0){vals[i]--;draw()}}),n,mkbtn2('+',()=>{if(vals[i]<max){vals[i]++;draw()}}));ctr.append(d);return{n,d}});
  function draw(){ch.innerHTML=barSVG(cats,vals,{max,step});cells.forEach((c,i)=>c.n.textContent=vals[i])}draw();wrap.append(ch,ctr);box.append(wrap);
  return{get:()=>vals.slice(),set:v=>{v.forEach((x,i)=>vals[i]=x);draw()},lock:()=>wrap.querySelectorAll('button').forEach(b=>b.disabled=true)}}
const eqArr=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);

/* ---------- the questions ---------- */
const SECTIONS=[
 {id:'sort',title:'Sort It!',sub:'Venn and Carroll diagrams. Tap a card, then tap where it goes.'},
 {id:'tally',title:'Tally Time',sub:'Tally charts and frequency tables. Count in groups of 5.'},
 {id:'bar',title:'Chart Maker',sub:'Bar charts, scales and pictograms.'},
 {id:'cmp',title:'Data Detective',sub:'Dot plots, frequency tables and comparing data.'}
];
const QS=[];const add=(sec,gen,tag)=>QS.push({sec,gen,tag});
const PAIRS=[[['Multiple of 5',n=>n%5===0],['Even',n=>n%2===0]],[['Multiple of 3',n=>n%3===0],['Odd',n=>n%2===1]],[['Multiple of 2',n=>n%2===0],['More than 10',n=>n>10]],[['Multiple of 4',n=>n%4===0],['More than 15',n=>n>15]]];
const zoneOf=(a,b,n)=>a(n)&&b(n)?'AB':a(n)?'A':b(n)?'B':'O';
function vennNums(){for(;;){const p=pick(PAIRS),ns=sample(Array.from({length:30},(_,i)=>i+1),8),zs=ns.map(n=>zoneOf(p[0][1],p[1][1],n));if(['A','B','AB','O'].every(z=>zs.includes(z)))return{p,ns,zs}}}
/* A. sort */
add('sort',()=>{const{p,ns}=vennNums();return{prompt:'Sort these numbers into the Venn diagram: <b>'+ns.join(', ')+'</b>. A number that fits both rules goes in the middle.',
  render(b){this.s=sorter(b,ns.map(n=>({t:String(n),z:zoneOf(p[0][1],p[1][1],n)})),'venn',[p[0][0],p[1][0]])},
  check(){const s=this.s;return s.check()?{ok:true}:{ok:false,hint:s.placed()<s.total?'Put every number in the diagram first.':'Read both rules for each number. Ask: is it '+p[0][0].toLowerCase()+'? Is it '+p[1][0].toLowerCase()+'? Both = middle, neither = outside.'}},
  answer:'Left only: '+ns.filter(n=>zoneOf(p[0][1],p[1][1],n)==='A').join(', ')+' · Middle: '+ns.filter(n=>zoneOf(p[0][1],p[1][1],n)==='AB').join(', ')+' · Right only: '+ns.filter(n=>zoneOf(p[0][1],p[1][1],n)==='B').join(', ')+' · Outside: '+ns.filter(n=>zoneOf(p[0][1],p[1][1],n)==='O').join(', '),
  lock(){this.s.lock()},auto(){this.s.auto()}}});
add('sort',()=>{const ns=sample(Array.from({length:20},(_,i)=>i+1),8);
  const zo=n=>(n<10?'0':'1')+(n%2?'0':'1');/* row: <10 / >=10 ; col: odd / even */
  const need=['00','01','10','11'];if(!need.every(z=>ns.some(n=>zo(n)===z))){return QS[1].gen()}
  return{prompt:'Sort these numbers into the Carroll diagram: <b>'+ns.join(', ')+'</b>. Each number goes in exactly one box.',
  render(b){this.s=sorter(b,ns.map(n=>({t:String(n),z:zo(n)})),'carroll',[['Odd','Even'],['Less than 10','10 or more']])},
  check(){const s=this.s;return s.check()?{ok:true}:{ok:false,hint:s.placed()<s.total?'Put every number in the diagram first.':'Check two things for each number: odd or even? Less than 10, or 10 or more?'}},
  answer:'Odd and less than 10: '+ns.filter(n=>zo(n)==='00').join(', ')+' · Even and less than 10: '+ns.filter(n=>zo(n)==='01').join(', ')+' · Odd and 10 or more: '+ns.filter(n=>zo(n)==='10').join(', ')+' · Even and 10 or more: '+ns.filter(n=>zo(n)==='11').join(', '),
  lock(){this.s.lock()},auto(){this.s.auto()}}});
add('sort',()=>{const sp=[['football','00'],['basketball','00'],['rugby','01'],['hockey','01'],['tennis','10'],['golf','10'],['swimming','11'],['running','11']];
  return{prompt:'Sort these sports into the Carroll diagram: <b>'+sp.map(x=>x[0]).join(', ')+'</b>. Each sport goes in exactly one box.',
  render(b){this.s=sorter(b,shuffle(sp).map(x=>({t:x[0],z:x[1]})),'carroll',[['Uses a round ball','No round ball'],['Team sport','Not a team sport']])},
  check(){const s=this.s;return s.check()?{ok:true}:{ok:false,hint:s.placed()<s.total?'Put every sport in the diagram first.':'Ask two questions for each sport: is it a team sport? Does it use a round ball? (Rugby and hockey do not use a round ball.)'}},
  answer:'Team + round ball: football, basketball · Team + no round ball: rugby, hockey · Not team + round ball: tennis, golf · Neither: swimming, running',
  lock(){this.s.lock()},auto(){this.s.auto()}}});
add('sort',()=>{const sh=[['square','AB'],['rectangle','AB'],['rhombus','A'],['kite','A'],['right-angled triangle','B'],['equilateral triangle','O'],['pentagon','O'],['hexagon','O']];
  return{prompt:'Sort these shapes into the Venn diagram: <b>'+sh.map(x=>x[0]).join(', ')+'</b>.',
  render(b){this.s=sorter(b,shuffle(sh).map(x=>({t:x[0],z:x[1]})),'venn',['Has 4 sides','Has a right angle'])},
  check(){const s=this.s;return s.check()?{ok:true}:{ok:false,hint:s.placed()<s.total?'Put every shape in the diagram first.':'A rhombus and a kite have 4 sides but no right angle. A right-angled triangle has a right angle but only 3 sides.'}},
  answer:'Middle: square, rectangle · 4 sides only: rhombus, kite · Right angle only: right-angled triangle · Outside: equilateral triangle, pentagon, hexagon',
  lock(){this.s.lock()},auto(){this.s.auto()}}});
add('sort',()=>{const{p,ns,zs}=vennNums();const mid=zs.filter(z=>z==='AB').length,out=zs.filter(z=>z==='O').length,inA=zs.filter(z=>z==='A'||z==='AB').length;
  return{prompt:'Look at the Venn diagram. a) How many numbers are in <b>both</b> circles (the middle)? b) How many numbers are in the “'+p[0][0]+'” circle altogether? c) How many numbers are <b>outside</b> both circles?',
  render(b){const d=document.createElement('div');b.append(d);sorter(d,ns.map(n=>({t:String(n),z:zoneOf(p[0][1],p[1][1],n)})),'venn',[p[0][0],p[1][0]],{fixed:true});this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'},{id:'c',label:'c)',mode:'numeric',w:'4em'}])},
  check(){const a=num(this.r.a.value)===mid,bb=num(this.r.b.value)===inA,c=num(this.r.c.value)===out;return a&&bb&&c?{ok:true}:{ok:false,hint:(!a?'The middle is where the two circles overlap. ':'')+(!bb?'Count the left circle AND the middle: the whole circle. ':'')+(!c?'Outside = in the box but not in a circle.':'')}},
  answer:'a) '+mid+'  b) '+inA+'  c) '+out,auto(){this.r.a.value=mid;this.r.b.value=inA;this.r.c.value=out}}},'Think');
/* B. tally */
const TOPICS=[['fruit',['Apple','Banana','Orange','Grape']],['pet',['Dog','Cat','Fish','Bird']],['sport',['Football','Swimming','Tennis','Running']],['colour',['Red','Blue','Green','Yellow']],['drink',['Juice','Milk','Water','Tea']]];
const distinct=(n,lo,hi)=>{for(;;){const a=Array.from({length:n},()=>rnd(lo,hi));if(new Set(a).size===n)return a}};
add('tally',()=>{const[t,cats]=pick(TOPICS),v=distinct(4,3,16),i=rnd(0,3);const tot=v.reduce((a,b)=>a+b,0);
  return{prompt:'The tally chart shows the favourite '+t+' of some children. a) How many children chose <b>'+cats[i]+'</b>? b) How many children were asked altogether?',
  render(b){b.insertAdjacentHTML('beforeend',tallyTable(cats,v,{head:'Favourite '+t}));this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'}])},
  check(){const a=num(this.r.a.value)===v[i],b=num(this.r.b.value)===tot;return a&&b?{ok:true}:{ok:false,hint:(!a?'Count in groups of 5: each bundle with a line through is 5. ':'')+(!b?'Add the four frequencies to find the total.':'')}},
  answer:'a) '+v[i]+'  b) '+tot,auto(){this.r.a.value=v[i];this.r.b.value=tot}}});
add('tally',()=>{const[t,cats]=pick(TOPICS),v=distinct(4,2,9);const votes=shuffle(v.flatMap((n,i)=>Array(n).fill(cats[i][0]+cats[i].slice(1).toLowerCase())));
  return{prompt:'Some children voted for their favourite '+t+': <b>'+votes.join(', ')+'</b>. Make the tally chart: use + and − until each tally matches the votes.',
  render(b){this.tb=tallyBuilder(b,cats);const h=document.createElement('div');h.className='hint';h.textContent='Tip: cross out each vote as you count it.';b.append(h)},
  check(){return eqArr(this.tb.get(),v)?{ok:true}:{ok:false,hint:'Count each word one at a time. How many times do you see '+cats[0]+'? Then '+cats[1]+'...'}},
  answer:cats.map((c,i)=>c+' '+v[i]).join(', '),lock(){this.tb.lock()},auto(){this.tb.set(v)}}});
add('tally',()=>{const[t,cats]=pick(TOPICS),v=distinct(4,3,14),tot=v.reduce((a,b)=>a+b,0);
  return{prompt:tot+' children chose their favourite '+t+'. The tally for <b>'+cats[3]+'</b> is hidden. How many chose '+cats[3]+'?',
  render(b){b.insertAdjacentHTML('beforeend',tallyTable(cats.slice(0,3),v.slice(0,3),{head:'Favourite '+t,freq:true}));this.r=inputs(b,[{id:'a',suffix:'children',mode:'numeric'}])},
  check(){return num(this.r.a.value)===v[3]?{ok:true}:{ok:false,hint:'Add the frequencies you can see, then take that away from '+tot+'.'}},
  answer:v[3]+' children',auto(){this.r.a.value=v[3]}}});
add('tally',()=>{const[t,cats]=pick(TOPICS),v=distinct(4,2,16),[i,j]=sample([0,1,2,3],2);const d=Math.abs(v[i]-v[j]),hi=v[i]>v[j]?i:j,lo=hi===i?j:i;
  return{prompt:'How many more children chose <b>'+cats[hi]+'</b> than <b>'+cats[lo]+'</b>?',
  render(b){b.insertAdjacentHTML('beforeend',tallyTable(cats,v,{head:'Favourite '+t}));this.r=inputs(b,[{id:'a',suffix:'more children',mode:'numeric',w:'4.5em'}])},
  check(){return num(this.r.a.value)===d?{ok:true}:{ok:false,hint:'Find both frequencies, then subtract the smaller from the bigger.'}},
  answer:d+' more children',auto(){this.r.a.value=d}}});
add('tally',()=>{const[t,cats]=pick(TOPICS),v=distinct(4,3,12),k=pick([4,6,7,8]),i=rnd(0,3);let j=rnd(0,3);while(j===i)j=rnd(0,3);const ans=v[i]+k+v[j];
  return{prompt:'Here is a tally chart. Then <b>'+k+' more children</b> choose '+cats[i]+'. Now how many children in total chose <b>'+cats[i]+'</b> or <b>'+cats[j]+'</b>?',
  render(b){b.insertAdjacentHTML('beforeend',tallyTable(cats,v,{head:'Favourite '+t}));this.r=inputs(b,[{id:'a',suffix:'children',mode:'numeric'}])},
  check(){return num(this.r.a.value)===ans?{ok:true}:{ok:false,hint:'Step 1: read both tallies. Step 2: add the '+k+' new children to '+cats[i]+'. Step 3: add the two totals.'}},
  answer:ans+' children',auto(){this.r.a.value=ans}}},'Think');
/* C. bar charts */
const BTOP=[['Favourite fruit',['Apple','Banana','Orange','Grape','Pear']],['Pets owned',['Dog','Cat','Fish','Bird','Rabbit']],['Favourite sport',['Football','Tennis','Swimming','Running','Cycling']]];
add('bar',()=>{const cats=pick(BTOP)[1].slice(0,4),v=distinct(4,2,12),tt=pick(BTOP);
  return{prompt:'Draw the bar chart for this data. Use + and − to change each bar. Each line on the chart goes up in 2s.',
  render(b){b.insertAdjacentHTML('beforeend','<div class="tbl"><table class="dt"><tr>'+cats.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr><tr>'+v.map(x=>'<td>'+x+'</td>').join('')+'</tr></table></div>');this.bb=barBuilder(b,cats,v,14,2)},
  check(){return eqArr(this.bb.get(),v)?{ok:true}:{ok:false,hint:'A bar that stops halfway between two lines is an odd number: for example, between 4 and 6 is 5.'}},
  answer:cats.map((c,i)=>c+' '+v[i]).join(', '),lock(){this.bb.lock()},auto(){this.bb.set(v)}}});
add('bar',()=>{const[t,cats]=pick(BTOP),v=distinct(5,3,15),i=rnd(0,4);let j=rnd(0,4);while(j===i)j=rnd(0,4);const hi=v[i]>v[j]?i:j,lo=hi===i?j:i,d=v[hi]-v[lo];
  return{prompt:'The bar chart shows <b>'+t.toLowerCase()+'</b>. a) How many chose <b>'+cats[i]+'</b>? b) How many more chose <b>'+cats[hi]+'</b> than <b>'+cats[lo]+'</b>?',
  render(b){b.insertAdjacentHTML('beforeend','<div class="chartbox">'+barSVG(cats,v,{max:16,step:2})+'</div>');this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'}])},
  check(){const a=num(this.r.a.value)===v[i],b=num(this.r.b.value)===d;return a&&b?{ok:true}:{ok:false,hint:(!a?'Go across from the top of the bar to the numbers on the side. Between two lines (going up in 2s) means an odd number. ':'')+(!b?'Read both bars, then subtract.':'')}},
  answer:'a) '+v[i]+'  b) '+d,auto(){this.r.a.value=v[i];this.r.b.value=d}}});
add('bar',()=>{const[t,cats]=pick(BTOP),v=sample([15,20,25,30,35,40,45,55,60],4),i=rnd(0,3);let j=rnd(0,3);while(j===i)j=rnd(0,3);
  return{prompt:'Look at the scale: each line goes up in <b>10s</b>. a) What number does the bar for <b>'+cats[i]+'</b> show? b) What is the total for <b>'+cats[i]+'</b> and <b>'+cats[j]+'</b> together?',
  render(b){b.insertAdjacentHTML('beforeend','<div class="chartbox">'+barSVG(cats.slice(0,4),v,{max:70,step:10})+'</div>');this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'}])},
  check(){const a=num(this.r.a.value)===v[i],b=num(this.r.b.value)===v[i]+v[j];return a&&b?{ok:true}:{ok:false,hint:(!a?'Halfway between two lines is 5 more than the lower line: for example, halfway between 30 and 40 is 35. ':'')+(!b?'Read both bars carefully, then add.':'')}},
  answer:'a) '+v[i]+'  b) '+(v[i]+v[j]),auto(){this.r.a.value=v[i];this.r.b.value=v[i]+v[j]}}});
add('bar',()=>{const cats=['Mon','Tue','Wed','Thu'],v=sample([2,3,4,5,6,7,8,9,10,11],4),icon='⭐',i=rnd(0,3);const tot=v.reduce((a,b)=>a+b,0);
  return{prompt:'The pictogram shows the number of books read in 4 days. a) How many books were read on <b>'+cats[i]+'</b>? b) How many books were read altogether?',
  render(b){b.insertAdjacentHTML('beforeend',picto(cats,v,icon,2));this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'}])},
  check(){const a=num(this.r.a.value)===v[i],b=num(this.r.b.value)===tot;return a&&b?{ok:true}:{ok:false,hint:'Each ⭐ is worth 2 and a half ⭐ is worth 1. Count in 2s, then add 1 for a half star.'}},
  answer:'a) '+v[i]+'  b) '+tot,auto(){this.r.a.value=v[i];this.r.b.value=tot}}});
add('bar',()=>{const n=pick([6,10,14,18,22]);return{prompt:'In a pictogram, each ⭐ stands for <b>4</b> books. Mia read <b>'+n+'</b> books. How many ⭐ should you draw? (Use a decimal for half a star, like 2.5.)',
  render(b){this.r=inputs(b,[{id:'a',suffix:'⭐',mode:'decimal',w:'4.5em'}])},
  check(){return num(this.r.a.value)===n/4?{ok:true}:{ok:false,hint:'Whole stars are 4 each. Half a star is 2. How many 4s fit into '+n+'? What is left over?'}},
  answer:(n/4)+' stars',auto(){this.r.a.value=n/4}}});
add('bar',()=>{const cats=['Red','Blue','Green','Yellow'],v=distinct(4,4,14).map(x=>x),k=rnd(0,3),wrong=v.slice();wrong[k]=v[k]+pick([-3,-2,2,3]);if(wrong[k]<1)wrong[k]=v[k]+3;
  return{prompt:'Here is a table and a bar chart. <b>One bar is wrong.</b> Which colour has the wrong bar?',
  render(b){b.insertAdjacentHTML('beforeend','<div class="tbl"><table class="dt"><tr><th>Colour</th>'+cats.map(c=>'<th>'+c+'</th>').join('')+'</tr><tr><td>Children</td>'+v.map(x=>'<td>'+x+'</td>').join('')+'</tr></table></div><div class="chartbox">'+barSVG(cats,wrong,{max:18,step:2})+'</div>');this.c=choices(b,cats,cats[k])},
  check(){return this.c.get()===cats[k]?{ok:true}:{ok:false,hint:'Compare each bar with the number in the table, one colour at a time.'}},
  answer:cats[k],lock(){this.c.lock()},auto(){[...this.c.btns].find(x=>x.textContent===cats[k]).click()}}});
/* D. data detective */
const DOT=[['books read this week',0,6],['goals scored',0,6],['pets owned',0,5]];
function dotData(lo,hi,n){for(;;){const a=Array.from({length:n},()=>rnd(lo,hi));const c={};a.forEach(x=>c[x]=(c[x]||0)+1);const m=Math.max(...Object.values(c));if(Object.values(c).filter(x=>x===m).length===1&&m>=3)return a}}
add('cmp',()=>{const[t,lo,hi]=pick(DOT),d=dotData(lo,hi,14),k=rnd(lo,hi),cnt=d.filter(x=>x===k).length;
  return{prompt:'The dot plot shows the number of <b>'+t+'</b> for some children. a) How many children had <b>'+k+'</b>? b) How many children are in the dot plot altogether?',
  render(b){b.insertAdjacentHTML('beforeend','<div class="chartbox">'+dotSVG(d,lo,hi)+'</div>');this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'}])},
  check(){const a=num(this.r.a.value)===cnt,b=num(this.r.b.value)===d.length;return a&&b?{ok:true}:{ok:false,hint:(!a?'Look above the number '+k+' and count the dots. ':'')+(!b?'Every dot is one child. Count all the dots.':'')}},
  answer:'a) '+cnt+'  b) '+d.length,auto(){this.r.a.value=cnt;this.r.b.value=d.length}}});
add('cmp',()=>{const[t,lo,hi]=pick(DOT),d=dotData(lo,hi,15),c={};d.forEach(x=>c[x]=(c[x]||0)+1);const mode=+Object.keys(c).find(k=>c[k]===Math.max(...Object.values(c))),m=pick([2,3,4]),more=d.filter(x=>x>m).length;
  return{prompt:'Look at the dot plot of <b>'+t+'</b>. a) Which number is the <b>most common</b> (has the most dots)? b) How many children had <b>more than '+m+'</b>?',
  render(b){b.insertAdjacentHTML('beforeend','<div class="chartbox">'+dotSVG(d,lo,hi)+'</div>');this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'}])},
  check(){const a=num(this.r.a.value)===mode,b=num(this.r.b.value)===more;return a&&b?{ok:true}:{ok:false,hint:(!a?'The most common number is the one with the tallest pile of dots. ':'')+(!b?'“More than '+m+'” does not include '+m+'. Count the dots to the right of '+m+'.':'')}},
  answer:'a) '+mode+'  b) '+more,auto(){this.r.a.value=mode;this.r.b.value=more}}});
add('cmp',()=>{const cats=['Pizza','Pasta','Salad'],a=[2,4,6,8,10,12].sort(()=>Math.random()-.5).slice(0,3),b=a.map(x=>x+pick([-2,2,4]));b.forEach((x,i)=>{if(x<2)b[i]=a[i]+2});const k=rnd(0,2);const dif=Math.abs(b[k]-a[k]);
  return{prompt:'Two classes chose their favourite food. How many more children chose <b>'+cats[k]+'</b> in the class with more votes than in the other class?',
  render(bx){bx.insertAdjacentHTML('beforeend','<div class="chartbox">'+barSVG(cats,a,{max:16,step:4,title:'Class A',col:'#1F7A7A'})+'</div><div class="chartbox">'+barSVG(cats,b,{max:16,step:4,title:'Class B',col:'#E0A21B'})+'</div>');this.r=inputs(bx,[{id:'a',suffix:'more children',mode:'numeric',w:'4.5em'}])},
  check(){return num(this.r.a.value)===dif?{ok:true}:{ok:false,hint:'Read the '+cats[k]+' bar in Class A, then in Class B. Careful: the lines go up in 4s. Subtract.'}},
  answer:dif+' more children',auto(){this.r.a.value=dif}}});
add('cmp',()=>{const bc=rnd(4,12),bd=rnd(4,12),gc=rnd(3,11),gd=rnd(4,12);
  return{prompt:'Here is a table about the pets that boys and girls chose. How many <b>girls</b> chose dogs? (Use the total.)',
  render(b){b.insertAdjacentHTML('beforeend','<div class="tbl"><table class="dt"><tr><th></th><th>Cats</th><th>Dogs</th><th>Total</th></tr><tr><td>Boys</td><td>'+bc+'</td><td>'+bd+'</td><td>'+(bc+bd)+'</td></tr><tr><td>Girls</td><td>'+gc+'</td><td>?</td><td>'+(gc+gd)+'</td></tr></table></div>');this.r=inputs(b,[{id:'a',suffix:'girls',mode:'numeric'}])},
  check(){return num(this.r.a.value)===gd?{ok:true}:{ok:false,hint:'The girls’ total is '+(gc+gd)+'. Take away the girls who chose cats ('+gc+').'}},
  answer:gd+' girls',auto(){this.r.a.value=gd}}});
add('cmp',()=>{const f=distinct(5,2,9),k=rnd(1,3),tot=f.reduce((a,b)=>a+b,0),more=f.slice(k+1).reduce((a,b)=>a+b,0);
  return{prompt:'The frequency table shows the number of brothers and sisters of some children. a) How many children have exactly <b>'+k+'</b>? b) How many children have <b>more than '+k+'</b>?',
  render(b){b.insertAdjacentHTML('beforeend','<div class="tbl"><table class="dt"><tr><th>Brothers and sisters</th>'+[0,1,2,3,4].map(x=>'<th>'+x+'</th>').join('')+'</tr><tr><td>Frequency</td>'+f.map(x=>'<td>'+x+'</td>').join('')+'</tr></table></div>');this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'}])},
  check(){const a=num(this.r.a.value)===f[k],b=num(this.r.b.value)===more;return a&&b?{ok:true}:{ok:false,hint:(!a?'Find '+k+' in the top row; the frequency is under it. ':'')+(!b?'Add all the frequencies for the numbers bigger than '+k+'.':'')}},
  answer:'a) '+f[k]+'  b) '+more,auto(){this.r.a.value=f[k];this.r.b.value=more}}});
add('cmp',()=>{const[t,cats]=pick(BTOP),v=distinct(4,3,13),miss=rnd(8,16),tot=v.reduce((a,b)=>a+b,0)+miss;
  return{prompt:'<b>'+tot+'</b> children each chose one favourite. The bar for <b>'+cats[4]+'</b> is missing. How many children chose '+cats[4]+'? Then: how many more chose the most popular of the four shown than '+cats[4]+'?',
  render(b){b.insertAdjacentHTML('beforeend','<div class="chartbox">'+barSVG(cats.slice(0,4),v,{max:16,step:2})+'</div>');this.r=inputs(b,[{id:'a',label:'a)',mode:'numeric',w:'4em'},{id:'b',label:'b)',mode:'numeric',w:'4em'}])},
  check(){const mx=Math.max(...v),a=num(this.r.a.value)===miss,b=num(this.r.b.value)===Math.abs(mx-miss);return a&&b?{ok:true}:{ok:false,hint:(!a?'Add the four bars, then take the total away from '+tot+'. ':'')+(!b?'Find the tallest bar, then subtract (be careful: which is bigger?).':'')}},
  answer:'a) '+miss+'  b) '+Math.abs(Math.max(...v)-miss),auto(){this.r.a.value=miss;this.r.b.value=Math.abs(Math.max(...v)-miss)}}},'Think');

/* ---------- storage, results ---------- */
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(_){return null}};
const R={sr:+ls('t5sr')||0,tr:+ls('t5tr')||0,tm:+ls('t5tm')||0,md:+ls('t5md')||0,bb:+ls('t5bb')||0,solved:0,total:0};
document.getElementById('artog').onclick=()=>{const h=document.body.classList.toggle('noar');document.getElementById('artog').textContent=h?'إظهار الشرح بالعربي / Show Arabic help':'إخفاء الشرح بالعربي / Hide Arabic help'};
const nmEl=document.getElementById('nm');nmEl.value=ls('t5name')||ls('t4name')||'';
nmEl.addEventListener('input',()=>{ls('t5name',nmEl.value);queueSave()});
const myName=()=>(nmEl.value||'').trim()||'Student';
function resultText(only){const nm=n=>+ls('t5m'+n)||0;const tot=k=>secCount[k]||0;
  const q=n=>{const m=MIS.find(x=>x.n===n);return nm(n)+' / '+m.secs.reduce((s,k)=>s+tot(k),0)};
  const GM={3:' · Data Dragon: '+(R.bb||0)+' defeated',4:' · Mistake Detective: '+(R.md||0)+' cases closed',1:' · Sort Race best score: '+(R.sr||'not played'),2:' · Tally Rush best score: '+(R.tr||'not played')+' · Tally Memory: '+(R.tm?R.tm+' moves':'not played')};
  const sum=[1,2,3,4,5].reduce((s,n)=>s+nm(n),0),all=[1,2,3,4,5].reduce((s,n)=>s+MIS.find(x=>x.n===n).secs.reduce((t,k)=>t+tot(k),0),0);
  const line=n=>'Mission '+n+' · '+MIS.find(x=>x.n===n).title+': '+q(n)+(GM[n]||'');
  if(only)return 'ThinkUp Year 4 · Unit 5 Statistics\nName: '+myName()+'\n\n'+line(only);
  return 'ThinkUp Year 4 · Unit 5 Statistics\nName: '+myName()+'\n\n'+[1,2,3,4,5].map(line).join('\n')+'\n\nTotal questions: '+sum+' / '+all}
function confetti(){for(let i=0;i<18;i++){const e=document.createElement('div');e.className='conf';e.textContent=['⭐','🎉','✨','🌟'][i%4];e.style.left=Math.random()*100+'vw';e.style.animationDelay=(Math.random()*.4)+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),2200)}}
function showResult(){const pg=document.body.dataset.page||'map',one=pg==='map'?0:+pg.slice(1);const txt=resultText(one);const w=document.getElementById('wa');if(w)w.href='https://wa.me/201026794126?text='+encodeURIComponent(txt);document.getElementById('resulttext').textContent=txt;if(one){const h=document.querySelector('#resultcard h2'),p=document.querySelector('#resultcard p');if(h)h.textContent='Send this mission\'s result to Miss Eman';if(p)p.textContent='Finished this mission? Type your name at the top, then press the green button.';const wa=document.getElementById('wa');if(wa)wa.textContent='Send this mission to Miss Eman (WhatsApp)';const cp=document.getElementById('copyres');if(cp)cp.textContent='Copy my result'}document.getElementById('resultcard').classList.add('show')}
function queueSave(){showResult()}
document.getElementById('copyres').onclick=()=>{const pg=document.body.dataset.page||'map',t=resultText(pg==='map'?0:+pg.slice(1)),fb=document.getElementById('copyfb');
  const ok=()=>{fb.className='fb good';fb.textContent='Copied! Send it to your teacher.'};const no=()=>{fb.className='fb info';fb.textContent='Select the text above and copy it.'};
  try{navigator.clipboard.writeText(t).then(ok,no)}catch(_){no()}};
{const note=document.getElementById('savenote');if(note){note.hidden=false;note.textContent='Type your name, play all the missions, then come back to the Mission Map and press the green button to send ALL your results to Miss Eman.'}}

/* ---------- games ---------- */
const gamesEl=document.getElementById('games');
function gcard(title,pill,desc,ar,em){const g=document.createElement('div');g.className='g';g.innerHTML='<div class="gribbon"><img alt="ThinkUp" src="logo.png"><span>ThinkUp Games · Think Better. Aim Higher.</span></div><h3><span class="mascot" style="font-size:34px">'+em+'</span>'+title+' <span class="pill">'+pill+'</span></h3><div class="gtip">'+desc+(ar?'<div class="ar" lang="ar">'+ar+'</div>':'')+'</div><div class="gbody"></div>';gamesEl.appendChild(g);return g.querySelector('.gbody')}
const mkbtn=(t,fn,cls)=>{const b=document.createElement('button');b.type='button';b.textContent=t;if(cls)b.className=cls;b.onclick=fn;return b};
function raceGame(body,key,best,qfn,seconds){
  const area=document.createElement('div');area.className='gbody';area.style.width='100%';const bar=document.createElement('div');bar.className='timer';bar.innerHTML='<i></i>';const fill=bar.firstChild;
  const info=document.createElement('div');info.className='big';info.textContent='Best: '+(R[best]||'–');
  let score=0,streak=0,left=0,iv=null;const play=document.createElement('div');play.className='gbody';
  const api={right(){streak++;score+=10+(streak>=3?5:0);info.textContent='Score: '+score;next()},wrong(b){streak=0;b.classList.add('shake');b.disabled=true;score=Math.max(0,score-2);info.textContent='Score: '+score}};
  function next(){play.innerHTML='';qfn(play,api)}
  function end(){clearInterval(iv);play.innerHTML='';if(score>R[best]){R[best]=score;ls(key,score)}info.textContent='Time! Score: '+score+(score>=R[best]?' ★ best':'')+' · Best: '+R[best];queueSave();startB.hidden=false;startB.textContent='Play again'}
  const startB=mkbtn('Start',()=>{score=0;streak=0;left=seconds;startB.hidden=true;info.textContent='Score: 0';next();fill.style.width='100%';clearInterval(iv);iv=setInterval(()=>{left-=0.25;fill.style.width=Math.max(0,left/seconds*100)+'%';if(left<=0)end()},250)});
  area.append(info,bar,play,startB);body.append(area)}
/* Game 1: sort race */
(function(){
  const body=gcard('Sort Race','45 seconds','<b>How to play:</b> press <b>Start</b>. A number appears. Tap where it belongs: in the first rule only, in the second rule only, in both, or in neither. Each right answer gives 10 points (3 in a row gives bonus points). A wrong answer takes away 2 points.','طريقة اللعب: دوس Start. هيظهر رقم، اختار مكانه: في الشرط الأول بس، أو التاني بس، أو الاتنين، أو ولا واحد. كل إجابة صح = 10 نقط، والغلط بينقّص 2 نقطة. معاك 45 ثانية.','🧩');
  let rule=pick(PAIRS);
  raceGame(body,'t5sr','sr',(play,api)=>{
    const n=rnd(1,40),z=zoneOf(rule[0][1],rule[1][1],n);
    const h=document.createElement('div');h.className='hint';h.innerHTML='Rules: <b>'+rule[0][0]+'</b> and <b>'+rule[1][0]+'</b>';
    const big=document.createElement('div');big.className='big';big.textContent=n;
    const o=document.createElement('div');o.className='opts';
    [['A',rule[0][0]+' only'],['AB','Both'],['B',rule[1][0]+' only'],['O','Neither']].forEach(([id,t])=>{const b=mkbtn(t,()=>{if(id===z)api.right();else api.wrong(b)},'opt');o.append(b)});
    play.append(h,big,o)},45);
})();
/* Game 2: tally rush */
(function(){
  const body=gcard('Tally Rush','45 seconds','<b>How to play:</b> press <b>Start</b>. Look at the tally marks and tap the number they show. Each right answer gives 10 points (3 in a row gives bonus points). A wrong answer takes away 2 points.','طريقة اللعب: دوس Start. بص على علامات العد واختار الرقم اللي بتمثله (كل 5 = أربع خطوط وخط مائل). كل إجابة صح = 10 نقط، والغلط بينقّص 2 نقطة. معاك 45 ثانية.','⚡');
  raceGame(body,'t5tr','tr',(play,api)=>{
    const n=rnd(3,27);const pool=new Set();[n+1,n-1,n+5,n-5,n+2].forEach(x=>{if(x>0&&x!==n)pool.add(x)});
    const opts=shuffle([n,...shuffle([...pool]).slice(0,2)]);
    const t=document.createElement('div');t.className='tallybig';t.innerHTML=tallySVG(n);
    const o=document.createElement('div');o.className='opts';opts.forEach(v=>{const b=mkbtn(String(v),()=>{if(v===n)api.right();else api.wrong(b)},'opt');o.append(b)});
    play.append(t,o)},45);
})();
/* Game 3: tally memory */
(function(){
  const body=gcard('Tally Memory','6 pairs','<b>How to play:</b> press <b>Start</b>. Turn over two cards. If a tally matches its number, the pair stays. Find all 6 pairs with as few moves as you can.','طريقة اللعب: دوس Start. اقلب كارتين. لو علامات العد والرقم متطابقين، الكارتين بيفضلوا. دوّر على الـ 6 أزواج بأقل عدد محاولات.','🧠');
  const info=document.createElement('div');info.className='big';info.textContent='Best: '+(R.tm?R.tm+' moves':'–');
  const grid=document.createElement('div');grid.className='mem';let moves=0,open=[],lock=false,found=0;
  const startB=mkbtn('Start',deal);
  function deal(){startB.hidden=true;moves=0;open=[];found=0;lock=false;grid.innerHTML='';info.textContent='Moves: 0';
    const ns=sample(Array.from({length:22},(_,i)=>i+3),6);const cards=shuffle(ns.flatMap(n=>[{n,k:'t'},{n,k:'d'}]));
    cards.forEach(c=>{const el=document.createElement('button');el.type='button';el.className='card';el.innerHTML='<span class="qm">?</span>';el.setAttribute('aria-label','Hidden card');
      el.onclick=()=>{if(lock||el.classList.contains('up')||el.classList.contains('gone'))return;
        el.classList.add('up');el.innerHTML=c.k==='t'?tallySVG(c.n):'<b>'+c.n+'</b>';open.push({el,c});
        if(open.length===2){moves++;info.textContent='Moves: '+moves;lock=true;const[a,b]=open;
          if(a.c.n===b.c.n&&a.c.k!==b.c.k){setTimeout(()=>{[a,b].forEach(x=>{x.el.classList.remove('up');x.el.classList.add('gone')});open=[];lock=false;found++;
            if(found===6){if(!R.tm||moves<R.tm){R.tm=moves;ls('t5tm',moves)}info.textContent='You did it in '+moves+' moves! Best: '+R.tm;confetti();queueSave();startB.hidden=false;startB.textContent='Play again'}},500)}
          else setTimeout(()=>{[a,b].forEach(x=>{x.el.classList.remove('up');x.el.innerHTML='<span class="qm">?</span>'});open=[];lock=false},900)}};
      grid.append(el)})}
  body.append(info,grid,startB);
})();
const MISS_OF={sort:1,tally:2,bar:3,cmp:4,final:5};
SECTIONS.push({id:'final',title:'Unit 5 Challenge',sub:'10 mixed questions on everything in Unit 5. Two of them are hard (Think harder). Can you get all 10?'});
[0,1,4,5,7,9,11,13,17,21].forEach(i=>QS.push({sec:'final',gen:QS[i].gen,tag:QS[i].tag,src:i,fixed:false}));

/* ---------- engine ---------- */
/* Game 4: Mistake Detective */
(function(){
  const body=gcard('Mistake Detective','3 mistakes in every case','<b>How to play:</b> press <b>Start case</b>. Naomi made a chart or a table, but it has <b>3 mistakes</b>. Tap each mistake. If you tap something that is correct, you use up a try. Close as many cases as you can.','طريقة اللعب: دوس Start case. الرسم أو الجدول فيه 3 أخطاء. دوس على كل غلطة. لو دوست على حاجة صح بتتحسب محاولة غلط. اقفل أكبر عدد من القضايا.','🕵️');
  const info=document.createElement('div');info.className='mdinfo';info.textContent='Cases closed: '+(R.md||0);
  const stage=document.createElement('div');stage.className='mdstage';
  const fbEl=document.createElement('div');fbEl.className='fb';fbEl.setAttribute('aria-live','polite');
  const logEl=document.createElement('div');logEl.className='mdlog';
  const startB=mkbtn('Start case',()=>nextCase());
  body.append(info,stage,fbEl,logEl,startB);
  const CAT=[['Favourite fruit',['Apple','Banana','Orange','Grape']],['Pets',['Dog','Cat','Fish','Bird']],['Favourite sport',['Football','Tennis','Swimming','Running']],['How we travel',['Walk','Bus','Car','Bike']]];
  const rng=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
  const hg=(id,inner,x,y,w,h)=>'<g data-m="'+id+'" style="cursor:pointer">'+inner+'<rect class="hit" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="transparent"/></g>';
  const tableOf=(cats,vals)=>'<div class="tbl"><table class="dt"><tr>'+cats.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr><tr>'+vals.map(x=>'<td>'+x+'</td>').join('')+'</tr></table></div>';
  /* case 1: bar chart */
  function caseBar(){const[t,cats]=pick(CAT),v=sample(rng(2,12),4),bi=rnd(0,3),dv=v[bi]>=7?v[bi]-pick([2,3]):v[bi]+pick([2,3]);
    const W=360,H=240,L=40,B=34,T=42,pw=W-L-10,ph=H-B-T,bw=46;let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="bar chart">';
    for(let k=0;k<=6;k++){const y=T+ph*(1-k/6),lab=(k===4?10:k*2);s+='<line x1="'+L+'" y1="'+y+'" x2="'+(W-10)+'" y2="'+y+'" stroke="var(--ink)" stroke-opacity="'+(k?.18:.9)+'" stroke-width="'+(k?1:2)+'"/>'+hg(k===4?'scale':'ok','<text x="'+(L-6)+'" y="'+(y+4)+'" font-size="12" font-weight="800" text-anchor="end" fill="var(--ink)">'+lab+'</text>',2,y-9,L-4,18)}
    cats.forEach((c,i)=>{const cx=L+pw/4*(i+.5),val=i===bi?dv:v[i],h=ph*val/12;s+=hg(i===bi?'bar':'ok','<rect x="'+(cx-bw/2)+'" y="'+(T+ph-h)+'" width="'+bw+'" height="'+h+'" fill="'+PAL[i]+'" stroke="var(--ink)" stroke-width="1.5"/>',cx-bw/2,T+ph-h,bw,h)+'<text x="'+cx+'" y="'+(H-12)+'" font-size="11" font-weight="800" text-anchor="middle" fill="var(--ink)">'+esc(c)+'</text>'});
    s+='<g data-m="title" style="cursor:pointer"><rect x="70" y="6" width="220" height="26" rx="8" fill="none" stroke="#C8452F" stroke-width="2" stroke-dasharray="5 4"/><text x="180" y="24" font-size="12" font-weight="800" text-anchor="middle" fill="#C8452F">title: ?</text><rect class="hit" x="70" y="6" width="220" height="26" fill="transparent"/></g></svg>';
    return{intro:'Naomi asked children about their '+t.toLowerCase()+'. Here is her table and her bar chart.',html:tableOf(cats,v)+'<div class="chartbox">'+s+'</div>',
      why:{title:'There is no title. A chart needs a title so we know what it shows.',scale:'The scale is wrong: it says 10 where 8 should be. The numbers must go up by the same amount each time (2s).',bar:'The table says '+cats[bi]+' = '+v[bi]+', but the bar is drawn at '+dv+'. Bars must match the data.'}}}
  /* case 2: tally table */
  function caseTally(){const[t,cats]=pick(CAT),v=sample(rng(3,13),4),idx=sample([0,1,2,3],2),f=v.slice();idx.forEach(i=>f[i]=v[i]+pick([1,-1]));
    const real=v.reduce((a,b)=>a+b,0),sumF=f.reduce((a,b)=>a+b,0);let shown;do{shown=real+pick([2,-2,3,-3])}while(shown===sumF);
    const ids=['r1','r2'];let k=0;const why={};
    const rows=cats.map((c,i)=>{let id='ok';if(idx.includes(i)){id=ids[k++];why[id]='The tally for '+c+' shows '+v[i]+', but the frequency says '+f[i]+'.'}return'<tr><td>'+esc(c)+'</td><td>'+tallySVG(v[i])+'</td><td data-m="'+id+'" style="cursor:pointer">'+f[i]+'</td></tr>'}).join('');
    why.total='The tally marks add up to '+real+', but the total says '+shown+'.';
    return{intro:'Naomi counted the votes for '+t.toLowerCase()+' with tally marks. Then she wrote the frequency (how many) and the total.',html:'<div class="tbl"><table class="dt"><tr><th></th><th>Tally</th><th>Frequency</th></tr>'+rows+'<tr><td><b>Total</b></td><td></td><td data-m="total" style="cursor:pointer"><b>'+shown+'</b></td></tr></table></div>',why}}
  /* case 3: pictogram */
  function casePicto(){const[t,cats]=pick(CAT),v=sample([2,4,6,8,10,12],4),idx=sample([0,1,2,3],2),ids=['r1','r2'];let k=0;const why={};
    const rows=cats.map((c,i)=>{let n=v[i]/2,id='ok';if(idx.includes(i)){id=ids[k++];n=Math.max(1,n+pick([1,-1]));if(n===v[i]/2)n=v[i]/2+1;why[id]=c+' has '+v[i]+' in the table, so it needs '+(v[i]/2)+' symbols, but the row shows '+n+'.'}return'<tr><td>'+esc(c)+'</td><td class="ic" data-m="'+id+'" style="cursor:pointer">'+'⭐'.repeat(n)+'</td></tr>'}).join('');
    why.key='There is no key. A pictogram needs a key that says each symbol stands for 2.';
    return{intro:'Naomi drew a pictogram of the '+t.toLowerCase()+'. Each symbol should stand for 2 children. Her table of numbers is above.',html:tableOf(cats,v)+'<div class="tbl"><table class="dt pic">'+rows+'</table></div><div class="keybox" data-m="key" style="cursor:pointer">Key: ⭐ = ?</div>',why}}
  /* case 4: dot plot */
  function caseDot(){const lo=4,hi=8,c=rng(lo,hi).map(()=>rnd(1,4)),idx=sample([0,1,2,3,4],2),d=c.slice();idx.forEach(i=>{d[i]=c[i]===1?2:c[i]+pick([1,-1])});
    const scores=[];rng(lo,hi).forEach((x,i)=>{for(let k=0;k<c[i];k++)scores.push(x)});
    const ax=sample([1,2,3],1)[0],W=360,mx=Math.max(...d),H=40+mx*18+30,L=30,pw=W-2*L,n=hi-lo+1,why={};let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="dot plot"><line x1="'+(L-10)+'" y1="'+(H-28)+'" x2="'+(W-L+10)+'" y2="'+(H-28)+'" stroke="var(--ink)" stroke-width="2"/>';let kk=0;const ids=['c1','c2'];
    for(let i=0;i<n;i++){const x=L+pw/(n-1)*i,v=lo+i;let id='ok';if(idx.includes(i)){id=ids[kk++];why[id]='There are '+c[i]+' children who scored '+v+', but the plot has '+d[i]+' dots above '+v+'.'}
      let dots='';for(let q=0;q<d[i];q++)dots+='<circle cx="'+x+'" cy="'+(H-28-10-q*18)+'" r="7.5" fill="#C8452F" stroke="var(--ink)" stroke-width="1"/>';
      s+=hg(id,dots,x-14,H-28-10-(d[i]-1)*18-10,28,d[i]*18+4);
      const lab=(i===ax+1)?lo+i-1:lo+i;if(i===ax+1)why.axis='The axis shows '+lab+' twice. The labels must count '+lo+', '+(lo+1)+', '+(lo+2)+', '+(lo+3)+', '+hi+' with no repeats.';
      s+=hg(i===ax+1?'axis':'ok','<line x1="'+x+'" y1="'+(H-28)+'" x2="'+x+'" y2="'+(H-22)+'" stroke="var(--ink)" stroke-width="2"/><text x="'+x+'" y="'+(H-8)+'" font-size="13" font-weight="800" text-anchor="middle" fill="var(--ink)">'+lab+'</text>',x-14,H-24,28,24)}
    return{intro:scores.length+' children took a spelling test. Naomi wrote the scores: <b>'+scores.join(', ')+'</b>. Then she drew a dot plot (one dot for each child).',html:'<div class="chartbox">'+s+'</svg></div>',why}}
  /* case 5: carroll */
  function caseCarroll(){const ns=sample(rng(1,20),8),zone=n=>(n<10?0:1)*2+(n%2?0:1),placed=ns.map(n=>zone(n)),bad=sample([0,1,2,3,4,5,6,7],3),why={};
    bad.forEach(i=>{let z;do{z=rnd(0,3)}while(z===placed[i]);placed[i]=z});const ids=['n1','n2','n3'];let k=0;const cells=[[],[],[],[]];
    const names=['odd and less than 10','even and less than 10','odd and 10 or more','even and 10 or more'];
    ns.forEach((n,i)=>{let id='ok';if(bad.includes(i)){id=ids[k++];why[id]=n+' is '+(n%2?'odd':'even')+' and '+(n<10?'less than 10':'10 or more')+', so it belongs in the box for '+names[zone(n)]+'.'}cells[placed[i]].push('<button type="button" class="chip" data-m="'+id+'">'+n+'</button>')});
    return{intro:'Naomi sorted these numbers into a Carroll diagram: <b>'+ns.slice().sort((a,b)=>a-b).join(', ')+'</b>. Three numbers are in the wrong box.',
      html:'<table class="carroll"><tr><th></th><th>Odd</th><th>Even</th></tr><tr><th>Less than 10</th><td>'+cells[0].join('')+'</td><td>'+cells[1].join('')+'</td></tr><tr><th>10 or more</th><td>'+cells[2].join('')+'</td><td>'+cells[3].join('')+'</td></tr></table>',why}}
  const CASES=[caseBar,caseTally,casePicto,caseDot,caseCarroll];
  let order=[],cur=null,found=new Set(),miss=0,done=false,no=0;
  function upd(){info.textContent='Case '+no+' · Found '+found.size+' / 3 · Wrong taps '+miss+' · Cases closed '+(R.md||0)}
  function nextCase(){if(!order.length)order=shuffle(CASES.slice());const f=order.pop();cur=f();found=new Set();miss=0;done=false;no++;logEl.innerHTML='';fbEl.textContent='';fbEl.className='fb';
    stage.innerHTML='<div class="hint" style="margin:0 0 8px">'+cur.intro+'</div>'+cur.html;startB.hidden=true;upd()}
  stage.addEventListener('click',e=>{if(done||!cur)return;const el=e.target.closest('[data-m]');if(!el||el.classList.contains('found'))return;const id=el.dataset.m;
    if(id==='ok'){miss++;fbEl.className='fb bad';fbEl.textContent='That part is correct. Look again!';upd();return}
    found.add(id);el.classList.add('found');fbEl.className='fb good';fbEl.textContent='✓ You found a mistake!';
    logEl.insertAdjacentHTML('beforeend','<div class="item">✓ '+cur.why[id]+'</div>');upd();
    if(found.size===3){done=true;const st=miss<=1?'⭐⭐⭐':miss<=3?'⭐⭐':'⭐';R.md=(R.md||0)+1;ls('t5md',R.md);fbEl.textContent='🏆 Case closed! '+st;confetti();queueSave();upd();startB.hidden=false;startB.textContent='Next case'}});
  window.__MD={caseFns:CASES};
})();

/* Game 5: Data Dragon boss battle */
(function(){
  const body=gcard('Data Dragon Battle','10 health points','<b>How to play:</b> press <b>Start battle</b>. Read the chart and tap the right answer. A right answer hits the dragon (it loses 1 health). A wrong answer lets it heal 1 health, and you get a hint. Beat the dragon to win!','طريقة اللعب: دوس Start battle. اقرأ الرسم واختار الإجابة الصح. الإجابة الصح بتضرب التنين، والغلط بيرجّع له نقطة وبتاخد تلميح. اهزم التنين!','🐉');
  const info=document.createElement('div');info.className='mdinfo';
  const bossBox=document.createElement('div');bossBox.className='bossbox';
  const hpEl=document.createElement('div');hpEl.className='hp5';
  const qEl=document.createElement('div');qEl.className='bbq';
  const oEl=document.createElement('div');oEl.className='opts';
  const fbEl=document.createElement('div');fbEl.className='fb';fbEl.setAttribute('aria-live','polite');
  const startB=mkbtn('Start battle',()=>battle());
  body.append(info,bossBox,hpEl,qEl,oEl,fbEl,startB);
  let hp=10,streak=0,Q=null,on=false;
  const CAT=[['fruit',['Apple','Banana','Orange','Grape']],['pet',['Dog','Cat','Fish','Bird']],['sport',['Football','Tennis','Swimming','Running']],['way to travel',['Walk','Bus','Car','Bike']]];
  const rg=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
  function dragon(){bossBox.innerHTML='<svg viewBox="0 0 200 190" aria-label="Data Dragon" style="width:150px"><path d="M30 150 Q10 100 45 70 L40 25 L68 50 Q100 38 132 50 L160 25 L155 70 Q190 100 170 150 Q100 188 30 150Z" fill="#1F7A7A" stroke="#0F2742" stroke-width="5" stroke-linejoin="round"/><path d="M40 25 L52 55 L68 50Z M160 25 L148 55 L132 50Z" fill="#E0A21B" stroke="#0F2742" stroke-width="4" stroke-linejoin="round"/><ellipse cx="100" cy="140" rx="46" ry="30" fill="#FBE9B7" stroke="#0F2742" stroke-width="4"/><circle cx="76" cy="88" r="15" fill="#fff" stroke="#0F2742" stroke-width="4"/><circle cx="124" cy="88" r="15" fill="#fff" stroke="#0F2742" stroke-width="4"/><circle cx="79" cy="91" r="6" fill="#0F2742"/><circle cx="121" cy="91" r="6" fill="#0F2742"/><path d="M82 118 Q100 132 118 118" fill="none" stroke="#0F2742" stroke-width="5" stroke-linecap="round"/><text x="100" y="146" font-family="Baloo 2,Trebuchet MS,sans-serif" font-weight="800" font-size="26" text-anchor="middle" fill="#0F2742">'+hp+'/10</text></svg>';
    hpEl.innerHTML=rg(1,10).map(i=>'<i class="'+(i<=hp?'':'off')+'"></i>').join('')}
  function opts(ans,wr){const s=[ans];shuffle(wr).forEach(x=>{if(!s.includes(x)&&x>=0&&s.length<3)s.push(x)});let k=1;while(s.length<3){if(!s.includes(ans+k))s.push(ans+k);k++}return shuffle(s)}
  const GEN=[
   ()=>{const n=rnd(3,24);return{h:'<div class="tallybig">'+tallySVG(n)+'</div>How many tally marks?',a:n,o:opts(n,[n+1,n-1,n+5,n-5]),hint:'Count in groups of 5: each crossed bundle is 5.'}},
   ()=>{const[t,cats]=pick(CAT),v=sample(rg(2,12),4),i=rnd(0,3);return{h:'<div class="chartbox">'+barSVG(cats,v,{max:12,step:2})+'</div>How many children chose <b>'+cats[i]+'</b>?',a:v[i],o:opts(v[i],[v[i]+1,v[i]-1,v[i]+2,v[i]-2]),hint:'Find the top of the '+cats[i]+' bar. Read across to the scale. The scale goes up in 2s.'}},
   ()=>{const[t,cats]=pick(CAT),v=sample(rg(2,12),4),[i,j]=sample([0,1,2,3],2),hi=v[i]>v[j]?i:j,lo=hi===i?j:i,d=v[hi]-v[lo];return{h:'<div class="chartbox">'+barSVG(cats,v,{max:12,step:2})+'</div>How many <b>more</b> children chose <b>'+cats[hi]+'</b> than <b>'+cats[lo]+'</b>?',a:d,o:opts(d,[d+1,d-1,d+2,v[hi]]),hint:'Read both bars, then subtract the smaller number from the bigger number.'}},
   ()=>{const lo=4,hi=8,sc=[];rg(lo,hi).forEach(x=>{for(let k=0,m=rnd(1,4);k<m;k++)sc.push(x)});const v=rnd(lo,hi),c=sc.filter(x=>x===v).length;return{h:'<div class="chartbox">'+dotSVG(sc,lo,hi)+'</div>How many children scored <b>'+v+'</b>?',a:c,o:opts(c,[c+1,c-1,c+2]),hint:'Count the dots above the number '+v+'. One dot is one child.'}},
   ()=>{const per=pick([2,5,10]),k=rnd(2,7),a=per*k;return{h:'<div class="picbig">'+'⭐'.repeat(k)+'</div>Key: each ⭐ = <b>'+per+'</b> books. How many books?',a:a,o:opts(a,[a+per,a-per,k,a+1]),hint:'Count the symbols, then multiply by '+per+'.'}}
  ];
  function ask(){Q=pick(GEN)();qEl.innerHTML=Q.h;oEl.innerHTML='';Q.o.forEach(v=>{const b=mkbtn(String(v),()=>pickA(b,v===Q.a),'opt');oEl.append(b)});window.__BB={ans:Q.a}}
  function pickA(b,ok){if(!on)return;
    if(ok){streak++;hp=Math.max(0,hp-1);fbEl.className='fb good';fbEl.textContent=streak>=3?'🔥 '+streak+' in a row! Direct hit!':'✓ Hit! The dragon loses 1 health.';
      dragon();if(hp===0){on=false;qEl.innerHTML='<b class="winb">🏆 You defeated the Data Dragon!</b>';oEl.innerHTML='';fbEl.textContent='';R.bb=(R.bb||0)+1;ls('t5bb',R.bb);confetti();queueSave();startB.hidden=false;startB.textContent='Play again';info.textContent='Dragons defeated: '+R.bb;return}ask()}
    else{streak=0;hp=Math.min(10,hp+1);fbEl.className='fb bad';fbEl.textContent='Oops, the dragon heals 1 health. Hint: '+Q.hint;b.disabled=true;dragon()}
    info.textContent='Streak: '+streak+' · Dragons defeated: '+(R.bb||0)}
  function battle(){hp=10;streak=0;on=true;startB.hidden=true;fbEl.textContent='';info.textContent='Dragons defeated: '+(R.bb||0);dragon();ask()}
  info.textContent='Dragons defeated: '+(R.bb||0);dragon();
})();

const AR=["ضع كل رقم في مكانه: لو ينطبق عليه الشرطين يروح في النص (التقاطع)، ولو ولا شرط يروح بره الدايرتين.", "كل رقم يروح في مربع واحد بس: بص هو فردي ولا زوجي، وأقل من 10 ولا 10 أو أكتر.", "لكل رياضة اسأل سؤالين: هي لعبة فريق ولا لا؟ وبتستخدم كورة مدورة ولا لا؟ (الرجبي والهوكي مش كورة مدورة).", "لكل شكل اسأل: عدد أضلاعه 4؟ وفيه زاوية قائمة؟ ولو الاتنين يبقى في النص.", "اقرأ مخطط Venn: النص هو اللي فيه الدايرتين فوق بعض، والدايرة كلها = الجزء بتاعها + النص، وبره = الأرقام اللي مش في أي دايرة.", "اقرأ جدول العلامات: كل 5 = أربع خطوط وخط مائل. عد بالخمسات، وبعدين اجمع الكل لإجمالي الأطفال.", "اعمل جدول العلامات: عد كل كلمة في القائمة، وزوّد أو قلل بالأزرار لحد ما العلامات تطابق عدد الأصوات.", "المجموع معروف: اجمع التكرارات اللي ظاهرة واطرحها من المجموع عشان تعرف المخفي.", "اطرح الأصغر من الأكبر عشان تعرف الفرق بين الفئتين.", "فكر على خطوات: اقرأ الأعداد، زوّد الأطفال الجداد للفئة، وبعدين اجمع الاتنين.", "ارسم الأعمدة حسب الجدول: كل خط بيعدي بـ 2، وعمود في نص بين خطين يبقى عدد فردي.", "اقرأ ارتفاع العمود من الأرقام على الجنب. لو بين خطين يبقى عدد فردي. والفرق = اطرح.", "الخطوط بتزيد 10: لو العمود في نص بين 30 و40 يبقى 35.", "كل نجمة = 2 وكل نص نجمة = 1. عد بالاتنينات وزوّد 1 لو في نص نجمة.", "كل نجمة = 4 كتب. اقسم عدد الكتب على 4، وكل 2 زيادة = نص نجمة (مثلًا 2.5).", "قارن كل عمود بالرقم المكتوب في الجدول، واحد واحد، لحد ما تلاقي العمود الغلط.", "كل نقطة = طفل. عد النقط فوق الرقم، وبعدين عد كل النقط عشان العدد الكلي.", "الأكتر تكرارًا = الرقم اللي فوقه أكتر نقط. و\"أكتر من\" ما تدخلش الرقم نفسه.", "اقرأ نفس العمود في المخططين (الخطوط بتزيد 4)، وبعدين اطرح.", "إجمالي البنات معروف: اطرح منه البنات اللي اختاروا القطط.", "التكرار هو العدد تحت كل رقم. \"أكتر من\" يعني الأرقام الأكبر بس، اجمع تكراراتها.", "اجمع الأعمدة الأربعة واطرحهم من المجموع الكلي عشان تعرف العمود الناقص، وبعدين قارنه بأطول عمود."];
const main=document.getElementById('main'),nav=document.getElementById('nav');
let solved=0;const secCount={},secDone={};
function updateScore(){
  const _t=(typeof CUR!=='undefined'&&CUR&&CUR.secs)?CUR.secs.reduce((a,k)=>a+secCount[k],0):QS.length,_d=(typeof CUR!=='undefined'&&CUR&&CUR.secs)?CUR.secs.reduce((a,k)=>a+secDone[k],0):solved;
  document.getElementById('score').textContent=(typeof CUR!=='undefined'&&CUR&&!CUR.secs)?'Games':'★ '+_d+' / '+_t;
  document.getElementById('barfill').style.width=(100*_d/Math.max(1,_t))+'%';
  SECTIONS.forEach(s=>{const a=document.getElementById('chip-'+s.id);if(a)a.classList.toggle('done',secDone[s.id]===secCount[s.id]);const c=document.getElementById('cnt-'+s.id);if(c)c.textContent=secDone[s.id]+' / '+secCount[s.id]});
  if(typeof MIS!=='undefined')MIS.forEach(m=>{let d=0,t=0;m.secs&&m.secs.forEach(k=>{d+=secDone[k];t+=secCount[k]});const sv=+ls('t5m'+m.n)||0;if(!CUR||CUR.n!==m.n)d=sv;const e=document.getElementById('st-'+m.n);if(e&&t)e.textContent=d+' / '+t+(d===t?' ★ complete':' questions')});
  MIS.forEach(m=>{if(!m.secs)return;let d=0;m.secs.forEach(k=>d+=secDone[k]);if(CUR&&CUR.n===m.n&&d>(+ls('t5m'+m.n)||0))ls('t5m'+m.n,d)});
  R.solved=solved;R.total=QS.length;queueSave();
  if(_t>0&&_d===_t)document.getElementById('win').classList.add('show');
}
SECTIONS.forEach(s=>{
  secCount[s.id]=QS.filter(q=>q.sec===s.id).length;secDone[s.id]=0;
  const a=document.createElement('a');a.href='#';a.id='chip-'+s.id;a.textContent=s.title;a.onclick=e=>{e.preventDefault();document.getElementById('sec-'+s.id).scrollIntoView({behavior:'smooth',block:'start'})};nav.appendChild(a);
  const sec=document.createElement('section');sec.id='sec-'+s.id;sec.innerHTML='<h2>'+esc(s.title)+' <small id="cnt-'+s.id+'"></small></h2><p class="sub">'+esc(s.sub)+'</p>';main.appendChild(sec);
});
let n=0;const MCOUNT={};
QS.forEach(def=>{
  n++;const sec=document.getElementById('sec-'+def.sec);
  const card=document.createElement('div');card.className='q';sec.appendChild(card);
  let inst,attempts=0,done=false;
  const build=()=>{
    inst=def.gen();attempts=0;
    card.innerHTML='<div class="qh"><div class="num">'+qnum+'</div><div class="prompt">'+(def.tag?'<span class="tag">Think harder</span>':'')+inst.prompt+'</div></div><div class="body"></div>';
    const pr=card.querySelector('.prompt');const ar=document.createElement('div');ar.className='ar';ar.lang='ar';ar.textContent=AR[def.src!=null?def.src:n-1]||'';if(ar.textContent)pr.appendChild(ar);
    const body=card.querySelector('.body');inst.render(body);
    const row=document.createElement('div');row.className='row';
    const chk=document.createElement('button');chk.type='button';chk.textContent='Check';
    const nw=document.createElement('button');nw.type='button';nw.className='ghost';nw.textContent='New numbers';nw.hidden=!!def.fixed;
    const sh=document.createElement('button');sh.type='button';sh.className='ghost';sh.textContent='Show answer';sh.hidden=true;
    const fb=document.createElement('div');fb.className='fb';fb.setAttribute('aria-live','polite');
    row.append(chk,nw,sh);body.append(row,fb);
    const lockAll=()=>{body.querySelectorAll('input').forEach(i=>i.disabled=true);if(inst.lock)inst.lock();chk.disabled=true;nw.hidden=true;sh.hidden=true};
    chk.onclick=()=>{
      if(done)return;
      const r=inst.check();
      if(r.ok){done=true;card.classList.add('ok');fb.className='fb good';fb.textContent='✓ Correct! '+(r.note||'');confetti();lockAll();solved++;secDone[def.sec]++;updateScore()}
      else{attempts++;fb.className='fb bad';fb.textContent='Not yet. '+(r.hint||'Try again.');if(attempts>=2)sh.hidden=false}
    };
    sh.onclick=()=>{fb.className='fb info';fb.textContent='Answer: '+inst.answer+''+(def.fixed?'':'. Press "New numbers" to try another one.');if(inst.c&&inst.c.reveal)inst.c.reveal()};
    nw.onclick=()=>{if(!done)build()};
    body.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')chk.click()}));
  };
  const qnum=(MCOUNT[MISS_OF[def.sec]]=(MCOUNT[MISS_OF[def.sec]]||0)+1);build();
});

/* ---------- Mission Map ---------- */
const MIS=[
 {n:1,id:'mission-1',title:'Sort It!',tag:'VENN AND CARROLL DIAGRAMS',ds:'Tap a card, then tap where it belongs. Sort numbers, sports and shapes. Then play Sort Race.',secs:['sort'],games:[0]},
 {n:2,id:'mission-2',title:'Tally Time',tag:'TALLY CHARTS',ds:'Make a tally, read a tally, then play two tally games.',secs:['tally'],games:[1,2]},
 {n:3,id:'mission-3',title:'Chart Maker',tag:'BAR CHARTS AND PICTOGRAMS',ds:'Build a bar chart, read scales and pictograms, then battle the Data Dragon.',secs:['bar'],games:[4]},
 {n:4,id:'mission-4',title:'Data Detective',tag:'DOT PLOTS AND COMPARING DATA',ds:'Read dot plots, compare two charts, then play Mistake Detective.',secs:['cmp'],games:[3]},
 {n:5,id:'mission-5',title:'Unit 5 Challenge',tag:'FINAL TEST: 10 MIXED QUESTIONS',ds:'Questions on everything in Unit 5, with 2 hard ones. Can you get all 10?',secs:['final'],final:true}];
const mapv=document.createElement('div');mapv.id='mapview';
mapv.innerHTML='<h2 style="font-family:var(--display);font-weight:700;font-size:30px;margin:24px 0 0">🗺️ Mission Map</h2><p style="color:var(--muted);margin:2px 0 0">Tap a mission to play. Do them in order. You can play each mission again.</p><div class="maplist">'+MIS.map(m=>'<a class="mc'+(m.final?' final':'')+'" href="mission-'+m.n+'.html"><span class="no">'+m.n+'</span><span class="em" aria-hidden="true">'+['🧩','📝','📊','🔍','🏆'][m.n-1]+'</span><span class="tx"><b>'+esc(m.title)+'</b><span class="tg">'+esc(m.tag)+'</span><span class="ds">'+esc(m.ds)+'</span><span class="st" id="st-'+m.n+'"></span></span><span class="go">PLAY</span></a>').join('')+'</div>';
nav.style.display='none';nav.before(mapv);document.getElementById('sec-games').hidden=true;
const GC=[...gamesEl.children];const missionEls=[];
MIS.forEach(m=>{const c=document.createElement('div');c.className='mission';c.id=m.id;
  c.innerHTML='<div class="mhead"><img alt="" src="logo.png"><span>Year 4 · Unit 5</span></div><a class="back" href="index.html">← Mission Map</a><h2 style="font-family:var(--display);font-weight:700;font-size:28px;margin:6px 0 0">'+m.n+'. '+esc(m.title)+'</h2>';
  (m.games||[]).forEach(g=>{const w=document.createElement('div');w.className='games';w.appendChild(GC[g]);c.appendChild(w)});
  (m.secs||[]).forEach(k=>c.appendChild(document.getElementById('sec-'+k)));
  main.appendChild(c);missionEls.push(c)});
const PAGE=document.body.dataset.page||'map';const CUR=MIS.find(x=>'m'+x.n===PAGE)||null;
mapv.classList.toggle('off',!!CUR);missionEls.forEach(c=>c.classList.toggle('on',!!CUR&&c.id===CUR.id));
if(CUR){document.title='ThinkUp Y4 Unit 5 · '+CUR.title;const hp=document.querySelector('header p');if(hp)hp.textContent='Mission '+CUR.n+': '+CUR.title}
updateScore();

showResult();
/* floating send button + version */
(function(){const b=document.createElement('button');b.type='button';b.id='fsend';b.textContent='📤 Send my result';
b.onclick=()=>{const c=document.getElementById('resultcard');if(c){c.classList.add('show');c.scrollIntoView({behavior:'smooth',block:'center'})}};document.body.appendChild(b);
const f=document.querySelector('footer');if(f){const v=document.createElement('div');v.style.cssText='font-size:11px;opacity:.6;margin-top:8px';v.textContent='Version 3';f.appendChild(v)}})();
})();
