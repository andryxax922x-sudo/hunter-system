/* Живой фон. Сцены рисуются кодом, своя картинка хранится на этом устройстве. */
var SC={name:"gate",c:null,x:null,st:null,w:0,h:0,p:[],t:0,img:null,raf:0,paused:false,last:0};
function scInit(){SC.c=document.getElementById("bg");SC.x=SC.c.getContext("2d");addEventListener("resize",scResize);scResize();document.addEventListener("visibilitychange",function(){if(!document.hidden)scLoop()});scLoop()}
function scResize(){var d=Math.min(devicePixelRatio||1,1.5);SC.w=innerWidth;SC.h=innerHeight;SC.c.width=SC.w*d;SC.c.height=SC.h*d;SC.x.setTransform(d,0,0,d,0,0);scStatic();SC.p=[];for(var i=0;i<(SC.w<700?35:80);i++)SC.p.push(scP(true))}
function scP(any){return{x:Math.random()*SC.w,y:any?Math.random()*SC.h:SC.h+10,r:.6+Math.random()*2,v:.15+Math.random()*.6,o:Math.random()*6.28}}
function scCity(g,w,h,base,col){g.fillStyle=col;var x=0,s=(w*7+13)%97;while(x<w){s=(s*31+17)%233;var bw=26+s%60,bh=base*(.35+(s%70)/100);g.fillRect(x,h-bh,bw,bh+2);if(s%3===0){g.beginPath();g.moveTo(x+bw*.1,h-bh);g.lineTo(x+bw*.5,h-bh-18-s%24);g.lineTo(x+bw*.8,h-bh);g.fill()}x+=bw-2}}
function scHero(g,x,y,s,col){g.fillStyle=col;g.beginPath();g.arc(x,y-58*s,8*s,0,7);g.fill();g.beginPath();g.moveTo(x-11*s,y-48*s);g.lineTo(x+11*s,y-48*s);g.lineTo(x+19*s,y+2*s);g.lineTo(x+5*s,y);g.lineTo(x,y-14*s);g.lineTo(x-5*s,y);g.lineTo(x-19*s,y+2*s);g.closePath();g.fill();g.strokeStyle=col;g.lineWidth=3*s;g.beginPath();g.moveTo(x+12*s,y-42*s);g.lineTo(x+40*s,y+4*s);g.stroke()}
function scStatic(){
 var o=document.createElement("canvas");o.width=SC.w;o.height=SC.h;var g=o.getContext("2d"),w=SC.w,h=SC.h,gr=g.createLinearGradient(0,0,0,h);
 if(SC.name==="shadow"){gr.addColorStop(0,"#07050f");gr.addColorStop(.6,"#120a2a");gr.addColorStop(1,"#1d0f3f")}else{gr.addColorStop(0,"#040814");gr.addColorStop(.65,"#0a1a3c");gr.addColorStop(1,"#0d2448")}
 g.fillStyle=gr;g.fillRect(0,0,w,h);
 if(SC.name==="gate"){scCity(g,w,h,h*.34,"#071024");scCity(g,w+40,h,h*.2,"#040a18");g.fillStyle="#02050d";g.fillRect(0,h-34,w,34)}
 if(SC.name==="shadow"){g.fillStyle="#05030c";g.fillRect(0,h-30,w,30);var rows=[[.14,.75,"#0f0822"],[.09,1,"#0a0518"],[.05,1.3,"#05030c"]];rows.forEach(function(r,i){var step=w*r[0]<46?46:w*r[0],s=(i*7+3);for(var x=-20;x<w+20;x+=step){s=(s*29+11)%101;scHero(g,x+s%30,h-26-(2-i)*26,r[1],r[2])}})}
 SC.st=o;
}
function scGate(x,cx,cy,t){
 var R=Math.min(SC.w,SC.h)*.27,a=.8+.2*Math.sin(t/900);
 for(var i=3;i>=0;i--){x.beginPath();x.ellipse(cx,cy,R*(.72+i*.1),R*(1.12+i*.13),0,0,6.3);x.strokeStyle="rgba(87,199,255,"+(.05+.05*(3-i))*a+")";x.lineWidth=3+i*7;x.stroke()}
 var g=x.createRadialGradient(cx,cy,R*.05,cx,cy,R*1.15);g.addColorStop(0,"rgba(190,235,255,"+.55*a+")");g.addColorStop(.35,"rgba(60,120,255,.42)");g.addColorStop(.8,"rgba(40,20,140,.34)");g.addColorStop(1,"rgba(10,10,60,0)");
 x.save();x.beginPath();x.ellipse(cx,cy,R*.74,R*1.14,0,0,6.3);x.clip();x.fillStyle=g;x.fillRect(cx-R,cy-R*1.3,R*2,R*2.6);
 x.strokeStyle="rgba(170,225,255,.22)";x.lineWidth=2;for(var k=0;k<4;k++){x.beginPath();for(var a2=0;a2<16;a2+=.2){var rr=a2*R/15,an=a2*.8+t/1500+k*1.57;x.lineTo(cx+Math.cos(an)*rr*.74,cy+Math.sin(an)*rr*1.14)}x.stroke()}x.restore();
 scHero(x,cx,SC.h-30,1.25,"#01030a");
}
function scEyes(x,t){var s=5,w=SC.w;for(var i=0;i<16;i++){s=(s*37+19)%211;var ex=(s*13)%w,ey=SC.h-(90+(s%60)),o=.35+.5*Math.abs(Math.sin(t/1400+s));x.fillStyle="rgba(150,80,255,"+o+")";x.fillRect(ex-3,ey,2.4,1.6);x.fillRect(ex+1,ey,2.4,1.6)}}
function scDraw(t){
 var x=SC.x;if(!SC.st)return;x.drawImage(SC.st,0,0,SC.w,SC.h);
 if(SC.name==="gate")scGate(x,SC.w*(SC.w<760?.5:.74),SC.h*.46,t);
 if(SC.name==="shadow")scEyes(x,t);
 var col=SC.name==="shadow"?"170,110,255":"120,210,255";
 SC.p.forEach(function(p,i){p.y-=p.v;p.x+=Math.sin(t/1200+p.o)*.25;if(p.y<-8)SC.p[i]=scP();x.fillStyle="rgba("+col+","+(.2+.5*Math.abs(Math.sin(t/900+p.o)))+")";x.fillRect(p.x,p.y,p.r,p.r)});
}
function scLoop(){
 cancelAnimationFrame(SC.raf);
 function f(t){if(document.hidden||SC.paused||SC.name==="image"||SC.name==="none")return;if(t-SC.last>40){SC.last=t;scDraw(t)}SC.raf=requestAnimationFrame(f)}
 if(matchMedia("(prefers-reduced-motion: reduce)").matches){scDraw(0);return}
 SC.raf=requestAnimationFrame(f);
}
function scSet(name,blob){
 SC.name=name;var c=SC.c,img=document.getElementById("bgimg");
 c.hidden=name==="image"||name==="none";img.hidden=name!=="image";
 if(name==="image"&&blob){if(img.src&&img.src.indexOf("blob:")===0)URL.revokeObjectURL(img.src);img.src=URL.createObjectURL(blob)}
 if(!c.hidden){scStatic();scLoop()}
}
function scPause(v){SC.paused=v;if(!v)scLoop()}
