'use strict';
const {createGame,W,H}=ZombieEngine,game=createGame(),canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const ui=Object.fromEntries(['health','bar','wave','kills','best','pause','overlay','eyebrow','title','message','start','announcement'].map(id=>[id,document.getElementById(id)]));
const keys=new Set(),pointer={x:W/2+100,y:H/2,down:false};let best=0,last=0,shown='ready';
try{best=Number(localStorage.getItem('outpost-best'))||0;}catch{}
function clearInput(){keys.clear();pointer.down=false;}
function start(){game.start();clearInput();shown='playing';ui.overlay.hidden=true;ui.pause.disabled=false;ui.pause.innerHTML='暂停 <kbd>P</kbd>';canvas.focus();}
function pause(){if(!['playing','paused'].includes(game.mode))return;game.mode=game.mode==='playing'?'paused':'playing';clearInput();ui.overlay.hidden=game.mode==='playing';ui.pause.innerHTML=game.mode==='playing'?'暂停 <kbd>P</kbd>':'继续 <kbd>P</kbd>';if(game.mode==='paused'){ui.eyebrow.textContent='TAKE A BREATH';ui.title.textContent='战斗已暂停';ui.message.textContent='准备好后继续守住防线。';ui.start.textContent='继续战斗 ↗';}else canvas.focus();}
ui.start.onclick=()=>game.mode==='paused'?pause():start();ui.pause.onclick=pause;document.querySelector('#restart').onclick=start;
addEventListener('keydown',e=>{if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)&&e.target===canvas)e.preventDefault();if(k==='p'&&!e.repeat)pause();if(e.target===canvas||game.mode==='playing')keys.add(k);});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)*W/r.width;pointer.y=(e.clientY-r.top)*H/r.height;});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)*W/r.width;pointer.y=(e.clientY-r.top)*H/r.height;pointer.down=true;canvas.focus();});
addEventListener('pointerup',()=>pointer.down=false);addEventListener('pointercancel',clearInput);addEventListener('blur',()=>{clearInput();if(game.mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.mode==='playing')pause();});
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function draw(){
 ctx.fillStyle='#19271f';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#29372b';ctx.lineWidth=1;
 for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 ctx.strokeStyle='#41513a';ctx.strokeRect(28,28,W-56,H-56);ctx.setLineDash([10,10]);ctx.strokeStyle='#6f754533';ctx.strokeRect(65,65,W-130,H-130);ctx.setLineDash([]);
 ctx.fillStyle='#53604955';ctx.font='bold 105px monospace';ctx.textAlign='center';ctx.fillText('07',W/2,H/2+35);ctx.font='11px monospace';ctx.fillText('QUARANTINE ZONE',W/2,H/2+65);
 for(const [x,y] of [[100,150],[920,490],[180,510],[960,120]]){ctx.fillStyle='#303d2b';ctx.fillRect(x,y,48,36);ctx.strokeStyle='#4b5940';ctx.strokeRect(x+3,y+3,42,30);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+48,y+36);ctx.stroke();}
 for(const z of game.zombies){ctx.save();ctx.translate(z.x,z.y);ctx.rotate(Math.atan2(game.player.y-z.y,game.player.x-z.x));circle(2,4,19,'#0003');ctx.fillStyle='#697e49';ctx.fillRect(0,-18,25,7);ctx.fillRect(0,11,25,7);circle(0,0,z.r,z.hp>1?'#b79854':'#7c9860');circle(7,-6,2,'#e8df8b');circle(7,6,2,'#e8df8b');ctx.restore();}
 for(const b of game.bullets){ctx.strokeStyle='#e4eeac';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.014,b.y-b.vy*.014);ctx.stroke();}
 for(const s of game.sparks){ctx.strokeStyle='#d5df88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,(.22-s.life)*100+5,0,Math.PI*2);ctx.stroke();}
 const p=game.player,a=Math.atan2(pointer.y-p.y,pointer.x-p.x);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);circle(2,5,19,'#0004');circle(0,0,15,game.hurt>0?'#e4a080':'#c9e997');ctx.fillStyle='#667654';ctx.fillRect(0,-10,13,20);ctx.fillStyle='#d8dfb6';ctx.fillRect(10,-4,22,8);ctx.restore();
 ctx.strokeStyle='#d4e8a380';ctx.lineWidth=1;ctx.beginPath();ctx.arc(pointer.x,pointer.y,9,0,Math.PI*2);ctx.moveTo(pointer.x-14,pointer.y);ctx.lineTo(pointer.x+14,pointer.y);ctx.moveTo(pointer.x,pointer.y-14);ctx.lineTo(pointer.x,pointer.y+14);ctx.stroke();
 ui.health.innerHTML=p.hp+' <em>/ 100</em>';ui.bar.style.width=p.hp+'%';ui.bar.style.background=p.hp<=40?'#e59a77':'#c9ed7b';ui.wave.textContent=String(game.wave||1).padStart(2,'0');ui.kills.textContent=String(game.kills).padStart(2,'0');ui.best.textContent=String(best).padStart(2,'0');ui.announcement.textContent=game.mode==='playing'?(game.notice>0?'第 '+game.wave+' 波 · 保持警戒':game.intermission>0?'区域肃清 · 下一波即将抵达':''):'';
}
function frame(now){const dt=last?(now-last)/1000:0;last=now;game.step(dt,{dx:Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy:Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup')),fire:pointer.down||keys.has(' '),aimX:pointer.x,aimY:pointer.y});if(game.kills>best){best=game.kills;try{localStorage.setItem('outpost-best',String(best));}catch{}}
 if(game.mode==='over'&&shown!=='over'){shown='over';clearInput();ui.overlay.hidden=false;ui.pause.disabled=true;ui.eyebrow.textContent='SIGNAL LOST';ui.title.textContent='防线失守';ui.message.textContent='你坚持到了第 '+game.wave+' 波，击倒 '+game.kills+' 只僵尸。再试一次，撑得更久。';ui.start.textContent='重新出发 ↗';}draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
