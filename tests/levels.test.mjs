// Game-logic tests. Run with: npm test   (Node 18+; no packages needed)
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,setState,getState,startNewMission} from '../js/state.js';
import * as L1 from '../js/levels/level1.js';
import * as L2 from '../js/levels/level2.js';
import * as L3 from '../js/levels/level3.js';
import * as L4 from '../js/levels/level4.js';
import {endingInfo, certificateMarkup} from '../js/endings.js';
import {makeWalker, makePlatformer} from '../js/games.js';

globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const play = (mod, s, ...ids) => ids.forEach(id => mod.handle(s, id));
const run = (g, seconds, keys = {}) => { for (let i = 0; i < seconds * 20 && !g.over; i++) g.update(0.05, keys); };

test('Level 1: the safe path completes and unlocks Level 2', () => {
  const s = freshState();
  play(L1, s, 'begin', 'sealed', 'crumb1', 'crumb2', 'crumb3', 'crumb4', 'quarters', 'harness', ...Array.from({length:12},(_,i)=>i%2?'right':'left'), 'quizyes', 'next');
  assert.equal(s.errors, 0); assert.equal(s.level, 2); assert.equal(s.screen, 'control');
});
test('Level 1: crumbly food is a mistake; advanced mode costs more', () => {
  const b = freshState(), a = {...freshState(), mode: 'advanced'};
  play(L1, b, 'begin', 'cookie'); play(L1, a, 'begin', 'cookie');
  assert.equal(b.step, 'food'); assert.equal(b.errors, 1); assert.equal(b.battery, 100); assert.ok(a.battery < 100);
});
test('Level 1: wrong sleeping spot gives a CO2 warning; the quarters are safe but use fan power', () => {
  const s = freshState(); s.step = 'rest';
  L1.handle(s, 'control'); assert.equal(s.co2Warning, true); assert.equal(s.step, 'rest');
  L1.handle(s, 'quarters'); assert.equal(s.co2Warning, false); assert.equal(s.battery, 97);
});
test('Level 2: landing kit needs parachute + heat shield + Sky Crane', () => {
  const s = freshState(); s.step = 'equip';
  play(L2, s, 'parachute', 'heatshield', 'duck');
  assert.equal(s.step, 'equip'); assert.equal(s.errors, 1); assert.deepEqual(s.picks, []);
  play(L2, s, 'parachute', 'heatshield', 'skycrane');
  assert.equal(s.step, 'power');
});
test('Level 2: radioisotope costs energy up front; more shielding costs more power', () => {
  const solar = freshState(), nuke = freshState(); solar.step = nuke.step = 'power';
  L2.handle(solar, 'solar'); L2.handle(nuke, 'nuclear');
  assert.equal(solar.battery, 100); assert.equal(nuke.battery, 95);
  const none = freshState(), rover = freshState(); none.step = rover.step = 'shield';
  L2.handle(none, 'none'); L2.handle(rover, 'rover');
  assert.equal(rover.shieldRover, 3); assert.ok(rover.battery < none.battery);
});
test('Level 2: repeating the message or restarting resets the signal timer; arrival passes the test', () => {
  const s = freshState(); s.step = 'comms';
  L2.handle(s, 'send'); assert.equal(s.step, 'waiting');
  L2.handle(s, 'repeat'); assert.equal(s.errors, 1); assert.equal(s.step, 'waiting');
  L2.handle(s, 'restart'); assert.equal(s.errors, 2); assert.ok(s.battery < 100);
  L2.handle(s, 'arrived'); assert.equal(s.comms, true); assert.equal(s.step, 'quiz');
});
test('shield stage quotes the Curiosity RAD dose', () => {
  const s = {...freshState(), step: 'shield'};
  assert.match(L2.getView(s).lead, /0\.64 millisieverts/);
});
test('Levels 3 and 4: briefing starts the real-time game', () => {
  const a = {...freshState(), level: 3, step: 'explore'}; L3.handle(a, 'go'); assert.equal(a.step, 'play');
  const b = {...freshState(), level: 4, step: 'samples'}; L4.handle(b, 'go'); assert.equal(b.step, 'play');
});

// ---- Level 3: Mars walker ----
test('walker: a photo needs a nearby marker and costs battery (solar more than radioisotope)', () => {
  const s = makeWalker({solar: true, battery: 100, health: 100}), n = makeWalker({solar: false, battery: 100, health: 100});
  s.act('photo'); assert.equal(s.photos, 0);
  for (const g of [s, n]) { g.x = g.spots[0].x; g.y = g.spots[0].y; g.act('photo'); }
  assert.equal(s.photos, 1); assert.ok(s.battery < n.battery);
  s.act('photo'); assert.equal(s.photos, 1, 'same marker cannot be used twice');
});
test('walker: sheltering behind the rocks in Low Power Mode beats driving through the storm', () => {
  const mk = () => makeWalker({solar: true, shield: 0, risk: 'low', battery: 100, health: 100});
  const safe = mk(), exposed = mk();
  for (const g of [safe, exposed]) g.t = 300 - 100;
  safe.x = safe.rocks.x + 20; safe.y = safe.rocks.y + 20;
  run(safe, 0.1); safe.act('low'); run(safe, 20);
  run(exposed, 20);
  assert.ok(safe.battery > exposed.battery + 20); assert.ok(safe.health > exposed.health);
});
test('walker: more rover shielding means less storm damage', () => {
  const mk = shield => { const g = makeWalker({solar: true, shield, risk: 'low', battery: 100, health: 100}); g.t = 200; run(g, 10); return g.health; };
  assert.ok(mk(3) > mk(0));
});
test('walker: hibernating inside the lava tunnel survives the cold; staying outside destroys Laika', () => {
  const ok = makeWalker({solar: false, battery: 100, health: 100}), bad = makeWalker({solar: false, battery: 100, health: 100});
  ok.t = bad.t = 300 - 89.9;ok.stormStarted=bad.stormStarted=true;ok.photos=6;
  ok.x = ok.tunnel.x + 20; ok.y = ok.tunnel.y + 20; ok.act('hib');
  run(ok, 50); run(bad, 50);
  assert.equal(ok.over, 'ok'); assert.equal(bad.over, 'destroyed');
});

// ---- Level 4: lava tunnel ----
test('platformer: falling returns Laika to the last checkpoint and costs battery', () => {
  const g = makePlatformer({battery: 100, health: 100});
  g.x = 300; g.y = 200; run(g, 3);
  assert.ok(g.x < 100 && g.battery < 100 - 3.5, 'back at the entrance after the fall');
});
test('platformer: an incomplete return is possible; the flashlight drains battery faster', () => {
  const g = makePlatformer({battery: 100, health: 100});
  g.x = g.exitX; g.y = 300; g.update(0.05); assert.equal(g.over, 'exit');g.over=null;
  g.sample = g.camera = true; g.x = g.exitX; g.update(0.05); assert.equal(g.over, 'exit');
  const lit = makePlatformer({battery: 100, health: 100}), dark = makePlatformer({battery: 100, health: 100});
  lit.act('light'); run(lit, 10); run(dark, 10); assert.ok(lit.battery < dark.battery);
});
test('platformer: sample and camera buttons only work when Laika is next to them', () => {
  const g = makePlatformer({battery: 100, health: 100});
  g.act('use'); assert.equal(g.sample, false);
  g.x = g.sampleBtn.x; g.y = g.sampleBtn.y; g.act('use'); assert.equal(g.sample, true);
  g.x = g.cameraBtn.x; g.y = g.cameraBtn.y; g.act('use'); assert.equal(g.camera, true);
});

test('every level view has a title and choices at every step', () => {
  const steps = {1:['intro','food','clean','harness','exercise','rest','quiz','done'], 2:['equip','power','shield','comms','waiting','quiz','done'], 3:['explore','quiz','return'], 4:['samples','quiz']};
  const mods = {1: L1, 2: L2, 3: L3, 4: L4};
  for (const [lvl, list] of Object.entries(steps)) for (const step of list) {
    const v = mods[lvl].getView({...freshState(), level: Number(lvl), step});
    assert.ok(v.title && v.choices?.length > 0, `level ${lvl} step ${step}`);
  }
});
test('grades and certificate escaping', () => {
  assert.equal(endingInfo({...freshState(), lastEnding: 'win', errors: 0}).grade, 'A');
  assert.equal(endingInfo({...freshState(), lastEnding: 'lose'}).grade, 'F');
  assert.ok(!certificateMarkup('<img src=x onerror=alert(1)>', 'A', 1).includes('<img'));
});

test('cleaning requires four distinct crumbs',()=>{const s={...freshState(),step:'clean'};play(L1,s,'crumb1','crumb1');assert.equal(s.cleanCount,1);assert.equal(s.step,'clean')});
test('saved walker continues with collected camera markers',()=>{const g=makeWalker({battery:100,health:100,solar:true});g.x=g.spots[0].x;g.y=g.spots[0].y;g.act('photo');const saved=JSON.parse(JSON.stringify(g));assert.equal(saved.spots[0].done,true);assert.equal(saved.photos,1)});

test('new mission removes old levels, XP and live snapshots but keeps reading preferences',()=>{setState({...freshState(),level:4,xp:220,screen:'ending',activeGame:{kind:'platformer',data:{sample:true}},resumeStage:'play',highContrast:true});const s=startNewMission();assert.equal(s.level,1);assert.equal(s.xp,0);assert.equal(s.screen,'create');assert.equal(s.activeGame,undefined);assert.equal(s.resumeStage,undefined);assert.equal(s.highContrast,true);assert.equal(getState(),s)});
test('Basic mode does not fail because tunnel deadline expires',()=>{const g=makePlatformer({mode:'basic',battery:100,health:100});g.t=.01;g.update(.05);assert.equal(g.over,null)});
test('Advanced mode does fail on tunnel deadline',()=>{const g=makePlatformer({mode:'advanced',battery:100,health:100});g.t=.01;g.update(.05);assert.equal(g.over,'timeout')});
test('camera state remains consistent after snapshot restore',()=>{const cfg={battery:100,health:100};const first=makeWalker(cfg);first.x=90;first.y=70;first.act('photo');const saved=JSON.parse(JSON.stringify(first));const next=makeWalker(cfg);Object.assign(next,saved);next.act('photo');assert.equal(next.photos,1);next.x=250;next.y=60;next.act('photo');assert.equal(next.photos,2)});

test('Level 4 can be won by moving and jumping across every platform, without teleporting',()=>{
 const g=makePlatformer({battery:65,health:100,solar:true,mode:'advanced'});
 g.act('light');let falls=0,previousX=g.x;
 for(let frame=0;frame<60*60&&!g.over;frame++){
  const platform=g.platforms.find(p=>g.ground&&Math.abs(g.y-p.y)<1&&g.x>=p.x&&g.x<=p.x+p.w);
  if(platform&&platform.x+platform.w-g.x<20)g.act('jump');
  g.act('use');g.update(1/60,{r:true});if(g.x<previousX-100)falls++;previousX=g.x;
 }
 assert.equal(g.over,'exit');assert.equal(g.sample,true);assert.equal(g.camera,true);assert.equal(falls,0);assert.ok(g.battery>0);
});

test('screenshot scenario: six photos after storm can exit before cold starts',()=>{
 const g=makeWalker({mode:'basic',solar:true,battery:49,health:86});
 g.photos=6;g.stormStarted=true;g.t=235;g.x=590;g.y=280;
 for(let i=0;i<180&&!g.over;i++)g.update(1/60,{u:true});
 assert.equal(g.over,'ok');assert.equal(g.coldStarted,false);
});
test('surface exit does not skip missing photos or teleport Laika',()=>{
 const g=makeWalker({battery:100,health:100});g.act('exit');assert.equal(g.over,null);
 g.photos=6;g.act('exit');assert.equal(g.over,null);assert.match(g.msg,/top right/);
 g.x=580;g.y=50;g.act('exit');assert.equal(g.over,'ok');
});

import {countdownCue} from '../js/audio.js';
test('countdown sounds once per changed second, with urgent final ten seconds',()=>{const sounds=[];const cue=countdownCue(x=>sounds.push(x));cue(12);cue(11.8);cue(11);cue(11);cue(10);cue(9);assert.deepEqual(sounds,['tick','urgent','urgent'])});
test('paused countdown updates do not play or replay missed ticks',()=>{const sounds=[];const cue=countdownCue(x=>sounds.push(x));cue(30);cue(25,false);cue(25);assert.deepEqual(sounds,[]);cue(24);assert.deepEqual(sounds,['tick']);cue(0);assert.equal(sounds.length,1)});
