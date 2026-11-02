(function(){
"use strict";
function pad(n){return String(n).padStart(2,"0")}
function key(d){d=d||new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function parse(k){var p=k.split("-");return new Date(+p[0],p[1]-1,+p[2],12)}
function next(k,n){var d=parse(k);d.setDate(d.getDate()+(n===undefined?1:n));return key(d)}
function diff(a,b){return Math.round((parse(b)-parse(a))/864e5)}
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var LS="hunter-state",LC="hunter-cfg",PC=window.hunter||null;
var CUSTOM_CAP=60;
var PRESET={shop:{t:"Прогулка в магазин",stats:["vit"],xp:10,once:false},cook:{t:"Приготовить еду",stats:[],xp:15,once:false},hair:{t:"Стрижка",stats:["cha","vit"],xp:20,once:true}};
function fresh(){var t=key();return{v:2,start:t,lastRoll:t,days:{},gates:{},pen:{},paid:{},dec:{},decAt:{},log:[],ratings:{},custom:JSON.parse(JSON.stringify(PRESET))}}
var S=fresh(),CFG={owner:"andryxax922x-sudo",repo:"hunter-data",token:"",folder:"D:\\My movie\\Create\\Hunter"},tab="today";
try{S=JSON.parse(localStorage.getItem(LS))||S}catch(e){}
try{Object.assign(CFG,JSON.parse(localStorage.getItem(LC))||{})}catch(e){}
if(!S.custom)S.custom=JSON.parse(JSON.stringify(PRESET));
function lvlFrom(xp){var l=1,need=350;while(xp>=need){xp-=need;l++;need=350+42*(l-1)}return{l:l,cur:xp,need:need}}
function rankOf(l){return l>=70?"S":l>=50?"A":l>=35?"B":l>=20?"C":l>=10?"D":"E"}
function D(k){k=k||key();return S.days[k]||(S.days[k]={done:{},water:0,breaks:0,meals:[],u:0})}
function questsFor(k){
 var w=parse(k).getDay(),q=[];
 function a(id,t,s,xp,hard,mode,sub){q.push({id:id,t:t,s:s,xp:xp,hard:hard,mode:mode,sub:sub})}
 a("water","Вода: 6 стаканов","vit",20,true,"water","Киссон рядом с рабочим местом");
 if(w===6){a("family","День с родителями и прогулка","cha",40,true,"tick")}
 else{
  if(w!==0)a("breakfast","Завтрак до 10:30","vit",20,true,"meal","Фото или отметка");
  if(w!==0)a("lunch","Обед с фото","vit",30,true,"photo","Закроется, когда Система получит фото");
  a("workout","Тренировка: "+EX[PLAN[w]].n,/flex|long/.test(PLAN[w])?"flx":"str",50,true,"workout","Закроется после таймера");
  a("tidy","Порядок 10 минут: "+CHORE[w],"wil",25,true,"tick");
  a("money","Записать траты за день","gold",15,true,"money");
  a("read","Чтение 15 минут вместо серии","int",25,true,"tick");
 }
 if(w>=1&&w<=5)a("breaks","Перерывы: 3 раза встать и размяться","vit",15,false,"breaks");
 a("sleep","Лечь до 24:00","vit",15,false,"tick");
 a("nocaf","Без энергетика и кофе после 15:00","vit",10,false,"tick");
 if(w!==6)a("step","25 минут на идею дохода","gold",30,false,"tick");
 if(w!==6)a("social","Один короткий контакт: написать другу или брату, спросить что-то в магазине","cha",20,false,"tick");
 if(w===0)a("review","Итог недели: что сработало, что менять","wil",40,true,"tick");
 return q;
}
function isDone(k,q){var d=S.days[k];return !!(d&&d.done&&d.done[q.id])}
function totals(){
 var xp=0,pts={},train={};
 Object.keys(S.days).sort().forEach(function(k){questsFor(k).forEach(function(q){if(isDone(k,q)){xp+=q.xp;pts[q.s]=(pts[q.s]||0)+10;train[q.s]=k}});
  var cu=S.days[k].cust||{},sum=0;Object.keys(cu).forEach(function(id){var c=S.custom[id];if(!c)return;for(var i=0;i<cu[id];i++){if(sum+c.xp>CUSTOM_CAP)continue;sum+=c.xp;xp+=c.xp;c.stats.forEach(function(s){pts[s]=(pts[s]||0)+5;train[s]=k})}})});
 GATES.forEach(function(g){if(S.gates[g.id]){xp+=g.xp;pts[g.s]=(pts[g.s]||0)+20;if(!train[g.s]||train[g.s]<S.gates[g.id])train[g.s]=S.gates[g.id]}});
 Object.keys(S.pen).forEach(function(k){xp-=S.pen[k].lost});
 return{xp:Math.max(0,xp),pts:pts,train:train};
}
function stat(k,t){return Math.max(1,STATS[k].base+Math.floor((t.pts[k]||0)/STATS[k].cost)-(S.dec[k]||0))}
function setDone(k,q,val){var d=D(k);if(!!d.done[q.id]===val)return;d.done[q.id]=val;if(!val)delete d.done[q.id];if(val)flash("+"+q.xp+" XP · "+STATS[q.s].n)}
function pending(){var ks=Object.keys(S.pen).filter(function(k){return!S.paid[k]}).sort();return ks.length?ks[ks.length-1]:null}
function roll(){
 var t=key();if(S.lastRoll>=t)return false;var d=S.lastRoll,p=0,tt;
 while(d<t){
  if(d!==S.start&&p<3&&!S.pen[d]){var day=S.days[d];
   if(!(day&&day.shield)){var miss=questsFor(d).filter(function(q){return q.hard&&!isDone(d,q)}).length;
    if(miss){p++;var lost=15*miss+(pending()?50:0);S.pen[d]={n:miss,lost:lost};S.log.unshift(d+": пропущено квестов "+miss+", −"+lost+" XP")}}}
  d=next(d);
 }
 tt=totals();Object.keys(STATS).forEach(function(k){var last=tt.train[k]||S.start,at=S.decAt[k]||S.start;if(diff(last,t)>=7&&diff(at,t)>=7&&stat(k,tt)>1){S.dec[k]=(S.dec[k]||0)+1;S.decAt[k]=t;S.log.unshift(t+": "+STATS[k].n+" −1, неделя без тренировки")}});
 S.log=S.log.slice(0,30);S.lastRoll=t;return true;
}
function store(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
function mut(fn,k){fn();D(k||key()).u=Date.now();S.touched=Date.now();store();render()}
var tT;function flash(t){var e=$("toast");e.textContent=t;e.hidden=false;clearTimeout(tT);tT=setTimeout(function(){e.hidden=true},2500)}

/* Синхронизация через личный закрытый репозиторий GitHub */
function merge(a,b){
 var r=JSON.parse(JSON.stringify(a));
 Object.keys(b.days||{}).forEach(function(k){var x=r.days[k],y=b.days[k];if(!x){r.days[k]=y;return}
  var ids={},m=[];(x.meals||[]).concat(y.meals||[]).forEach(function(e){if(!ids[e.id]){ids[e.id]=1;m.push(e)}});
  if((y.u||0)>(x.u||0))r.days[k]=JSON.parse(JSON.stringify(y));r.days[k].meals=m});
 ["gates","pen","paid","ratings","custom"].forEach(function(f){r[f]=Object.assign({},b[f]||{},r[f]||{})});
 Object.keys(b.custom||{}).forEach(function(i){if(b.custom[i].del&&r.custom[i])r.custom[i].del=true});
 Object.keys(b.dec||{}).forEach(function(k){if((b.dec[k]||0)>(r.dec[k]||0)){r.dec[k]=b.dec[k];r.decAt[k]=(b.decAt||{})[k]}});
 r.start=a.start<b.start?a.start:b.start;r.lastRoll=a.lastRoll>b.lastRoll?a.lastRoll:b.lastRoll;
 var u={};r.log=(a.log||[]).concat(b.log||[]).filter(function(l){if(u[l])return false;u[l]=1;return true}).sort().reverse().slice(0,30);
 return r;
}
function api(path,opt){opt=opt||{};opt.headers=Object.assign({Authorization:"Bearer "+CFG.token,Accept:"application/vnd.github+json"},opt.headers||{});opt.cache="no-store";return fetch("https://api.github.com/repos/"+CFG.owner+"/"+CFG.repo+"/contents/"+path,opt)}
function b64e(s){return btoa(unescape(encodeURIComponent(s)))}
function b64d(s){return decodeURIComponent(escape(atob(s.replace(/\n/g,""))))}
var syncing=false;
function sync(){
 if(!CFG.token){$("sync").textContent="Синхронизация не настроена";return Promise.resolve()}
 if(syncing||!navigator.onLine)return Promise.resolve();syncing=true;$("sync").textContent="Синхронизирую…";
 return api("state.json").then(function(r){
  if(r.status===404)return null;if(!r.ok)throw new Error(r.status);return r.json();
 }).then(function(f){
  var remote=f?JSON.parse(b64d(f.content)):null,merged=remote?merge(S,remote):S,txt=JSON.stringify(merged);
  S=merged;store();
  if(remote&&txt===JSON.stringify(remote))return;
  return api("state.json",{method:"PUT",body:JSON.stringify({message:"sync",content:b64e(txt),sha:f?f.sha:undefined})}).then(function(r){if(!r.ok)throw new Error(r.status)});
 }).then(function(){return api("ratings.json")}).then(function(r){return r.ok?r.json():null}).then(function(f){
  if(f){S.ratings=JSON.parse(b64d(f.content));store()}
  $("sync").textContent="Синхронизировано в "+new Date().toTimeString().slice(0,5);render();
 }).catch(function(e){$("sync").textContent="Нет синхронизации: "+(e.message==="401"?"проверь токен":"нет связи")}).then(function(){syncing=false});
}
function toJpeg(blob){return createImageBitmap(blob).then(function(bm){var s=Math.min(1,1280/Math.max(bm.width,bm.height)),c=document.createElement("canvas");c.width=bm.width*s;c.height=bm.height*s;c.getContext("2d").drawImage(bm,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.82).split(",")[1]})}
function addPhoto(blob,slot,when){
 when=when||new Date();var k=key(when),id=k+"_"+pad(when.getHours())+pad(when.getMinutes())+pad(when.getSeconds())+"_"+({"Завтрак":"breakfast","Обед":"lunch","Ужин":"dinner","Перекус":"snack"}[slot]||"meal");
 return toJpeg(blob).then(function(b64){
  function local(){mut(function(){var d=D(k);d.meals=d.meals||[];d.meals.push({id:id,slot:slot});var qid=slot==="Завтрак"?"breakfast":slot==="Обед"?"lunch":null,q=qid&&questsFor(k).filter(function(x){return x.id===qid})[0];if(q)setDone(k,q,true)},k)}
  if(!CFG.token){local();flash("Фото принято. Оценка заработает после настройки");return}
  return api("inbox/"+id+".jpg",{method:"PUT",body:JSON.stringify({message:"photo",content:b64})}).then(function(r){if(!r.ok)throw new Error("upload");local();flash("Фото отправлено на оценку");sync()});
 });
}
function slotBy(h){return h<11?"Завтрак":h<16?"Обед":h<22?"Ужин":"Перекус"}

function directive(){
 var k=key(),now=new Date(),m=now.getHours()*60+now.getMinutes(),w=now.getDay(),qs=questsFor(k),hard=qs.filter(function(q){return q.hard&&!isDone(k,q)});
 function open(id){return qs.some(function(q){return q.id===id&&!isDone(k,q)})}
 if(D(k).shield)return"Форс-мажор принят. Сегодня штрафа нет. Береги себя.";
 if(pending())return"Сначала штрафная зона. Потом всё остальное.";
 if(!hard.length)return"Все обязательные квесты закрыты. Вечер свободен.";
 if(w===6)return"Суббота для семьи. Вода и время с родителями, остальное подождёт.";
 if(m<630&&open("breakfast"))return"Съешь завтрак до работы и налей первый стакан воды.";
 if(m>=780&&m<870&&open("lunch"))return"Время обеда. Сфотографируй тарелку перед едой.";
 if(m>=1035&&m<1080&&open("workout"))return"Рабочий день окончен. Вода, потом тренировка. Успеешь до L2.";
 if(m>=1080&&open("workout"))return"Тренировка не закрыта. Сделай её до входа в игру.";
 if(m>=1320)return"Осталось квестов: "+hard.length+". Закрой их до полуночи.";
 if(m<1020)return"Рабочее время. Следи за водой и вставай на перерывы.";
 return"Осталось квестов: "+hard.length+". Ближайший: "+hard[0].t+".";
}
function renderHead(){
 var t=totals(),L=lvlFrom(t.xp);$("rank").textContent=rankOf(L.l);$("lvl").textContent="Уровень "+L.l;$("title").textContent="Охотник ранга "+rankOf(L.l);$("xpt").textContent=L.cur+" / "+L.need+" XP";$("xpb").style.width=(100*L.cur/L.need)+"%";$("say").textContent=directive();
 var p=$("penalty"),pk=pending();
 if(pk){p.innerHTML='<section class="win penalty"><h2>Штрафная зона</h2><p>Квесты не закрыты: '+S.pen[pk].n+'. Задание: 15 минут уборки и 30 приседаний. Пока оно не выполнено, L2 не запускаем.</p><div><button class="btn red" id="payp">Штраф отработан</button></div></section>';$("payp").onclick=function(){mut(function(){Object.keys(S.pen).forEach(function(k){S.paid[k]=1});flash("Штраф закрыт")})}}else p.innerHTML="";
}
var TABS=[["today","Сегодня"],["train","Тренировка"],["food","Питание"],["status","Статус"],["rules","Правила"],["setup","Настройки"]];
function renderNav(){var n=$("nav");n.innerHTML="";TABS.forEach(function(t){var b=document.createElement("button");b.textContent=t[1];b.setAttribute("role","tab");b.setAttribute("aria-selected",t[0]===tab);b.onclick=function(){go(t[0])};n.appendChild(b)})}
function go(t){if(tab==="train"&&t!=="train")camStop();tab=t;render()}
function qRow(k,q){
 var d=D(k),done=isDone(k,q),auto=["workout","water","breaks","money","photo"].indexOf(q.mode)>=0;
 var h='<div class="q'+(done?" done":"")+'"><button class="box" data-q="'+q.id+'" aria-label="Отметить: '+esc(q.t)+'" '+(auto?"disabled":"")+'>'+(done?"✓":"")+'</button><div style="min-width:0"><div class="t">'+esc(q.t)+'</div>';
 if(q.hard)h+='<span class="hardtag">ОБЯЗАТЕЛЬНО</span> ';if(q.sub)h+='<span class="sub">'+esc(q.sub)+'</span>';
 if(q.mode==="water")h+='<div class="counter"><button class="btn mini" data-w="-1" aria-label="Убрать стакан">−</button><span class="mono">'+d.water+' / 6</span><button class="btn mini" data-w="1" aria-label="Добавить стакан">+</button></div>';
 if(q.mode==="breaks")h+='<div class="counter"><button class="btn mini" data-b="-1" aria-label="Убрать перерыв">−</button><span class="mono">'+d.breaks+' / 3</span><button class="btn mini" data-b="1" aria-label="Добавить перерыв">+</button></div>';
 if(q.mode==="money")h+='<div class="counter"><input type="number" id="spend" min="0" inputmode="numeric" placeholder="Сумма" value="'+(d.spent!=null?d.spent:"")+'"><button class="btn mini" id="spendok">Записать</button></div>';
 if(q.mode==="workout")h+='<div class="counter"><button class="btn mini" data-go="train">Открыть</button></div>';
 if(q.mode==="photo"||q.mode==="meal")h+='<div class="counter"><button class="btn mini" data-go="food">Фото</button></div>';
 return h+'</div><span class="xp">+'+q.xp+'</span></div>';
}
function weekHtml(){var t=key(),mon=next(t,-((parse(t).getDay()+6)%7)),h="";for(var i=0;i<7;i++){var k=next(mon,i),qs=questsFor(k).filter(function(q){return q.hard}),n=qs.filter(function(q){return isDone(k,q)}).length,c="day";if(k===t)c+=" now";if(k<=t&&k>=S.start){if(n===qs.length)c+=" good";else if(k<t&&!(S.days[k]&&S.days[k].shield))c+=" bad"}h+='<div class="'+c+'">'+WD[parse(k).getDay()]+'<b>'+(k>t||k<S.start?"–":n+"/"+qs.length)+'</b></div>'}return h}
function customSum(k){var cu=D(k).cust||{},n=0;Object.keys(cu).forEach(function(id){if(S.custom[id])n+=S.custom[id].xp*cu[id]});return Math.min(n,CUSTOM_CAP)}
function everDone(id){return Object.keys(S.days).some(function(k){return(S.days[k].cust||{})[id]>0})}
function customHtml(k){
 var cu=D(k).cust||{},ids=Object.keys(S.custom).filter(function(id){var c=S.custom[id];return!c.del&&!(c.once&&everDone(id)&&!cu[id])});
 var h='<section class="win"><div class="row between"><h2>Мои задачи</h2><span class="mono dim">'+customSum(k)+' / '+CUSTOM_CAP+' XP</span></div><p class="small dim">Нажми +, когда сделал. За день эти задачи дают не больше '+CUSTOM_CAP+' XP и на штрафы не влияют.</p><div>';
 h+=ids.length?ids.map(function(id){var c=S.custom[id],n=cu[id]||0,tag=(c.stats.length?c.stats.map(function(s){return STATS[s].n}).join(", "):"Только опыт")+(c.once?" · разовая":"");return'<div class="q"><button class="btn mini" data-cadd="'+id+'" aria-label="Выполнено: '+esc(c.t)+'" style="padding:2px 0;width:30px;min-width:0">+</button><div style="min-width:0"><div class="t">'+esc(c.t)+(n?' <span class="mono ok">×'+n+'</span>':'')+'</div><span class="sub">'+esc(tag)+'</span><div class="counter">'+(n?'<button class="btn ghost mini" data-cundo="'+id+'">Отменить</button>':'')+'<button class="btn ghost mini" data-cdel="'+id+'">Удалить</button></div></div><span class="xp">+'+c.xp+'</span></div>'}).join(""):'<p class="small dim">Список пуст. Добавь первую задачу ниже.</p>';
 h+='</div><div style="display:grid;gap:8px;margin-top:10px;border-top:1px solid var(--line);padding-top:10px"><h3>Новая задача</h3><input type="text" id="cname" maxlength="60" placeholder="Например, сходить на почту" aria-label="Название задачи"><div class="row">'+Object.keys(STATS).map(function(s){return'<label class="small row" style="gap:4px"><input type="checkbox" class="cst" value="'+s+'">'+STATS[s].n+'</label>'}).join("")+'</div><div class="row"><select id="cxp" aria-label="Награда"><option value="10">Мелкая: 10 XP</option><option value="20">Средняя: 20 XP</option><option value="30">Большая: 30 XP</option></select><select id="conce" aria-label="Тип"><option value="">Многоразовая</option><option value="1">Разовая</option></select><button class="btn" id="cadd">Добавить</button></div><p class="small dim">Выбери до двух характеристик или ни одной, тогда будет только опыт.</p></div></section>';
 return h;
}
function renderToday(v){
 var k=key(),qs=questsFor(k),hard=qs.filter(function(q){return q.hard}),soft=qs.filter(function(q){return!q.hard}),nd=hard.filter(function(q){return isDone(k,q)}).length,gates=GATES.filter(function(g){return!S.gates[g.id]});
 v.innerHTML='<div class="cols"><div class="stack"><section class="win"><div class="row between"><h2>Ежедневный квест</h2><span class="mono dim">'+nd+'/'+hard.length+'</span></div>'+(k===S.start?'<p class="small dim">Первый день без штрафов.</p>':'')+'<div>'+hard.map(function(q){return qRow(k,q)}).join("")+'</div></section><section class="win"><h2>По желанию</h2><div>'+soft.map(function(q){return qRow(k,q)}).join("")+'</div></section>'+customHtml(k)+'</div><div class="stack"><section class="win"><h2>Эта неделя</h2><div class="week" style="margin-top:8px">'+weekHtml()+'</div></section><section class="win"><h2>Врата</h2><p class="small dim">Разовые задания с большой наградой.</p><div>'+(gates.length?gates.map(function(g){return'<div class="q"><button class="box" data-g="'+g.id+'" aria-label="Выполнено: '+esc(g.t)+'"></button><div style="min-width:0"><div class="t">'+esc(g.t)+'</div><span class="sub">'+esc(g.due||g.sub||"")+'</span></div><span class="xp">+'+g.xp+'</span></div>'}).join(""):'<p class="small dim">Все Врата закрыты.</p>')+'</div></section><section class="win"><h2>Форс-мажор</h2><p class="small dim">Тревога, нет света, болезнь. День не штрафуется.</p><div style="margin-top:8px"><button class="btn ghost" id="shield">'+(D(k).shield?"Отменить":"Включить на сегодня")+'</button></div></section></div></div>';
 function Q(id){return qs.filter(function(x){return x.id===id})[0]}
 v.querySelectorAll("[data-q]").forEach(function(b){b.onclick=function(){var q=Q(b.dataset.q);mut(function(){setDone(k,q,!isDone(k,q))})}});
 v.querySelectorAll("[data-w]").forEach(function(b){b.onclick=function(){mut(function(){var d=D(k);d.water=Math.max(0,d.water+ +b.dataset.w);setDone(k,Q("water"),d.water>=6)})}});
 v.querySelectorAll("[data-b]").forEach(function(b){b.onclick=function(){mut(function(){var d=D(k);d.breaks=Math.max(0,d.breaks+ +b.dataset.b);setDone(k,Q("breaks"),d.breaks>=3)})}});
 v.querySelectorAll("[data-go]").forEach(function(b){b.onclick=function(){go(b.dataset.go)}});
 v.querySelectorAll("[data-g]").forEach(function(b){b.onclick=function(){var g=GATES.filter(function(x){return x.id===b.dataset.g})[0];mut(function(){S.gates[g.id]=k;flash("Врата закрыты: +"+g.xp+" XP")})}});
 v.querySelectorAll("[data-cadd]").forEach(function(b){b.onclick=function(){var id=b.dataset.cadd,c=S.custom[id];mut(function(){var d=D(k);d.cust=d.cust||{};var before=customSum(k);d.cust[id]=(d.cust[id]||0)+1;var got=customSum(k)-before;flash(got>0?"+"+got+" XP · "+c.t:"Дневной лимит своих задач достигнут")})}});
 v.querySelectorAll("[data-cundo]").forEach(function(b){b.onclick=function(){var id=b.dataset.cundo;mut(function(){var d=D(k);d.cust[id]=Math.max(0,(d.cust[id]||0)-1)})}});
 v.querySelectorAll("[data-cdel]").forEach(function(b){b.onclick=function(){var id=b.dataset.cdel;mut(function(){S.custom[id].del=true})}});
 $("cadd").onclick=function(){var t=$("cname").value.trim(),st=[].slice.call(document.querySelectorAll(".cst:checked")).map(function(x){return x.value});if(!t)return flash("Введи название задачи");if(st.length>2)return flash("Выбери не больше двух характеристик");mut(function(){S.custom["c"+Date.now().toString(36)]={t:t,stats:st,xp:+$("cxp").value,once:!!$("conce").value};flash("Задача добавлена")})};
 var ok=$("spendok");if(ok)ok.onclick=function(){var val=$("spend").value;if(val==="")return flash("Введи сумму, 0 тоже подходит");mut(function(){var d=D(k);d.spent=+val;setDone(k,Q("money"),true)})};
 $("shield").onclick=function(){mut(function(){var d=D(k);d.shield=!d.shield})};
}
var T={i:0,left:0,run:false,h:null,rest:false,view:0};
function plan(){var w=new Date().getDay();return PLAN[w]!==undefined?EX[PLAN[w]]:null}
function beep(){try{var a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.08;o.start();o.stop(a.currentTime+.18)}catch(e){}}
function fmt(s){return pad(Math.floor(s/60))+":"+pad(s%60)}
function renderTrain(v){
 var p=plan();if(!p){v.innerHTML='<section class="win"><h2>Суббота</h2><p>Тренировки нет. Твоя нагрузка сегодня: прогулка с родителями.</p></section>';return}
 var k=key(),qw=questsFor(k).filter(function(q){return q.id==="workout"})[0],done=qw&&isDone(k,qw),total=p.ex.reduce(function(a,e){return a+e[1]+15},0);
 if(T.left===0&&!T.run)T.left=p.ex[T.i][1];var cur=p.ex[T.i];
 v.innerHTML='<div class="cols"><div class="stack"><section class="win timer"><h2>'+esc(p.n)+'</h2><div class="small dim">'+(T.rest?"Отдых. Дальше: ":"Упражнение "+(T.i+1)+" из "+p.ex.length)+'</div><h3 style="font-size:1.2rem">'+esc(cur[0])+'</h3><div id="fig"></div><div class="clock" id="clock">'+fmt(T.left)+'</div><p class="small dim">'+esc(cur[2])+'</p><div class="row" style="justify-content:center"><button class="btn" id="tgo">'+(T.run?"Пауза":done?"Повторить":"Старт")+'</button><button class="btn ghost" id="tskip">Дальше</button></div>'+(done?'<p class="small ok">Сегодняшняя тренировка закрыта.</p>':'<p class="small dim">Квест закроется после последнего упражнения.</p>')+'</section><section class="win"><div class="row between"><h2>Камера</h2><button class="btn mini" id="camb">'+(CAM.run?"Выключить":"Включить")+'</button></div><p class="small dim">Встань боком, всё тело в кадре. Видео остаётся на этом устройстве.</p><div class="camwrap" id="cw" style="margin-top:8px" '+(CAM.run?"":"hidden")+'><video id="cv" muted playsinline></video><canvas id="cc"></canvas></div><div class="hud" id="hud" style="margin-top:8px"></div><p class="small" id="cmsg"></p></section></div><section class="win"><div class="row between"><h2>План</h2><span class="mono dim">≈'+Math.round(total/60)+' мин</span></div><p class="small dim">Нажми на упражнение, чтобы посмотреть движение.</p><div>'+p.ex.map(function(e,i){return'<button class="ex '+(i===T.i?"cur":i<T.i?"past":"")+'" data-ex="'+i+'" style="width:100%;background:none;border-width:1px 0 0;border-color:#1a2d52;color:inherit;text-align:left"><span class="mono small">'+fmt(e[1])+'</span><span>'+esc(e[0])+'</span><span></span></button>'}).join("")+'</div><p class="small dim" style="margin-top:8px">Тянет можно. Острая боль в пояснице или суставе означает стоп.</p></section></div>';
 mountFig($("fig"),figKey(T.view!=null&&!T.run?p.ex[T.i][0]:cur[0]));
 $("tgo").onclick=function(){T.run?pause():start()};$("tskip").onclick=function(){step(true)};
 v.querySelectorAll("[data-ex]").forEach(function(b){b.onclick=function(){mountFig($("fig"),figKey(p.ex[+b.dataset.ex][0]))}});
 function camUi(m){var r=CAM.rule,h=$("hud");if(!h)return;h.innerHTML='<span>'+(r.t==="reps"?"Повторы: "+CAM.reps:"Время: "+Math.floor(CAM.hold)+" с")+'</span><span class="'+(m.ok?"ok":"warn")+'">'+(m.ok?"Правильно":"Поправь")+'</span>';$("cmsg").textContent=m.text}
 if(CAM.run)camRebind($("cv"),$("cc"),figKey(cur[0]));
 $("camb").onclick=function(){if(CAM.run){camStop();render();return}$("cw").hidden=false;$("camb").textContent="Выключить";
  camStart($("cv"),$("cc"),figKey(cur[0]),camUi)
  .catch(function(){$("cw").hidden=true;$("camb").textContent="Включить";$("cmsg").textContent="Камера недоступна. Разреши доступ к камере в настройках устройства."})};
}
function start(){T.run=true;beep();try{navigator.wakeLock&&navigator.wakeLock.request("screen").catch(function(){})}catch(e){}T.h=setInterval(tick,1000);render()}
function pause(){T.run=false;clearInterval(T.h);render()}
function tick(){T.left--;if(T.left<=0){beep();step(false);return}var c=$("clock");if(c)c.textContent=fmt(T.left)}
function step(skip){
 var p=plan();if(!p)return;
 if(!T.rest&&!skip){if(T.i>=p.ex.length-1){finish();return}T.rest=true;T.left=15;T.i++;render();return}
 if(T.rest){T.rest=false;T.left=p.ex[T.i][1];render();return}
 if(T.i>=p.ex.length-1){flash("Пропуск не закрывает квест");clearInterval(T.h);T.run=false;T.i=0;T.left=p.ex[0][1];render();return}
 T.i++;T.left=p.ex[T.i][1];render();
}
function finish(){clearInterval(T.h);T.run=false;T.rest=false;T.i=0;T.left=0;var k=key(),q=questsFor(k).filter(function(x){return x.id==="workout"})[0];mut(function(){if(q)setDone(k,q,true)})}
function renderFood(v){
 var k=key(),d=D(k),m=d.meals||[],r=m.map(function(x){return S.ratings[x.id]}).filter(Boolean),avg=r.length?(r.reduce(function(a,x){return a+(+x.score||0)},0)/r.length).toFixed(1):"–",lo=r.reduce(function(a,x){return a+(+x.kmin||0)},0),hi=r.reduce(function(a,x){return a+(+x.kmax||0)},0),pr=r.reduce(function(a,x){return a+(+x.protein||0)},0);
 v.innerHTML='<div class="cols"><section class="win"><h2>Фото еды</h2><p class="small dim">'+(PC?"Выбери файл здесь или положи фото в папку "+esc(CFG.folder)+".":"Сфотографируй тарелку сверху.")+' Оценка придёт при следующей проверке. Калории по фото примерные.</p><div class="row" style="margin-top:8px"><select id="slot" aria-label="Приём пищи">'+["Завтрак","Обед","Ужин","Перекус"].map(function(s){return'<option'+(s===slotBy(new Date().getHours())?" selected":"")+'>'+s+'</option>'}).join("")+'</select><input id="mfile" type="file" accept="image/*" capture="environment" hidden><button class="btn" id="mbtn">Добавить фото</button></div><p class="small" id="mout" style="margin-top:8px"></p></section><section class="win"><h2>Сегодня</h2><div class="row between" style="margin-top:6px"><span>Средняя оценка</span><span class="mono">'+avg+'</span></div><div class="row between"><span>Калории</span><span class="mono">'+(r.length?lo+"–"+hi:"–")+'</span></div><div class="row between"><span>Белок</span><span class="mono">'+(r.length?"≈"+pr+" г":"–")+'</span></div><div style="margin-top:8px">'+(m.length?m.map(function(x){var a=S.ratings[x.id];if(!a)return'<div class="meal"><div class="score">…</div><div><b>'+esc(x.slot)+'</b><div class="small dim">Ждёт оценки</div></div></div>';var s=+a.score;return'<div class="meal"><div class="score '+(s<5?"low":s>=8?"high":"")+'">'+esc(a.score)+'</div><div style="min-width:0"><b>'+esc(x.slot)+'</b>: '+esc(a.name)+'<div class="small dim">'+esc(a.kmin)+'–'+esc(a.kmax)+' ккал, белок ≈'+esc(a.protein)+' г</div><div class="small">'+esc(a.fix)+'</div></div></div>'}).join(""):'<p class="small dim">Пока нет ни одной тарелки.</p>')+'</div></section></div>';
 $("mbtn").onclick=function(){$("mfile").click()};
 $("mfile").onchange=function(e){var f=e.target.files[0];if(!f)return;$("mout").textContent="Отправляю…";addPhoto(f,$("slot").value).catch(function(){var o=$("mout");if(o)o.textContent="Не отправилось. Проверь интернет и повтори."})};
}
function renderStatus(v){
 var t=totals(),k=key(),sp=0,all=[];for(var i=0;i<7;i++){var e=S.days[next(k,-i)];if(e&&e.spent)sp+=e.spent;if(e&&e.meals)e.meals.forEach(function(m){if(S.ratings[m.id])all.push(S.ratings[m.id])})}
 var avg=all.length?(all.reduce(function(a,x){return a+(+x.score||0)},0)/all.length).toFixed(1):"–";
 v.innerHTML='<div class="cols"><section class="win"><h2>Характеристики</h2><div style="margin-top:6px">'+Object.keys(STATS).map(function(s){var val=stat(s,t);return'<div class="stat"><b>'+STATS[s].n+'</b><span class="v">'+val+'</span><div class="bar"><i style="width:'+Math.min(100,val)+'%"></i></div><span class="why">'+STATS[s].why+'</span></div>'}).join("")+'</div></section><div class="stack"><section class="win"><h2>За 7 дней</h2><div class="row between" style="margin-top:6px"><span>Средняя оценка еды</span><span class="mono">'+avg+'</span></div><div class="row between"><span>Записанные траты</span><span class="mono">'+sp+'</span></div></section><section class="win"><h2>Журнал Системы</h2>'+(S.log.length?'<ul class="plain small">'+S.log.map(function(l){return"<li>"+esc(l)+"</li>"}).join("")+'</ul>':'<p class="small dim">Штрафов и потерь пока нет.</p>')+'</section></div></div>';
}
function renderRules(v){v.innerHTML='<section class="win"><h2>Как работает Система</h2><ul class="plain"><li>Опыт идёт за квесты. Обязательные решают исход дня.</li><li>Ранги: E с 1 уровня, D с 10, C с 20, B с 35, A с 50, S с 70.</li><li>Характеристика растёт примерно на 1 за две недели регулярных квестов.</li><li>Навык без тренировки 7 дней теряет 1 пункт.</li></ul></section><section class="win"><h2>Последствия</h2><ul class="plain"><li>За каждый незакрытый обязательный квест минус 15 XP. Уровень может упасть.</li><li>На следующий день открывается штрафная зона: 15 минут уборки и 30 приседаний до входа в L2.</li><li>Неотработанный штраф при новом пропуске стоит ещё 50 XP.</li><li>Пропуск многих дней считается максимум за 3 дня.</li><li>Форс-мажор снимает штраф за день. Используй его честно.</li></ul></section>'}
function renderSetup(v){
 v.innerHTML='<section class="win"><h2>Синхронизация</h2><p class="small dim">Токен хранится только на этом устройстве. Данные обновляются раз в 5 минут и по кнопке «Синхр.».</p><div style="display:grid;gap:8px;margin-top:8px"><label class="f">Владелец<input type="text" id="cowner" value="'+esc(CFG.owner)+'"></label><label class="f">Репозиторий данных<input type="text" id="crepo" value="'+esc(CFG.repo)+'"></label><label class="f">Токен GitHub<input type="password" id="ctok" value="'+esc(CFG.token)+'" autocomplete="off"></label>'+(PC?'<label class="f">Папка для фото<input type="text" id="cfold" value="'+esc(CFG.folder)+'"></label>':'')+'<div><button class="btn" id="csave">Сохранить и проверить</button></div></div></section>'+(PC?'<section class="win"><h2>Запуск</h2><p class="small">Программа запускается вместе с Windows и живёт в трее. Крестик сворачивает её, выход через значок в трее.</p></section>':'<section class="win"><h2>Закладка на телефоне</h2><p class="small">Открой этот адрес в браузере и добавь его в закладки. Токен нужно ввести один раз на этом телефоне.</p></section>');
 $("csave").onclick=function(){CFG.owner=$("cowner").value.trim();CFG.repo=$("crepo").value.trim();CFG.token=$("ctok").value.trim();if($("cfold")){CFG.folder=$("cfold").value.trim();PC.setFolder(CFG.folder)}try{localStorage.setItem(LC,JSON.stringify(CFG))}catch(e){}sync();flash("Сохранено")};
}
function render(){renderHead();renderNav();({today:renderToday,train:renderTrain,food:renderFood,status:renderStatus,rules:renderRules,setup:renderSetup}[tab])($("view"))}

/* Напоминания на ПК: приходят только по незакрытым квестам */
var SCH=[["10:30",[1,2,3,4,5],"breaks","Перерыв","Встань, разомни ноги и спину, выпей воды."],["13:00",[1,2,3,4,5],"lunch","Обед","Положи фото тарелки в папку Hunter."],["15:00",[1,2,3,4,5],"breaks","Перерыв","Встань, разомнись и выпей воды."],["17:15",[1,2,3,4,5],"workout","Конец работы","Вода, тренировка и порядок до 18:00. Потом L2."],["17:00",[0],"review","Итог недели","Посмотри неделю и реши, что поменять."],["22:45",[0,1,2,3,4,5],"read","Закрой день","Запиши траты, почитай и готовься ко сну."]],sent={};
function notifyTick(){if(!PC)return;var n=new Date(),hm=pad(n.getHours())+":"+pad(n.getMinutes()),k=key();SCH.forEach(function(s){var id=k+s[0];if(s[0]!==hm||sent[id]||s[1].indexOf(n.getDay())<0)return;sent[id]=1;var q=questsFor(k).filter(function(x){return x.id===s[2]})[0];if(q&&isDone(k,q))return;PC.notify("СИСТЕМА: "+s[3],s[4])})}
if(PC){PC.setFolder(CFG.folder);PC.onPhoto(function(p){fetch(p.dataUrl).then(function(r){return r.blob()}).then(function(b){var w=new Date(p.mtime);return addPhoto(b,slotBy(w.getHours()),w)}).then(function(){PC.photoDone(p.path)},function(){})})}
if(roll())store();render();sync();
setInterval(function(){sync()},300000);
setInterval(function(){if(roll()){store();render()}else renderHead();notifyTick()},20000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)sync()});
$("syncb").onclick=function(){sync()};
window.__hunter={customSum:customSum,get S(){return S},set S(v){S=v},merge:merge,totals:totals,roll:roll,figKey:figKey};
if("serviceWorker"in navigator&&!PC)navigator.serviceWorker.register("sw.js").catch(function(){});
})();
