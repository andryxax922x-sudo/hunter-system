/* Камера: скелет, счёт повторов и засчитанное время. Всё считается на устройстве, видео никуда не отправляется. */
var CAM={stream:null,pose:null,run:false,reps:0,phase:"up",hold:0,last:0,rule:null};
var IDX={ls:11,rs:12,lh:23,rh:24,lk:25,rk:26,la:27,ra:28,le:13,re:14,lw:15,rw:16};
var LINKS=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
function ang(a,b,c){var x=Math.atan2(c.y-b.y,c.x-b.x)-Math.atan2(a.y-b.y,a.x-b.x),d=Math.abs(x*180/Math.PI);return d>180?360-d:d}
function camRule(key){
 if(key==="squat")return{t:"reps",j:"knee",down:105,up:160,tip:"Садись ниже: угол в колене до 105°"};
 if(key==="rdl")return{t:"reps",j:"hip",down:115,up:160,tip:"Отводи таз назад до наклона"};
 if(key==="bridge")return{t:"reps",j:"hip",down:135,up:165,tip:"Поднимай таз до прямой линии"};
 if(key==="plank"||key==="side")return{t:"hold",min:160,max:195,tip:"Прямая линия от плеча до стопы"};
 return{t:"track",tip:"Камера показывает положение тела и считает время"};
}
function camSide(l){var L=(l[11].visibility||0)+(l[23].visibility||0)+(l[25].visibility||0),R=(l[12].visibility||0)+(l[24].visibility||0)+(l[26].visibility||0);return L>=R?{s:l[11],h:l[23],k:l[25],a:l[27]}:{s:l[12],h:l[24],k:l[26],a:l[28]}}
function camEval(l,dt){
 var r=CAM.rule,b=camSide(l),msg={ok:true,text:r.tip};
 if(Math.min(b.h.visibility||0,b.a.visibility||0)<.4)return{ok:false,text:"Встань так, чтобы всё тело было в кадре"};
 if(r.t==="reps"){
  var v=r.j==="knee"?ang(b.h,b.k,b.a):ang(b.s,b.h,b.k);
  if(CAM.phase==="up"&&v<r.down)CAM.phase="down";
  else if(CAM.phase==="down"&&v>r.up){CAM.phase="up";CAM.reps++}
  msg.text=CAM.phase==="down"?"Теперь вверх":r.tip;
 }else if(r.t==="hold"){
  var line=ang(b.s,b.h,b.a);
  if(line>=r.min){CAM.hold+=dt;msg.text="Держи, время идёт"}else{msg.ok=false;msg.text=b.h.y>(b.s.y+b.a.y)/2?"Таз провис: подкрути его":"Таз высоко: опусти его"}
 }else CAM.hold+=dt;
 return msg;
}
function camDraw(c,res){
 var x=c.getContext("2d");c.width=c.clientWidth;c.height=c.clientHeight;x.clearRect(0,0,c.width,c.height);
 var l=res.poseLandmarks;if(!l)return;x.strokeStyle="#57c7ff";x.lineWidth=3;
 LINKS.forEach(function(p){var a=l[p[0]],b=l[p[1]];if((a.visibility||0)<.3||(b.visibility||0)<.3)return;x.beginPath();x.moveTo(a.x*c.width,a.y*c.height);x.lineTo(b.x*c.width,b.y*c.height);x.stroke()});
}
function camStart(video,canvas,key,onUpdate){
 CAM.video=video;CAM.canvas=canvas;CAM.cb=onUpdate;CAM.key=key;CAM.rule=camRule(key);CAM.reps=0;CAM.hold=0;CAM.phase="up";CAM.last=performance.now();
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return Promise.reject(new Error("no"));
 return navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:640,height:480},audio:false}).then(function(s){
  CAM.stream=s;video.srcObject=s;video.setAttribute("playsinline","");return video.play();
 }).then(function(){
  if(!CAM.pose){
   CAM.pose=new Pose({locateFile:function(f){return"vendor/"+f}});
   CAM.pose.setOptions({modelComplexity:0,smoothLandmarks:true,minDetectionConfidence:.5,minTrackingConfidence:.5});
  }
  CAM.pose.onResults(function(res){
   if(CAM.canvas)camDraw(CAM.canvas,res);var n=performance.now(),dt=(n-CAM.last)/1000;CAM.last=n;
   CAM.cb(res.poseLandmarks?camEval(res.poseLandmarks,dt):{ok:false,text:"Не вижу тело. Отойди дальше"});
  });
  CAM.run=true;
  (function loop(){if(!CAM.run)return;CAM.pose.send({image:CAM.video}).then(function(){if(CAM.run)requestAnimationFrame(loop)},function(){CAM.run=false})})();
 });
}
function camStop(){CAM.run=false;if(CAM.stream){CAM.stream.getTracks().forEach(function(t){t.stop()});CAM.stream=null}}
function camRebind(video,canvas,key){CAM.video=video;CAM.canvas=canvas;video.srcObject=CAM.stream;video.play().catch(function(){});if(key!==CAM.key){CAM.key=key;CAM.rule=camRule(key);CAM.reps=0;CAM.hold=0;CAM.phase="up"}}
