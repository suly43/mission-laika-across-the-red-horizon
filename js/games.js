import {tone,countdownCue} from './audio.js';
import {MISSION_PHOTOS} from './mission-photos.js';
// Real-time mini-games for Level 3 (Mars walker) and Level 4 (lava-tunnel platformer).
// The rules live in makeWalker/makePlatformer (pure, testable); runGame only wires up canvas, keys and touch buttons.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const RISK={low:0,medium:1,high:2};

export function makeWalker(cfg){
  const W=640,H=400;
  const pictures=typeof Image==='undefined'?[]:MISSION_PHOTOS.map(p=>{const im=new Image();im.src=p.url;return im});
  const spots=[[90,70],[250,60],[430,90],[110,230],[300,200],[470,260]].map(([x,y])=>({x,y,done:false}));
  const rocks={x:540,y:310,w:90,h:70}, tunnel={x:540,y:15,w:90,h:70};
  const g={W,H,spots,rocks,tunnel,t:300,x:30,y:340,photos:0,battery:cfg.battery,health:cfg.health,hib:false,low:false,
    storm:0,cold:0,stormStarted:false,coldStarted:false,over:null,msg:'Move Laika, then press E near a camera marker. Six photos needed.'};
  const inBox=b=>g.x>b.x&&g.x<b.x+b.w&&g.y>b.y&&g.y<b.y+b.h;
  g.inRocks=()=>inBox(rocks); g.inTunnel=()=>inBox(tunnel);
  g.frozen=()=>g.hib||(g.storm>0&&g.low);
  g.update=(dt,k={})=>{
    if(g.over)return; g.t-=dt; const el=300-g.t;
    if(!g.stormStarted&&el>=35){g.stormStarted=true;g.storm=25;g.msg='Warning! Sandstorm! Dust blocks my solar panels. Shelter behind the rocks and press L for Low Power Mode.'}
    if(!g.coldStarted&&el>=90){g.coldStarted=true;g.cold=45;g.msg='Temperature alert! It may reach -125°C. Reach the lava tunnel and press H for Hibernation Mode.'}
    if(!g.frozen()){g.x=clamp(g.x+((k.r?1:0)-(k.l?1:0))*85*dt,10,W-10);g.y=clamp(g.y+((k.d?1:0)-(k.u?1:0))*85*dt,10,H-10);g.battery-=0.12*(1-0.05*((cfg.endurance||3)-3))*dt}
    if(g.storm>0){g.storm-=dt;const safe=g.inRocks()&&g.low;
      g.battery-=safe?0.1*dt:(cfg.solar?2.4:1.4)*(1+0.25*RISK[cfg.risk||'low'])*dt;
      if(!safe)g.health-=Math.max(0.2,1.2-0.3*(cfg.shield||0))*dt;
      if(g.storm<=0){g.storm=0;g.low=false;g.msg='The storm has passed. Back to work!'}}
    if(g.cold>0){g.cold-=dt;if(!(g.hib&&g.inTunnel()))g.battery-=3*dt;
      if(g.cold<=0){g.cold=0;g.hib=false;g.msg='Cold has passed. Finish the photos, then return to the tunnel.'}}
    if(g.battery<=0||g.health<=0){g.battery=Math.max(0,g.battery);g.health=Math.max(0,g.health);g.over='destroyed'}
    else if(g.photos>=6&&g.inTunnel()&&g.storm===0&&(g.cold===0||g.hib))g.over='ok';
    if(!g.over&&g.photos>=6&&g.storm===0&&g.cold===0)g.msg='6/6 complete! Move to the green EXIT at the top right. Switch off Hibernation (H) to move.';
    if(!g.over&&g.t<=0&&cfg.mode!=='basic')g.over=(g.hib&&g.inTunnel())?'ok':'destroyed';
  };
  g.act=a=>{
    if(g.over)return;
    if(a==='exit'){if(g.photos<6)g.msg='Collect all six image records first.';else if(!g.inTunnel())g.msg='Move Laika into the green EXIT at the top right.';else if(g.storm>0)g.msg='Wait for the storm to pass.';else if(g.cold>0&&!g.hib)g.msg='Press H to hibernate safely inside the tunnel.';else g.over='ok';return}
    if(a==='photo'){
      if(g.frozen()||g.storm>0){g.msg='No science during a storm or low power!';return}
      const s=g.spots.find(p=>!p.done&&Math.hypot(p.x-g.x,p.y-g.y)<40);
      if(!s){g.msg='Move closer to an unvisited camera marker.';return}
      s.done=true;g.photos++;g.battery-=cfg.solar?3:2;g.msg=`Photo ${g.photos}/6 saved! Each picture helps us study the terrain.`;
    }
    if(a==='low'){g.low=!g.low;g.msg=g.low?'Low Power Mode on.':'Low Power Mode off.'}
    if(a==='hib'){g.hib=!g.hib;g.msg=g.hib?(g.inTunnel()?'Hibernation on, sheltered in the lava tunnel.':'Hibernation on, but we are not in the tunnel yet!'):'Hibernation off.'}
  };
  g.draw=ctx=>{
    ctx.fillStyle='#8a3d22';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#5a2a1a';ctx.fillRect(rocks.x,rocks.y,rocks.w,rocks.h);ctx.fillRect(tunnel.x,tunnel.y,tunnel.w,tunnel.h);
    ctx.font='20px sans-serif';ctx.fillText('🪨',rocks.x+30,rocks.y+40);ctx.fillText('🌋',tunnel.x+30,tunnel.y+40);
    ctx.font='11px sans-serif';ctx.fillStyle='#fff';ctx.fillText('Rocks (shelter)',rocks.x+5,rocks.y-4);ctx.fillText('EXIT → LEVEL 4',tunnel.x,tunnel.y+tunnel.h+15);ctx.strokeStyle='#8ef0c0';ctx.lineWidth=4;ctx.strokeRect(tunnel.x,tunnel.y,tunnel.w,tunnel.h);
    ctx.font='24px sans-serif';g.spots.forEach((p,i)=>{const im=pictures[i%3];ctx.fillStyle='#fff';ctx.fillRect(p.x-22,p.y-18,44,36);if(im?.complete&&im.naturalWidth)ctx.drawImage(im,p.x-20,p.y-16,40,32);else{ctx.fillStyle='#44235f';ctx.font='12px sans-serif';ctx.fillText('IMAGE',p.x-19,p.y+4)}if(p.done){ctx.fillStyle='#8ef0c0';ctx.font='18px sans-serif';ctx.fillText('✓',p.x+12,p.y-12)}});ctx.font='24px sans-serif';
    ctx.fillText(g.hib?'💤':'🐕',g.x-12,g.y+8);
    if(g.storm>0){ctx.fillStyle='rgba(230,160,60,.45)';ctx.fillRect(0,0,W,H)}
    if(g.cold>0){ctx.fillStyle='rgba(60,120,255,.28)';ctx.fillRect(0,0,W,H)}
    ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(0,0,W,24);ctx.fillStyle='#fff';ctx.font='14px sans-serif';
    const m=Math.max(0,Math.ceil(g.t));ctx.fillText(`${cfg.mode==='basic'?'Practice · no deadline':`⏱ ${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`}   📷 ${g.photos}/6   🔋 ${Math.round(g.battery)}%   ❤ ${Math.round(g.health)}%`+(g.cold>0?`   🥶 cold ${Math.ceil(g.cold)}s`:''),8,17);
    ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(0,H-26,W,26);ctx.fillStyle='#ffd';ctx.fillText(g.msg.slice(0,95),8,H-9);
  };
  return g;
}

export function makePlatformer(cfg){
  const W=640,H=360,WORLD=1720;
  const pictures=typeof Image==='undefined'?[]:MISSION_PHOTOS.map(p=>{const im=new Image();im.src=p.url;return im});
  const platforms=[[0,300,260],[340,300,140],[560,250,120],[760,300,160],[1000,260,110],[1190,210,120],[1380,300,200],[1620,300,100]].map(([x,y,w])=>({x,y,w}));
  const g={W,H,WORLD,platforms,t:240,x:40,y:260,vy:0,ground:false,light:false,battery:cfg.battery,health:cfg.health,
    sample:false,camera:false,cp:{x:40,y:260},over:null,sampleBtn:{x:850,y:300},cameraBtn:{x:1490,y:300},exitX:1660,
    msg:'Press F for the flashlight. Find the rock sample and the camera, then reach the exit.'};
  g.update=(dt,k={})=>{
    if(g.over)return; g.t-=dt; g.battery-=(g.light?0.22:0.05)*(cfg.solar?1:0.7)*dt;
    g.x=clamp(g.x+((k.r?1:0)-(k.l?1:0))*180*dt,0,WORLD);
    const prev=g.y; g.vy+=1100*dt; g.y+=g.vy*dt; g.ground=false;
    for(const p of platforms){if(g.vy>=0&&g.x>=p.x&&g.x<=p.x+p.w&&prev<=p.y&&g.y>=p.y){g.y=p.y;g.vy=0;g.ground=true;
      if(p.x===760&&g.cp.x!==790){g.cp={x:790,y:300};g.msg='Checkpoint saved!'}}}
    if(g.y>H+80){g.x=g.cp.x;g.y=g.cp.y;g.vy=0;g.battery-=4;g.msg="You've lost your balance. Back to the last checkpoint!"}
    if(g.x>=g.exitX&&g.ground){g.over='exit'}
    if(g.battery<=0){g.battery=0;g.over='dead'}else if(g.t<=0&&cfg.mode!=='basic')g.over='timeout';
  };
  g.jump=()=>{if(g.ground){g.vy=-520;g.ground=false}};
  const near=b=>Math.abs(g.x-b.x)<40&&Math.abs(g.y-b.y)<30;
  g.act=a=>{
    if(g.over)return;
    if(a==='light'){g.light=!g.light;g.msg=g.light?'Flashlight on (uses battery).':'Flashlight off.'}
    if(a==='jump')g.jump();
    if(a==='use'){
      if(near(g.sampleBtn)&&!g.sample){g.sample=true;g.msg='Rock sample recorded! It shows what Martian terrain is made of.'}
      else if(near(g.cameraBtn)&&!g.camera){g.camera=true;g.msg='Photograph completed! We have the visual record.'}
      else g.msg='Nothing to use here. A flashlight helps you find the buttons.';
    }
  };
  g.draw=ctx=>{
    const cx=clamp(g.x-200,0,WORLD-W);
    ctx.fillStyle='#1a0f0a';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#7a4a32';platforms.forEach(p=>ctx.fillRect(p.x-cx,p.y,p.w,H-p.y));
    ctx.font='22px sans-serif';
    ctx.fillText(g.sample?'✅':'🪨',g.sampleBtn.x-cx-10,g.sampleBtn.y-4);
    pictures.forEach((im,i)=>{const x=g.cameraBtn.x-cx-40+i*28,y=g.cameraBtn.y-48;ctx.fillStyle='#eee';ctx.fillRect(x-2,y-2,28,38);if(im.complete&&im.naturalWidth)ctx.drawImage(im,x,y,24,34)});ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.fillText(g.camera?'Images saved':'E: collect images',g.cameraBtn.x-cx-45,g.cameraBtn.y-55);
    ctx.fillStyle='#8ef0c0';ctx.fillRect(g.exitX-cx-16,250,32,50);ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText('EXIT',g.exitX-cx-20,240);ctx.font='22px sans-serif';
    ctx.fillText('🐕',g.x-cx-12,g.y-2);
    const r=g.light?190:55,sx=g.x-cx,gr=ctx.createRadialGradient(sx,g.y-10,r*0.3,sx,g.y-10,r);
    gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.96)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,0,W,24);ctx.fillStyle='#fff';ctx.font='14px sans-serif';
    const m=Math.max(0,Math.ceil(g.t));ctx.fillText(`${cfg.mode==='basic'?'Practice · no deadline':`⏱ ${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`}   🔋 ${Math.round(g.battery)}%   🪨 ${g.sample?'✔':'–'}   📷 ${g.camera?'✔':'–'}   🔦 ${g.light?'on':'off'}`,8,17);
    ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,H-26,W,26);ctx.fillStyle='#ffd';ctx.fillText(g.msg.slice(0,95),8,H-9);
  };
  return g;
}

export function runGame(kind,root,cfg,onDone){
  const g=kind==='walker'?makeWalker(cfg):makePlatformer(cfg),k={};
  let previous={photos:g.photos||0,sample:false,camera:false,battery:g.battery,over:null};let raf=0,last=0,done=false;
  const holds=kind==='walker'?[['l','◀'],['u','▲'],['d','▼'],['r','▶']]:[['l','◀'],['r','▶']];
  const acts=kind==='walker'?[['photo','📸 Photo (E)'],['low','🌙 Low power (L)'],['hib','💤 Hibernate / Wake (H)'],['exit','Exit to Level 4']]:[['jump','⤒ Jump (Space)'],['use','Use (E)'],['light','🔦 Light (F)']];
  root.innerHTML=`<canvas width="${g.W}" height="${g.H}" style="width:100%;max-width:640px;background:#000;border-radius:12px;touch-action:none" aria-label="Game area"></canvas>
   <div class="actions" style="touch-action:none">${holds.map(([d,l])=>`<button class="btn secondary" data-hold="${d}">${l}</button>`).join('')}${acts.map(([a,l])=>`<button class="btn" data-act="${a}">${l}</button>`).join('')}</div>`;
  root.insertAdjacentHTML('beforeend','<p role="status" id="game-status"></p><button class="btn secondary" id="game-pause">Pause</button>');root.querySelector('#game-pause').onclick=e=>{g.paused=!g.paused;tone(g.paused?'pause':'resume');e.target.textContent=g.paused?'Resume':'Pause'};
  const ctx=root.querySelector('canvas').getContext('2d');
  const keymap=kind==='walker'?{ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r',ArrowUp:'u',w:'u',ArrowDown:'d',s:'d'}:{ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r'};
  const actmap=kind==='walker'?{e:'photo',l:'low',h:'hib'}:{' ':'jump',ArrowUp:'jump',w:'jump',e:'use',f:'light'};
  const act=a=>{if(g.paused||document.querySelector('#dialog-root')?.childElementCount)return;const wasGround=g.ground,light=g.light;g.act(a);if(a==='jump'&&wasGround)tone('jump');else if(a==='light'||a==='low'||a==='hib')tone('tap')};
  const kd=e=>{if(document.querySelector('#dialog-root')?.childElementCount)return;const key=e.key.length>1?e.key:e.key.toLowerCase();if(keymap[key]){k[keymap[key]]=true;e.preventDefault()}if(actmap[key]&&!e.repeat){act(actmap[key]);e.preventDefault()}};
  const ku=e=>{const key=e.key.length>1?e.key:e.key.toLowerCase();if(keymap[key])k[keymap[key]]=false};
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  root.querySelectorAll('[data-hold]').forEach(b=>{const d=b.dataset.hold;b.onpointerdown=e=>{e.preventDefault();k[d]=true};['onpointerup','onpointerleave','onpointercancel'].forEach(ev=>b[ev]=()=>{k[d]=false})});
  root.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act));
  const countdownSound=countdownCue();let lastStorm=0,lastCold=0,lastBatteryBand=Math.floor(g.battery/10);let lastStepSound=0;let completion=null;const clearKeys=()=>Object.keys(k).forEach(x=>k[x]=false);window.addEventListener('blur',clearKeys);
  if(cfg.snapshot){const restored=JSON.parse(JSON.stringify(cfg.snapshot));if(restored.spots){g.spots.forEach((p,i)=>Object.assign(p,restored.spots[i]));delete restored.spots}Object.assign(g,restored)}
  previous={photos:g.photos||0,sample:g.sample,camera:g.camera,battery:g.battery,over:null};
  countdownSound(g.t);lastStorm=g.storm||0;lastCold=g.cold||0;lastBatteryBand=Math.floor(g.battery/10);
  const snapshot=()=>JSON.parse(JSON.stringify(g));
  const stop=()=>{clearTimeout(completion);cfg.save?.(snapshot());window.removeEventListener('blur',clearKeys);cancelAnimationFrame(raf);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)};
  const loop=ts=>{const dt=Math.min(.05,last?(ts-last)/1000:0);last=ts;if(!document.hidden&&!document.querySelector('#dialog-root')?.childElementCount&&!g.paused)g.update(dt,k);g.draw(ctx);
    const audible=!document.hidden&&!g.paused&&!document.querySelector('#dialog-root')?.childElementCount&&!g.over;
    countdownSound(g.t,audible&&cfg.mode!=='basic');
    if(audible&&((g.storm>0&&lastStorm===0)||(g.cold>0&&lastCold===0)))tone('warning');
    const band=Math.floor(g.battery/10);if(audible&&band<lastBatteryBand&&g.battery<=30)tone('warning');lastBatteryBand=band;lastStorm=g.storm||0;lastCold=g.cold||0;
    if(!document.hidden&&!g.paused&&!g.over&&!g.hib&&!document.querySelector('#dialog-root')?.childElementCount&&Object.values(k).some(Boolean)&&ts-lastStepSound>220){tone('step');lastStepSound=ts}
    if((g.photos||0)>previous.photos||g.sample&&!previous.sample||g.camera&&!previous.camera)tone('success');
    if((g.camera||g.photos>0)&&!root.querySelector('.collected-photos')){root.insertAdjacentHTML('beforeend',`<section class="collected-photos"><h3>Mission reference images</h3><p>Reference maps supplied for this mission; not live rover photographs.</p>${MISSION_PHOTOS.map(p=>`<figure><a href="${p.url}" target="_blank" rel="noopener"><img src="${p.url}" alt="${p.title}"></a><figcaption>${p.title}: ${p.description}</figcaption></figure>`).join('')}</section>`)}
    if(previous.battery-g.battery>=3)tone('warning');if(g.over&&!previous.over)tone(g.over==='exit'||g.over==='ok'?'win':'warning');
    previous={photos:g.photos||0,sample:g.sample,camera:g.camera,battery:g.battery,over:g.over};
    root.querySelector('#game-status').textContent=g.msg;
    if(Math.floor(ts/1000)!==g.savedSecond){g.savedSecond=Math.floor(ts/1000);cfg.save?.(snapshot())}
    if(g.over&&!done){done=true;stop();completion=setTimeout(()=>onDone(g),900);return}raf=requestAnimationFrame(loop)};
  raf=requestAnimationFrame(loop);
  return stop;
}
