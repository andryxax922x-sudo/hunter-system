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
 ["gates","pen","paid","ratings","custom","mealDel","gHide"].forEach(function(f){r[f]=Object.assign({},b[f]||{},r[f]||{})});
 r.books=r.books||{};Object.keys(b.books||{}).forEach(function(i){if(!r.books[i]||(b.books[i].u||0)>(r.books[i].u||0))r.books[i]=b.books[i]});
 Object.keys(b.custom||{}).forEach(function(i){if(b.custom[i].del&&r.custom[i])r.custom[i].del=true});
 r.fin=r.fin||{e:{},m:{}};var bf=b.fin||{e:{},m:{}};["e","m"].forEach(function(f){r.fin[f]=r.fin[f]||{};Object.keys(bf[f]||{}).forEach(function(i){var x=r.fin[f][i],y=bf[f][i];if(!x||(y.u||0)>(x.u||0))r.fin[f][i]=y})});
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
function mealsOf(d){var del=S.mealDel||{};return((d&&d.meals)||[]).filter(function(m){return!del[m.id]})}
function delMeal(k,id){
 mut(function(){S.mealDel=S.mealDel||{};S.mealDel[id]=1;var d=D(k),left=mealsOf(d);
  [["Завтрак","breakfast"],["Обед","lunch"]].forEach(function(p){if(left.some(function(m){return m.slot===p[0]}))return;var had=(d.meals||[]).some(function(m){return m.id===id&&m.slot===p[0]});var q=questsFor(k).filter(function(x){return x.id===p[1]})[0];if(had&&q)setDone(k,q,false)});
  flash("Фото удалено")},k);
 if(CFG.token)api("inbox/"+id+".jpg").then(function(r){return r.ok?r.json():null}).then(function(f){if(f)return api("inbox/"+id+".jpg",{method:"DELETE",body:JSON.stringify({message:"remove photo",sha:f.sha})})}).catch(function(){});
 sync();
}
var askDel=null;
function slotBy(h){return h<11?"Завтрак":h<16?"Обед":h<22?"Ужин":"Перекус"}

function directive(){
 var k=key(),now=new Date(),m=now.getHours()*60+now.getMinutes(),w=now.getDay(),qs=questsFor(k),hard=qs.filter(function(q){return q.hard&&!isDone(k,q)});
 function open(id){return qs.some(function(q){return q.id===id&&!isDone(k,q)})}
 if(D(k).shield)return"Форс-мажор принят. Сегодня штрафа нет. Береги себя.";
 if(pending())return"Сначала штрафная зона. Потом всё остальное.";
 var fo=finOverdue();if(fo.length)return"Финансы: подтверди «"+fo[0].name+"» за этот месяц.";
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
var TABS=[["today","Сегодня"],["train","Тренировка"],["food","Питание"],["read","Чтение"],["fin","Финансы"],["status","Статус"],["rules","Правила"],["setup","Настройки"]];
function renderNav(){var n=$("nav");n.innerHTML="";TABS.forEach(function(t){var b=document.createElement("button");b.textContent=t[1];b.setAttribute("role","tab");b.setAttribute("aria-selected",t[0]===tab);b.onclick=function(){go(t[0])};n.appendChild(b)})}
function go(t){if(tab==="train"&&t!=="train")camStop();if(tab==="read"&&t!=="read")rdClose();tab=t;render()}
function qRow(k,q){
 var d=D(k),done=isDone(k,q),auto=["workout","water","breaks","money","photo"].indexOf(q.mode)>=0;
 var h='<div class="q'+(done?" done":"")+'"><button class="box" data-q="'+q.id+'" aria-label="Отметить: '+esc(q.t)+'" '+(auto?"disabled":"")+'>'+(done?"✓":"")+'</button><div style="min-width:0"><div class="t">'+esc(q.t)+'</div>';
 if(q.hard)h+='<span class="hardtag">ОБЯЗАТЕЛЬНО</span> ';if(q.sub)h+='<span class="sub">'+esc(q.sub)+'</span>';
 if(q.mode==="water")h+='<div class="counter"><button class="btn mini" data-w="-1" aria-label="Убрать стакан">−</button><span class="mono">'+d.water+' / 6</span><button class="btn mini" data-w="1" aria-label="Добавить стакан">+</button></div>';
 if(q.mode==="breaks")h+='<div class="counter"><button class="btn mini" data-b="-1" aria-label="Убрать перерыв">−</button><span class="mono">'+d.breaks+' / 3</span><button class="btn mini" data-b="1" aria-label="Добавить перерыв">+</button></div>';
 if(q.mode==="money")h+='<div class="counter"><button class="btn mini" data-go="fin">Записать</button><button class="btn ghost mini" id="spendok">Трат не было</button></div>';
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
 var k=key(),qs=questsFor(k),hard=qs.filter(function(q){return q.hard}),soft=qs.filter(function(q){return!q.hard}),nd=hard.filter(function(q){return isDone(k,q)}).length,gates=GATES.filter(function(g){return!S.gates[g.id]&&!(S.gHide||{})[g.id]});
 v.innerHTML='<div class="cols"><div class="stack"><section class="win"><div class="row between"><h2>Ежедневный квест</h2><span class="mono dim">'+nd+'/'+hard.length+'</span></div>'+(k===S.start?'<p class="small dim">Первый день без штрафов.</p>':'')+'<div>'+hard.map(function(q){return qRow(k,q)}).join("")+'</div></section><section class="win"><h2>По желанию</h2><div>'+soft.map(function(q){return qRow(k,q)}).join("")+'</div></section>'+customHtml(k)+'</div><div class="stack"><section class="win"><h2>Эта неделя</h2><div class="week" style="margin-top:8px">'+weekHtml()+'</div></section><section class="win"><h2>Врата</h2><p class="small dim">Разовые задания с большой наградой.</p><div>'+(gates.length?gates.map(function(g){return'<div class="q"><button class="box" data-g="'+g.id+'" aria-label="Выполнено: '+esc(g.t)+'"></button><div style="min-width:0"><div class="t">'+esc(g.t)+'</div><span class="sub">'+esc(g.due||g.sub||"")+'</span><div class="counter"><button class="btn ghost mini" data-ghide="'+g.id+'">Убрать</button></div></div><span class="xp">+'+g.xp+'</span></div>'}).join(""):'<p class="small dim">Все Врата закрыты.</p>')+'</div></section><section class="win"><h2>Форс-мажор</h2><p class="small dim">Тревога, нет света, болезнь. День не штрафуется.</p><div style="margin-top:8px"><button class="btn ghost" id="shield">'+(D(k).shield?"Отменить":"Включить на сегодня")+'</button></div></section></div></div>';
 function Q(id){return qs.filter(function(x){return x.id===id})[0]}
 v.querySelectorAll("[data-q]").forEach(function(b){b.onclick=function(){var q=Q(b.dataset.q);mut(function(){setDone(k,q,!isDone(k,q))})}});
 v.querySelectorAll("[data-w]").forEach(function(b){b.onclick=function(){mut(function(){var d=D(k);d.water=Math.max(0,d.water+ +b.dataset.w);setDone(k,Q("water"),d.water>=6)})}});
 v.querySelectorAll("[data-b]").forEach(function(b){b.onclick=function(){mut(function(){var d=D(k);d.breaks=Math.max(0,d.breaks+ +b.dataset.b);setDone(k,Q("breaks"),d.breaks>=3)})}});
 v.querySelectorAll("[data-go]").forEach(function(b){b.onclick=function(){go(b.dataset.go)}});
 v.querySelectorAll("[data-g]").forEach(function(b){b.onclick=function(){var g=GATES.filter(function(x){return x.id===b.dataset.g})[0];mut(function(){S.gates[g.id]=k;flash("Врата закрыты: +"+g.xp+" XP")})}});
 v.querySelectorAll("[data-ghide]").forEach(function(b){b.onclick=function(){mut(function(){S.gHide=S.gHide||{};S.gHide[b.dataset.ghide]=1;flash("Врата убраны, опыт не начислен")})}});
 v.querySelectorAll("[data-cadd]").forEach(function(b){b.onclick=function(){var id=b.dataset.cadd,c=S.custom[id];mut(function(){var d=D(k);d.cust=d.cust||{};var before=customSum(k);d.cust[id]=(d.cust[id]||0)+1;var got=customSum(k)-before;flash(got>0?"+"+got+" XP · "+c.t:"Дневной лимит своих задач достигнут")})}});
 v.querySelectorAll("[data-cundo]").forEach(function(b){b.onclick=function(){var id=b.dataset.cundo;mut(function(){var d=D(k);d.cust[id]=Math.max(0,(d.cust[id]||0)-1)})}});
 v.querySelectorAll("[data-cdel]").forEach(function(b){b.onclick=function(){var id=b.dataset.cdel;mut(function(){S.custom[id].del=true})}});
 $("cadd").onclick=function(){var t=$("cname").value.trim(),st=[].slice.call(document.querySelectorAll(".cst:checked")).map(function(x){return x.value});if(!t)return flash("Введи название задачи");if(st.length>2)return flash("Выбери не больше двух характеристик");mut(function(){S.custom["c"+Date.now().toString(36)]={t:t,stats:st,xp:+$("cxp").value,once:!!$("conce").value};flash("Задача добавлена")})};
 var ok=$("spendok");if(ok)ok.onclick=function(){mut(function(){setDone(k,Q("money"),true)})};
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
 var k=key(),d=D(k),m=mealsOf(d),r=m.map(function(x){return S.ratings[x.id]}).filter(Boolean),avg=r.length?(r.reduce(function(a,x){return a+(+x.score||0)},0)/r.length).toFixed(1):"–",lo=r.reduce(function(a,x){return a+(+x.kmin||0)},0),hi=r.reduce(function(a,x){return a+(+x.kmax||0)},0),pr=r.reduce(function(a,x){return a+(+x.protein||0)},0);
 v.innerHTML='<div class="cols"><section class="win"><h2>Фото еды</h2><p class="small dim">'+(PC?"Выбери файл здесь или положи фото в папку "+esc(CFG.folder)+".":"Сфотографируй тарелку сверху.")+' Обед и ужин оцениваются за несколько минут. Калории по фото примерные.</p><div class="row" style="margin-top:8px"><select id="slot" aria-label="Приём пищи">'+["Завтрак","Обед","Ужин","Перекус"].map(function(s){return'<option'+(s===slotBy(new Date().getHours())?" selected":"")+'>'+s+'</option>'}).join("")+'</select><input id="mfile" type="file" accept="image/*" capture="environment" hidden><button class="btn" id="mbtn">Добавить фото</button></div><p class="small" id="mout" style="margin-top:8px"></p></section><section class="win"><h2>Сегодня</h2><div class="row between" style="margin-top:6px"><span>Средняя оценка</span><span class="mono">'+avg+'</span></div><div class="row between"><span>Калории</span><span class="mono">'+(r.length?lo+"–"+hi:"–")+'</span></div><div class="row between"><span>Белок</span><span class="mono">'+(r.length?"≈"+pr+" г":"–")+'</span></div><div style="margin-top:8px">'+(m.length?m.map(function(x){var a=S.ratings[x.id];var delb=askDel===x.id?'<div class="counter"><span class="small warn">Удалить это фото?</span><button class="btn red mini" data-mdel="'+esc(x.id)+'">Да</button><button class="btn ghost mini" data-mno="1">Нет</button></div>':'<div class="counter"><button class="btn ghost mini" data-mask="'+esc(x.id)+'">Удалить</button></div>';if(!a)return'<div class="meal"><div class="score">…</div><div><b>'+esc(x.slot)+'</b><div class="small dim">Ждёт оценки</div>'+delb+'</div></div>';var s=+a.score;return'<div class="meal"><div class="score '+(s<5?"low":s>=8?"high":"")+'">'+esc(a.score)+'</div><div style="min-width:0"><b>'+esc(x.slot)+'</b>: '+esc(a.name)+'<div class="small dim">'+esc(a.kmin)+'–'+esc(a.kmax)+' ккал, белок ≈'+esc(a.protein)+' г</div><div class="small">'+esc(a.fix)+'</div>'+delb+'</div></div>'}).join(""):'<p class="small dim">Пока нет ни одной тарелки.</p>')+'</div></section></div>';
 v.querySelectorAll("[data-mask]").forEach(function(b){b.onclick=function(){askDel=b.dataset.mask;render()}});
 v.querySelectorAll("[data-mno]").forEach(function(b){b.onclick=function(){askDel=null;render()}});
 v.querySelectorAll("[data-mdel]").forEach(function(b){b.onclick=function(){var id=b.dataset.mdel;askDel=null;delMeal(k,id)}});
 $("mbtn").onclick=function(){$("mfile").click()};
 $("mfile").onchange=function(e){var f=e.target.files[0];if(!f)return;$("mout").textContent="Отправляю…";addPhoto(f,$("slot").value).catch(function(){var o=$("mout");if(o)o.textContent="Не отправилось. Проверь интернет и повтори."})};
}
function renderStatus(v){
 var t=totals(),k=key(),sp=0,all=[];for(var i=0;i<7;i++){var e=S.days[next(k,-i)];if(e&&e.spent)sp+=e.spent;finList(next(k,-i).slice(0,7)).forEach(function(x){if(x.d===next(k,-i)&&x.t!=="income")sp+=x.amt});if(e)mealsOf(e).forEach(function(m){if(S.ratings[m.id])all.push(S.ratings[m.id])})}
 var avg=all.length?(all.reduce(function(a,x){return a+(+x.score||0)},0)/all.length).toFixed(1):"–";
 v.innerHTML='<div class="cols"><section class="win"><h2>Характеристики</h2><div style="margin-top:6px">'+Object.keys(STATS).map(function(s){var val=stat(s,t);return'<div class="stat"><b>'+STATS[s].n+'</b><span class="v">'+val+'</span><div class="bar"><i style="width:'+Math.min(100,val)+'%"></i></div><span class="why">'+STATS[s].why+'</span></div>'}).join("")+'</div></section><div class="stack"><section class="win"><h2>За 7 дней</h2><div class="row between" style="margin-top:6px"><span>Средняя оценка еды</span><span class="mono">'+avg+'</span></div><div class="row between"><span>Записанные траты</span><span class="mono">'+sp+'</span></div></section><section class="win"><h2>Журнал Системы</h2>'+(S.log.length?'<ul class="plain small">'+S.log.map(function(l){return"<li>"+esc(l)+"</li>"}).join("")+'</ul>':'<p class="small dim">Штрафов и потерь пока нет.</p>')+'</section></div></div>';
}
function renderRules(v){v.innerHTML='<section class="win"><h2>Как работает Система</h2><ul class="plain"><li>Опыт идёт за квесты. Обязательные решают исход дня.</li><li>Ранги: E с 1 уровня, D с 10, C с 20, B с 35, A с 50, S с 70.</li><li>Характеристика растёт примерно на 1 за две недели регулярных квестов.</li><li>Навык без тренировки 7 дней теряет 1 пункт.</li></ul></section><section class="win"><h2>Последствия</h2><ul class="plain"><li>За каждый незакрытый обязательный квест минус 15 XP. Уровень может упасть.</li><li>На следующий день открывается штрафная зона: 15 минут уборки и 30 приседаний до входа в L2.</li><li>Неотработанный штраф при новом пропуске стоит ещё 50 XP.</li><li>Пропуск многих дней считается максимум за 3 дня.</li><li>Форс-мажор снимает штраф за день. Используй его честно.</li></ul></section>'}
function renderSetup(v){
 v.innerHTML='<section class="win"><h2>Синхронизация</h2><p class="small dim">Токен хранится только на этом устройстве. Данные обновляются раз в 5 минут и по кнопке «Синхр.».</p><div style="display:grid;gap:8px;margin-top:8px"><label class="f">Владелец<input type="text" id="cowner" value="'+esc(CFG.owner)+'"></label><label class="f">Репозиторий данных<input type="text" id="crepo" value="'+esc(CFG.repo)+'"></label><label class="f">Токен GitHub<input type="password" id="ctok" value="'+esc(CFG.token)+'" autocomplete="off"></label>'+(PC?'<label class="f">Папка для фото<input type="text" id="cfold" value="'+esc(CFG.folder)+'"></label>':'')+'<div><button class="btn" id="csave">Сохранить и проверить</button></div></div></section><section class="win"><h2>Фон</h2><div class="row" style="margin-top:8px">'+[["gate","Врата"],["shadow","Армия теней"],["image","Своя картинка"],["none","Без фона"]].map(function(o){return'<button class="btn '+(CFG.bg===o[0]?"":"ghost")+'" data-bg="'+o[0]+'">'+o[1]+'</button>'}).join("")+'</div><input id="bgf" type="file" accept="image/*" hidden><p class="small dim" style="margin-top:8px">Своя картинка хранится на этом устройстве.</p></section>'+(PC?'<section class="win"><h2>Запуск</h2><p class="small">Программа запускается вместе с Windows и живёт в трее. Крестик сворачивает её, выход через значок в трее.</p></section>':'<section class="win"><h2>Закладка на телефоне</h2><p class="small">Открой этот адрес в браузере и добавь его в закладки. Токен нужно ввести один раз на этом телефоне.</p></section>');
 function setBg(n,blob){CFG.bg=n;try{localStorage.setItem(LC,JSON.stringify(CFG))}catch(e){}scSet(n,blob);render()}
 v.querySelectorAll("[data-bg]").forEach(function(b){b.onclick=function(){if(b.dataset.bg==="image")$("bgf").click();else setBg(b.dataset.bg)}});
 $("bgf").onchange=function(e){var f=e.target.files[0];if(f)idbPut("bg",f).then(function(){setBg("image",f)}).catch(function(){flash("Не получилось сохранить картинку")})};
 $("csave").onclick=function(){CFG.owner=$("cowner").value.trim();CFG.repo=$("crepo").value.trim();CFG.token=$("ctok").value.trim();if($("cfold")){CFG.folder=$("cfold").value.trim();PC.setFolder(CFG.folder)}try{localStorage.setItem(LC,JSON.stringify(CFG))}catch(e){}sync();flash("Сохранено")};
}
function render(){renderHead();renderNav();if(tab==="read"&&RD.doc)return;({fin:renderFin,read:renderRead,today:renderToday,train:renderTrain,food:renderFood,status:renderStatus,rules:renderRules,setup:renderSetup}[tab])($("view"))}

/* Напоминания на ПК: приходят только по незакрытым квестам */
var SCH=[["10:30",[1,2,3,4,5],"breaks","Перерыв","Встань, разомни ноги и спину, выпей воды."],["13:00",[1,2,3,4,5],"lunch","Обед","Положи фото тарелки в папку Hunter."],["15:00",[1,2,3,4,5],"breaks","Перерыв","Встань, разомнись и выпей воды."],["17:15",[1,2,3,4,5],"workout","Конец работы","Вода, тренировка и порядок до 18:00. Потом L2."],["17:00",[0],"review","Итог недели","Посмотри неделю и реши, что поменять."],["22:45",[0,1,2,3,4,5],"read","Закрой день","Запиши траты, почитай и готовься ко сну."]],sent={};
function notifyTick(){if(!PC)return;var n=new Date(),hm=pad(n.getHours())+":"+pad(n.getMinutes()),k=key();if(hm==="10:05"&&!sent[k+"fin"]){sent[k+"fin"]=1;var fo=finOverdue();if(fo.length)PC.notify("СИСТЕМА: Финансы","Подтверди: "+fo.map(function(x){return x.name}).join(", ")+".")}SCH.forEach(function(s){var id=k+s[0];if(s[0]!==hm||sent[id]||s[1].indexOf(n.getDay())<0)return;sent[id]=1;var q=questsFor(k).filter(function(x){return x.id===s[2]})[0];if(q&&isDone(k,q))return;PC.notify("СИСТЕМА: "+s[3],s[4])})}
/* Финансы */
var FV={ym:null},FTYPE={once:"Разовая трата",month:"Ежемесячная трата",force:"Форс-мажор",income:"Приход"},INCOME_GOAL=50000;
function fin(){S.fin=S.fin||{e:{},m:{}};S.fin.e=S.fin.e||{};S.fin.m=S.fin.m||{};if(!S.fin.m.salary)S.fin.m.salary={name:"Зарплата",amt:0,day:12,kind:"inc",from:S.start.slice(0,7),u:1};return S.fin}
function finList(ym){var e=fin().e;return Object.keys(e).map(function(i){var x=e[i];x.id=i;return x}).filter(function(x){return!x.del&&x.d.slice(0,7)===ym}).sort(function(a,b){return b.d<a.d?-1:b.d>a.d?1:0})}
function ymAdd(ym,n){var p=ym.split("-"),d=new Date(+p[0],+p[1]-1+n,15);return d.getFullYear()+"-"+pad(d.getMonth()+1)}
var MON=["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"],MONF=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
function ymName(ym){return MONF[+ym.slice(5)-1]+" "+ym.slice(0,4)}
function money(n){return Math.round(n).toLocaleString("ru-RU")}
function finSum(ym){var l=finList(ym),r={inc:0,once:0,month:0,force:0};l.forEach(function(x){if(x.t==="income")r.inc+=x.amt;else r[x.t]+=x.amt});r.exp=r.once+r.month+r.force;return r}
function finPending(ym){var m=fin().m,l=finList(ym);return Object.keys(m).map(function(i){var x=m[i];x.id=i;return x}).filter(function(x){return!x.del&&(x.from||"")<=ym&&!l.some(function(e){return e.src===x.id})}).sort(function(a,b){return a.day-b.day})}
function finOverdue(){var n=new Date(),ym=key().slice(0,7);return finPending(ym).filter(function(x){return n.getDate()>=x.day})}
function finAdd(o){var id="e"+Date.now().toString(36)+Math.floor(Math.random()*1e3);o.u=Date.now();fin().e[id]=o;var k=key();if(o.d===k&&o.t!=="income"){var q=questsFor(k).filter(function(x){return x.id==="money"})[0];if(q)setDone(k,q,true)}}
function finChart(){
 var now=key().slice(0,7),ms=[];for(var i=5;i>=0;i--){var ym=ymAdd(now,-i),s=finSum(ym);ms.push({ym:ym,inc:s.inc,exp:s.exp})}
 var mx=Math.max.apply(null,ms.map(function(m){return Math.max(m.inc,m.exp)}).concat([1])),e=Math.pow(10,Math.floor(Math.log10(mx))),top=Math.ceil(mx/e)*e,W=400,H=190,L=50,B=26,T=14,ph=H-B-T,gw=(W-L-8)/6,bw=Math.min(22,gw/2.6),y=function(v){return T+ph-ph*v/top};
 var h='<svg viewBox="0 0 '+W+' '+H+'" class="fchart" role="img" aria-label="Доходы и расходы за 6 месяцев">';
 [0,.5,1].forEach(function(f){var v=top*f;h+='<line class="grid" x1="'+L+'" x2="'+(W-4)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text class="tick" x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+money(v)+'</text>'});
 function bar(x,v,c,t){if(!v)return"";var yy=y(v),hh=T+ph-yy;return'<path class="'+c+'" d="M'+x+' '+(T+ph)+'v'+(-Math.max(0,hh-4))+'q0 -4 4 -4h'+(bw-8)+'q4 0 4 4v'+Math.max(0,hh-4)+'z"><title>'+esc(t)+'</title></path>'}
 ms.forEach(function(m,i){var cx=L+gw*i+gw/2;h+=bar(cx-bw-1,m.inc,"binc",ymName(m.ym)+": приход "+money(m.inc))+bar(cx+1,m.exp,"bexp",ymName(m.ym)+": расход "+money(m.exp))+'<text class="tick'+(m.ym===now?" cur":"")+'" x="'+cx+'" y="'+(H-8)+'" text-anchor="middle">'+MON[+m.ym.slice(5)-1]+'</text>'});
 return h+'</svg><div class="row small" style="margin-top:4px"><span><i class="lg binc"></i>Приход</span><span><i class="lg bexp"></i>Расход</span></div>';
}
function renderFin(v){
 var nowYm=key().slice(0,7);FV.ym=FV.ym||nowYm;var ym=FV.ym,s=finSum(ym),rest=s.inc-s.exp,pend=finPending(ym),l=finList(ym),m=fin().m,tpl=Object.keys(m).filter(function(i){return!m[i].del}),dayNow=new Date().getDate(),gp=Math.min(100,100*s.inc/INCOME_GOAL);
 v.innerHTML='<section class="win"><div class="row between"><button class="btn ghost mini" id="fprev" aria-label="Прошлый месяц">‹</button><h2>'+ymName(ym)+'</h2><button class="btn ghost mini" id="fnext" aria-label="Следующий месяц" '+(ym>=nowYm?"disabled":"")+'>›</button></div><div class="fstats"><div><span class="dim small">Приход</span><b class="mono">'+money(s.inc)+'</b></div><div><span class="dim small">Расход</span><b class="mono">'+money(s.exp)+'</b></div><div><span class="dim small">Остаток</span><b class="mono '+(rest<0?"warn":"")+'">'+money(rest)+'</b></div></div><div class="row between small" style="margin-top:8px"><span>Цель по доходу</span><span class="mono">'+money(s.inc)+' / '+money(INCOME_GOAL)+'</span></div><div class="bar"><i style="width:'+gp+'%"></i></div></section><div class="cols"><div class="stack"><section class="win"><h2>Добавить запись</h2><div style="display:grid;gap:8px;margin-top:8px"><select id="ft" aria-label="Тип"><option value="once">Разовая трата</option><option value="month">Ежемесячная трата</option><option value="force">Форс-мажор</option><option value="income">Приход</option><option value="minc">Ежемесячный приход</option></select><input type="text" id="fn" maxlength="60" placeholder="Название, например Киссон" aria-label="Название"><div class="row"><input type="number" id="fa" min="0" inputmode="decimal" placeholder="Сумма" aria-label="Сумма"><input type="date" id="fd" value="'+key()+'" aria-label="Дата"></div><div><button class="btn" id="fadd">Записать</button></div><p class="small dim" id="fhint">Разовая запись попадёт в выбранный месяц.</p></div></section><section class="win"><h2>Записи за месяц</h2><div>'+(l.length?l.map(function(x){return'<div class="fe"><div style="min-width:0"><div>'+esc(x.name)+'</div><span class="small dim">'+x.d.slice(8)+'.'+x.d.slice(5,7)+' · '+FTYPE[x.t]+'</span></div><span class="mono '+(x.t==="income"?"ok":"")+'">'+(x.t==="income"?"+":"−")+money(x.amt)+'</span><button class="btn ghost mini" data-fdel="'+x.id+'" aria-label="Удалить запись">×</button></div>'}).join(""):'<p class="small dim">В этом месяце записей пока нет.</p>')+'</div></section></div><div class="stack">'+(pend.length?'<section class="win"><h2>Ждут подтверждения</h2><p class="small dim">Проверь сумму и подтверди, когда деньги пришли или ушли.</p><div>'+pend.map(function(x){var late=ym<nowYm||dayNow>=x.day;return'<div class="fp"><div style="min-width:0"><div>'+esc(x.name)+'</div><span class="small '+(late?"warn":"dim")+'">Срок: '+x.day+' число'+(x.id==="salary"?", до 10-го и 2 дня на карту":"")+'</span></div><div class="row"><input type="number" id="pa'+x.id+'" min="0" inputmode="decimal" value="'+(x.amt||"")+'" placeholder="Сумма" aria-label="Сумма" style="width:110px"><button class="btn mini" data-fok="'+x.id+'">Готово</button></div></div>'}).join("")+'</div></section>':'')+'<section class="win"><h2>За 6 месяцев</h2><div style="margin-top:8px">'+finChart()+'</div></section><section class="win"><h2>Структура расходов</h2><div class="row between" style="margin-top:6px"><span>Разовые</span><span class="mono">'+money(s.once)+'</span></div><div class="row between"><span>Ежемесячные</span><span class="mono">'+money(s.month)+'</span></div><div class="row between"><span>Форс-мажор</span><span class="mono">'+money(s.force)+'</span></div></section><section class="win"><h2>Ежемесячные</h2><div>'+tpl.map(function(i){var x=m[i];return'<div class="fe"><div style="min-width:0"><div>'+esc(x.name)+'</div><span class="small dim">'+x.day+' число · '+(x.kind==="inc"?"приход":"трата")+'</span></div><span class="mono">'+money(x.amt)+'</span>'+(i==="salary"?'<span></span>':'<button class="btn ghost mini" data-mdelm="'+i+'" aria-label="Больше не повторять">×</button>')+'</div>'}).join("")+'</div></section></div></div>';
 $("fprev").onclick=function(){FV.ym=ymAdd(ym,-1);render()};$("fnext").onclick=function(){FV.ym=ymAdd(ym,1);render()};
 $("ft").onchange=function(){var t=this.value;$("fhint").textContent=t==="month"||t==="minc"?"Запись пойдёт в этот месяц и будет возвращаться каждый месяц в тот же день на подтверждение.":"Разовая запись попадёт в выбранный месяц."};
 $("fadd").onclick=function(){var t=$("ft").value,n=$("fn").value.trim(),am=+$("fa").value,d=$("fd").value;if(!n)return flash("Введи название");if(!(am>0))return flash("Введи сумму больше нуля");if(!d)return flash("Выбери дату");
  mut(function(){var src=null;if(t==="month"||t==="minc"){src="m"+Date.now().toString(36);fin().m[src]={name:n,amt:am,day:Math.min(28,+d.slice(8)),kind:t==="minc"?"inc":"exp",from:d.slice(0,7),u:Date.now()}}
   var o={d:d,t:t==="minc"?"income":t,name:n,amt:am};if(src)o.src=src;finAdd(o);FV.ym=d.slice(0,7);flash("Записано")})};
 v.querySelectorAll("[data-fdel]").forEach(function(b){b.onclick=function(){mut(function(){var e=fin().e[b.dataset.fdel];e.del=true;e.u=Date.now()})}});
 v.querySelectorAll("[data-mdelm]").forEach(function(b){b.onclick=function(){mut(function(){var x=fin().m[b.dataset.mdelm];x.del=true;x.u=Date.now();flash("Больше не повторяется")})}});
 v.querySelectorAll("[data-fok]").forEach(function(b){b.onclick=function(){var id=b.dataset.fok,x=fin().m[id],am=+$("pa"+id).value;if(!(am>0))return flash("Введи сумму");mut(function(){var day=ym===nowYm?key():ym+"-"+pad(x.day);finAdd({d:day,t:x.kind==="inc"?"income":"month",name:x.name,amt:am,src:id});x.amt=am;x.u=Date.now();flash("Подтверждено")})}});
}

/* Чтение */
var RD={doc:null,key:"",page:1,zoom:1,task:null,act:0,dark:false,tick:null};
function idb(){return new Promise(function(res,rej){var r=indexedDB.open("hunter",1);r.onupgradeneeded=function(){r.result.createObjectStore("files")};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}})}
function idbPut(k,v){return idb().then(function(db){return new Promise(function(res,rej){var t=db.transaction("files","readwrite");t.objectStore("files").put(v,k);t.oncomplete=res;t.onerror=function(){rej(t.error)}})})}
function idbGet(k){return idb().then(function(db){return new Promise(function(res,rej){var q=db.transaction("files").objectStore("files").get(k);q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})})}
function idbDel(k){return idb().then(function(db){db.transaction("files","readwrite").objectStore("files").delete(k)})}
function bookKey(f){var s=f.name+":"+f.size,h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return"b"+(h>>>0).toString(36)}
function pdfOpen(blob){pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.min.js";return blob.arrayBuffer().then(function(b){return pdfjsLib.getDocument({data:b}).promise})}
function readSec(){return D().readSec||0}
function renderRead(v){
 S.books=S.books||{};var ks=Object.keys(S.books).filter(function(k){return!S.books[k].del}).sort(function(a,b){return(S.books[b].u||0)-(S.books[a].u||0)});
 v.innerHTML='<section class="win"><div class="row between"><h2>Книги</h2><span class="mono dim">Сегодня '+Math.floor(readSec()/60)+' / 15 мин</span></div><p class="small dim">Время считается, пока ты листаешь книгу здесь. После 15 минут квест чтения закроется сам. Файлы книг хранятся на этом устройстве, прогресс синхронизируется.</p><div style="margin-top:8px"><input id="bfile" type="file" accept="application/pdf,.pdf" hidden><button class="btn" id="badd">Добавить PDF</button></div><p class="small" id="bmsg" style="margin-top:8px"></p><div id="blist"></div></section>';
 $("blist").innerHTML=ks.length?ks.map(function(k){var b=S.books[k],pc=b.pages?Math.round(100*b.page/b.pages):0;return'<div class="book"><button class="btn ghost mini" data-bopen="'+k+'" style="padding:8px 12px">Читать</button><div style="min-width:0"><div>'+esc(b.t)+'</div><div class="small dim">Страница '+b.page+' из '+b.pages+' · '+pc+'%</div><div class="bar" style="height:5px;margin-top:4px"><i style="width:'+pc+'%"></i></div><div class="counter"><button class="btn ghost mini" data-bdel="'+k+'">Удалить</button></div></div></div>'}).join(""):'<p class="small dim" style="margin-top:8px">Пока нет книг. Добавь первый PDF.</p>';
 $("badd").onclick=function(){$("bfile").click()};
 $("bfile").onchange=function(e){var f=e.target.files[0];if(!f)return;var k=bookKey(f);$("bmsg").textContent="Открываю книгу…";pdfOpen(f).then(function(doc){return idbPut(k,f).then(function(){mut(function(){var o=S.books[k];S.books[k]={t:f.name.replace(/\.pdf$/i,""),pages:doc.numPages,page:o&&!o.del?o.page:1,u:Date.now()}});rdOpen(k)})}).catch(function(){var m=$("bmsg");if(m)m.textContent="Не получилось открыть этот PDF. Если он защищён паролем, сними защиту."})};
 v.querySelectorAll("[data-bopen]").forEach(function(b){b.onclick=function(){rdOpen(b.dataset.bopen)}});
 v.querySelectorAll("[data-bdel]").forEach(function(b){b.onclick=function(){var k=b.dataset.bdel;idbDel(k).catch(function(){});mut(function(){S.books[k].del=true;S.books[k].u=Date.now()})}});
}
function rdOpen(k){
 idbGet(k).then(function(f){
  if(!f){var m=$("bmsg");if(m)m.textContent="Этого файла нет на этом устройстве. Добавь тот же PDF здесь, и чтение продолжится с твоей страницы.";return}
  return pdfOpen(f).then(function(doc){RD.doc=doc;RD.key=k;RD.page=Math.min(S.books[k].page||1,doc.numPages);RD.act=Date.now();rdUi();rdPage();clearInterval(RD.tick);RD.tick=setInterval(rdTick,1000)});
 }).catch(function(){flash("Не получилось открыть книгу")});
}
function rdUi(){
 var v=$("view"),b=S.books[RD.key];
 v.innerHTML='<div class="reader" id="rd"><div class="rbar"><button class="btn ghost mini" id="rback">Книги</button><span class="rtitle">'+esc(b.t)+'</span><button class="btn ghost mini" id="rminus" aria-label="Уменьшить">−</button><button class="btn ghost mini" id="rplus" aria-label="Увеличить">+</button><button class="btn ghost mini" id="rnight">'+(RD.dark?"Светлый":"Тёмный")+'</button><button class="btn mini" id="rmode">Режим чтения</button></div><div class="rpage" id="rscroll"><canvas id="rc" class="'+(RD.dark?"night":"")+'"></canvas><button class="rzone l" id="rprev" aria-label="Предыдущая страница"></button><button class="rzone r" id="rnext" aria-label="Следующая страница"></button></div><div class="rfoot"><button class="btn ghost mini" id="rp2">Назад</button><span class="mono"><input type="number" id="rnum" min="1" max="'+RD.doc.numPages+'" value="'+RD.page+'" aria-label="Страница" style="width:76px"> / '+RD.doc.numPages+'</span><button class="btn ghost mini" id="rn2">Вперёд</button></div></div>';
 $("rback").onclick=function(){rdClose();render()};
 $("rprev").onclick=$("rp2").onclick=function(){rdGo(RD.page-1)};$("rnext").onclick=$("rn2").onclick=function(){rdGo(RD.page+1)};
 $("rminus").onclick=function(){RD.zoom=Math.max(.5,RD.zoom-.15);rdPage()};$("rplus").onclick=function(){RD.zoom=Math.min(3,RD.zoom+.15);rdPage()};
 $("rnight").onclick=function(){RD.dark=!RD.dark;$("rc").classList.toggle("night",RD.dark);this.textContent=RD.dark?"Светлый":"Тёмный"};
 $("rmode").onclick=function(){rdMode(!document.body.classList.contains("reading"))};
 $("rnum").onchange=function(){rdGo(+this.value||1)};
 var sx=0;$("rscroll").addEventListener("touchstart",function(e){sx=e.touches[0].clientX},{passive:true});
 $("rscroll").addEventListener("touchend",function(e){var d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>60)rdGo(RD.page+(d<0?1:-1))},{passive:true});
 $("rscroll").addEventListener("scroll",function(){RD.act=Date.now()},{passive:true});
}
function rdPage(){
 if(!RD.doc)return;var n=RD.page;
 RD.doc.getPage(n).then(function(pg){
  var c=$("rc"),box=$("rscroll");if(!c||n!==RD.page)return;
  if(RD.task){try{RD.task.cancel()}catch(e){}}
  var base=pg.getViewport({scale:1}),reading=document.body.classList.contains("reading"),maxw=Math.min(box.clientWidth-8,reading?1100:900),fit=maxw/base.width;
  if(innerWidth>900&&reading)fit=Math.min(fit,(innerHeight-44)/base.height);
  var s=fit*RD.zoom,dpr=Math.min(devicePixelRatio||1,2),vp=pg.getViewport({scale:s*dpr});
  c.width=vp.width;c.height=vp.height;c.style.width=vp.width/dpr+"px";c.style.height=vp.height/dpr+"px";
  RD.task=pg.render({canvasContext:c.getContext("2d"),viewport:vp});RD.task.promise.catch(function(){});
  box.scrollTop=0;
 });
}
function rdGo(n){if(!RD.doc)return;n=Math.max(1,Math.min(RD.doc.numPages,n));if(n===RD.page)return;RD.page=n;RD.act=Date.now();var b=S.books[RD.key];b.page=n;b.u=Date.now();D().u=Date.now();store();var i=$("rnum");if(i)i.value=n;rdPage()}
function rdTick(){
 if(!RD.doc||document.hidden||Date.now()-RD.act>180000)return;var k=key(),d=D(k);d.readSec=(d.readSec||0)+1;
 if(d.readSec%15===0){d.u=Date.now();store()}
 if(d.readSec===900){var q=questsFor(k).filter(function(x){return x.id==="read"})[0];if(q&&!isDone(k,q)){setDone(k,q,true);d.u=Date.now();store();renderHead()}}
}
function rdMode(on){
 document.body.classList.toggle("reading",on);scPause(on);var b=$("rmode");if(b)b.textContent=on?"Выйти":"Режим чтения";
 try{if(on&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(function(){});if(!on&&document.fullscreenElement)document.exitFullscreen().catch(function(){})}catch(e){}
 setTimeout(rdPage,120);
}
function rdClose(){if(document.body.classList.contains("reading"))rdMode(false);RD.doc=null;clearInterval(RD.tick);store()}
document.addEventListener("keydown",function(e){if(!RD.doc||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==="ArrowRight"||e.key==="PageDown"){rdGo(RD.page+1);e.preventDefault()}if(e.key==="ArrowLeft"||e.key==="PageUp"){rdGo(RD.page-1);e.preventDefault()}if(e.key==="Escape")rdMode(false)});
document.addEventListener("fullscreenchange",function(){if(!document.fullscreenElement&&document.body.classList.contains("reading"))rdMode(false)});

if(PC){PC.setFolder(CFG.folder);PC.onPhoto(function(p){fetch(p.dataUrl).then(function(r){return r.blob()}).then(function(b){var w=new Date(p.mtime);return addPhoto(b,slotBy(w.getHours()),w)}).then(function(){PC.photoDone(p.path)},function(){})})}
scInit();if(CFG.bg==="image")idbGet("bg").then(function(b){scSet(b?"image":"gate",b)}).catch(function(){});else if(CFG.bg)scSet(CFG.bg);
var VER=null;function checkVer(){fetch("version.txt?"+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.text():null}).then(function(t){if(!t)return;if(VER&&t!==VER&&!T.run&&!CAM.run&&!RD.doc){store();location.reload();return}VER=VER||t})["catch"](function(){})}
checkVer();setInterval(checkVer,60000);
if(roll())store();render();sync();
setInterval(function(){sync()},300000);
setInterval(function(){if(roll()){store();render()}else renderHead();notifyTick()},20000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)sync()});
$("syncb").onclick=function(){sync()};
window.__hunter={customSum:customSum,get S(){return S},set S(v){S=v},merge:merge,totals:totals,roll:roll,figKey:figKey};
if("serviceWorker"in navigator&&!PC)navigator.serviceWorker.register("sw.js").catch(function(){});
})();
