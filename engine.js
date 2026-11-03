/* Shared deterministic simulation; works as a file:// script and in Node tests. */
(function(root){
'use strict';
const W=1120,H=640,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function createGame(random=Math.random){
 const g={random,mode:'ready',player:{x:W/2,y:H/2,hp:100,r:15},bullets:[],zombies:[],sparks:[],kills:0,wave:0,time:0,cooldown:0,hurt:0,spawnTimer:0,remaining:0,intermission:0,notice:0};
 g.start=()=>{Object.assign(g,{mode:'playing',player:{x:W/2,y:H/2,hp:100,r:15},bullets:[],zombies:[],sparks:[],kills:0,wave:0,time:0,cooldown:0,hurt:0,spawnTimer:0,remaining:0,intermission:0,notice:0});nextWave();};
 function nextWave(){g.wave++;g.remaining=5+g.wave*3;g.spawnTimer=.5;g.notice=2;}
 function spawn(){let side=Math.floor(random()*4),x,y;if(side<2){x=side?W+20:-20;y=random()*H;}else{x=random()*W;y=side===2?-20:H+20;}g.zombies.push({x,y,r:16,hp:g.wave>=4?2:1,speed:42+Math.min(g.wave*5,65)+random()*14});}
 g.step=(elapsed,input={})=>{
  if(g.mode!=='playing')return;
  const dt=clamp(elapsed,0,.05),p=g.player;g.time+=dt;g.hurt=Math.max(0,g.hurt-dt);g.cooldown-=dt;g.notice=Math.max(0,g.notice-dt);
  let dx=input.dx||0,dy=input.dy||0,len=Math.hypot(dx,dy);if(len){p.x=clamp(p.x+dx/len*225*dt,p.r,W-p.r);p.y=clamp(p.y+dy/len*225*dt,p.r,H-p.r);}
  if(input.fire&&g.cooldown<=0){const a=Math.atan2((input.aimY??p.y)-p.y,(input.aimX??p.x+1)-p.x);g.bullets.push({x:p.x+Math.cos(a)*22,y:p.y+Math.sin(a)*22,vx:Math.cos(a)*720,vy:Math.sin(a)*720,life:1.7});g.cooldown=.14;}
  if(g.remaining>0){g.spawnTimer-=dt;if(g.spawnTimer<=0){spawn();g.remaining--;g.spawnTimer=Math.max(.24,.85-g.wave*.045);}}
  for(const b of g.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;}
  for(const z of g.zombies){const a=Math.atan2(p.y-z.y,p.x-z.x);z.x+=Math.cos(a)*z.speed*dt;z.y+=Math.sin(a)*z.speed*dt;
   for(const b of g.bullets){if(b.life>0&&z.hp>0&&Math.hypot(b.x-z.x,b.y-z.y)<z.r+4){b.life=0;z.hp--;g.sparks.push({x:z.x,y:z.y,life:.22});if(z.hp<=0)g.kills++;}}
   if(z.hp>0&&g.hurt===0&&Math.hypot(p.x-z.x,p.y-z.y)<p.r+z.r){p.hp=Math.max(0,p.hp-20);g.hurt=.85;if(p.hp===0){g.mode='over';break;}}
  }
  g.bullets=g.bullets.filter(b=>b.life>0&&b.x>-30&&b.x<W+30&&b.y>-30&&b.y<H+30);g.zombies=g.zombies.filter(z=>z.hp>0);g.sparks=g.sparks.filter(s=>(s.life-=dt)>0);
  if(g.mode==='playing'&&g.remaining===0&&g.zombies.length===0){g.intermission+=dt;if(g.intermission>=2){p.hp=Math.min(100,p.hp+15);g.intermission=0;nextWave();}}
 };
 return g;
}
root.ZombieEngine={createGame,W,H};if(typeof module!=='undefined')module.exports=root.ZombieEngine;
})(typeof globalThis!=='undefined'?globalThis:this);
