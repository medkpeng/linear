const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGame,W,H}=require('../engine.js');
const tick=(g,n,input)=>{for(let i=0;i<n;i++)g.step(.05,input);};
test('movement normalizes diagonals and stays within arena',()=>{const a=createGame(),b=createGame();a.start();b.start();a.step(.05,{dx:1});b.step(.05,{dx:1,dy:1});assert.ok(Math.abs(Math.hypot(b.player.x-W/2,b.player.y-H/2)-(a.player.x-W/2))<1e-9);tick(a,300,{dx:1,dy:-1});assert.equal(a.player.x,W-a.player.r);assert.equal(a.player.y,a.player.r);});
test('shot kills once and is consumed on collision',()=>{const g=createGame();g.start();g.remaining=0;g.zombies=[{x:620,y:320,r:16,hp:1,speed:0}];g.step(.05,{fire:true,aimX:1000,aimY:320});assert.equal(g.kills,1);assert.equal(g.zombies.length,0);assert.equal(g.bullets.length,0);tick(g,10);assert.equal(g.kills,1);});
test('armored zombie takes two hits',()=>{const g=createGame();g.start();g.zombies=[{x:620,y:320,r:16,hp:2,speed:0}];g.step(.05,{fire:true,aimX:1000,aimY:320});assert.equal(g.zombies[0].hp,1);tick(g,4,{fire:true,aimX:1000,aimY:320});assert.equal(g.kills,1);});
test('close-range shots hit moving zombies at both 20 and 60 FPS',()=>{
 for(const dt of [.05,1/60]){const g=createGame();g.start();g.remaining=0;g.zombies=[{x:600,y:320,r:16,hp:1,speed:47}];
  g.step(dt,{fire:true,aimX:1000,aimY:320});assert.equal(g.kills,1);assert.equal(g.zombies.length,0);assert.equal(g.bullets.length,0);
 }
});
test('swept shots hit along diagonal paths and are consumed once',()=>{
 const g=createGame();g.start();g.remaining=0;g.zombies=[{x:590,y:350,r:16,hp:1,speed:0},{x:590,y:350,r:16,hp:1,speed:0}];
 g.step(.05,{fire:true,aimX:1000,aimY:760});assert.equal(g.kills,1);assert.equal(g.zombies.length,1);assert.equal(g.bullets.length,0);
});
test('swept shots exclude zombies outside the segment collision area',()=>{
 for(const [x,y] of [[600,341],[650,320],[560,320]]){const g=createGame();g.start();g.remaining=0;g.zombies=[{x,y,r:16,hp:1,speed:0}];
  g.step(.05,{fire:true,aimX:1000,aimY:320});assert.equal(g.kills,0);assert.equal(g.zombies.length,1);assert.equal(g.bullets.length,1);
 }
});
test('zero-length bullet paths still detect overlaps',()=>{
 const g=createGame();g.start();g.remaining=0;g.zombies=[{x:600,y:320,r:16,hp:1,speed:0}];
 g.step(0,{fire:true,aimX:1000,aimY:320});assert.equal(g.kills,1);assert.equal(g.bullets.length,0);
});
test('contact damage has invulnerability and stops at game over',()=>{const g=createGame();g.start();g.remaining=0;g.zombies=[{x:560,y:320,r:16,hp:100,speed:0}];g.step(.05);assert.equal(g.player.hp,80);tick(g,10);assert.equal(g.player.hp,80);tick(g,80);assert.equal(g.mode,'over');assert.equal(g.player.hp,0);const time=g.time;g.step(.05);assert.equal(g.time,time);});
test('cleared waves heal and spawn a larger next wave',()=>{const g=createGame();g.start();g.remaining=0;g.zombies=[];g.player.hp=70;tick(g,41);assert.equal(g.wave,2);assert.equal(g.player.hp,85);assert.equal(g.remaining,11);});
test('pause freezes simulation and restart resets all combat state',()=>{const g=createGame();g.start();tick(g,20,{fire:true});g.mode='paused';const snapshot=JSON.stringify(g);tick(g,20,{dx:1,fire:true});assert.equal(JSON.stringify(g),snapshot);g.kills=99;g.player.hp=0;g.start();assert.equal(g.mode,'playing');assert.equal(g.kills,0);assert.equal(g.player.hp,100);assert.equal(g.wave,1);assert.deepEqual(g.bullets,[]);assert.deepEqual(g.zombies,[]);});
test('spawning follows wave budget and frame delta is bounded',()=>{const g=createGame(()=>.5);g.start();g.step(100);assert.equal(g.time,.05);tick(g,140);assert.equal(g.remaining,0);assert.equal(g.zombies.length,8);});
test('boss spawns once at five minutes without consuming the wave budget',()=>{
 const g=createGame(()=>.5);g.start();g.time=299.94;g.spawnTimer=10;const budget=g.remaining;
 g.step(.05);assert.equal(g.bossSpawned,false);g.step(.05);
 const boss=g.zombies.find(z=>z.boss);assert.ok(boss);assert.equal(boss.hp,40);assert.equal(boss.r,36);assert.equal(g.remaining,budget);assert.equal(g.bossNotice,5);
 boss.speed=0;tick(g,100);assert.equal(g.zombies.filter(z=>z.boss).length,1);
 g.zombies=[];g.step(.05);assert.equal(g.zombies.filter(z=>z.boss).length,0);
});
test('pause and game over freeze boss countdown; restart resets boss state',()=>{
 const g=createGame();g.start();g.time=299.99;
 for(const mode of ['paused','over']){g.mode=mode;tick(g,100);assert.equal(g.time,299.99);assert.equal(g.bossSpawned,false);}
 g.mode='playing';g.step(.05);assert.equal(g.bossSpawned,true);
 g.start();assert.equal(g.time,0);assert.equal(g.bossSpawned,false);assert.equal(g.bossNotice,0);assert.equal(g.zombies.length,0);
 g.time=299.99;g.step(.05);assert.equal(g.zombies.filter(z=>z.boss).length,1);
});
test('boss takes multiple hits, blocks wave clear, and counts one kill',()=>{
 const g=createGame(()=>.5);g.start();g.time=299.99;g.step(.05);
 const boss=g.zombies.find(z=>z.boss);Object.assign(boss,{x:620,y:320,speed:0});g.remaining=0;
 g.step(.05,{fire:true,aimX:1000,aimY:320});assert.equal(boss.hp,39);assert.equal(g.kills,0);
 tick(g,45);assert.equal(g.wave,1);assert.equal(g.intermission,0);
 tick(g,160,{fire:true,aimX:1000,aimY:320});assert.equal(g.kills,1);assert.equal(g.zombies.length,0);
 tick(g,41);assert.equal(g.wave,2);assert.equal(g.bossSpawned,true);
});
test('boss contact deals 35 damage and respects invulnerability',()=>{
 const g=createGame();g.start();g.time=299.99;g.step(.05);const boss=g.zombies.find(z=>z.boss);
 Object.assign(boss,{x:g.player.x,y:g.player.y,speed:0});g.step(.05);assert.equal(g.player.hp,65);
 tick(g,10);assert.equal(g.player.hp,65);tick(g,8);assert.equal(g.player.hp,30);
});
test('shotgun fires five symmetric short-range pellets with a slower cooldown',()=>{
 const g=createGame();g.start();g.step(0,{weapon:'shotgun',fire:true,aimX:1000,aimY:320});
 assert.equal(g.weapon,'shotgun');assert.equal(g.bullets.length,5);assert.equal(g.cooldown,.65);
 assert.ok(g.bullets[0].vy<0);assert.equal(g.bullets[2].vy,0);assert.ok(g.bullets[4].vy>0);
 tick(g,8,{fire:true});assert.equal(g.bullets.length,5);tick(g,2);assert.equal(g.bullets.length,0);
});
test('multiple shotgun pellets damage a boss but count its death only once',()=>{
 const g=createGame();g.start();g.remaining=0;g.zombies=[{x:620,y:320,r:36,hp:3,maxHp:40,speed:0,boss:true}];
 g.step(.05,{weapon:'shotgun',fire:true,aimX:1000,aimY:320});assert.equal(g.kills,1);assert.equal(g.zombies.length,0);
});
test('switching retains cooldown, ignores invalid weapons, freezes when paused and resets on restart',()=>{
 const g=createGame();g.start();g.step(0,{weapon:'shotgun',fire:true});g.step(0,{weapon:'rifle',fire:true});
 assert.equal(g.weapon,'rifle');assert.equal(g.bullets.length,5);assert.equal(g.cooldown,.65);
 g.step(0,{weapon:'invalid'});assert.equal(g.weapon,'rifle');
 g.mode='paused';g.step(.05,{weapon:'shotgun'});assert.equal(g.weapon,'rifle');
 g.mode='playing';g.step(0,{weapon:'shotgun'});g.start();assert.equal(g.weapon,'rifle');assert.equal(g.cooldown,0);
});
