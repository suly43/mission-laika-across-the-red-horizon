let ctx=null,master=null,muted=false;
try{muted=localStorage.getItem('jam-muted')==='true'}catch{}
export function isMuted(){return muted}
export function toggleMute(){muted=!muted;if(master&&ctx)master.gain.setValueAtTime(muted?0:1,ctx.currentTime);try{localStorage.setItem('jam-muted',String(muted))}catch{}return muted}
export function tone(kind='tap'){
 if(muted)return;
 try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();if(!master){master=ctx.createGain();master.connect(ctx.destination)}master.gain.setValueAtTime(1,ctx.currentTime);
 if(kind==='swoosh'){const duration=.55,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1);const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),volume=ctx.createGain(),now=ctx.currentTime;source.buffer=buffer;filter.type='bandpass';filter.Q.value=.7;filter.frequency.setValueAtTime(650,now);filter.frequency.exponentialRampToValueAtTime(4500,now+.2);filter.frequency.exponentialRampToValueAtTime(350,now+duration);volume.gain.setValueAtTime(.0001,now);volume.gain.exponentialRampToValueAtTime(.11,now+.12);volume.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(filter);filter.connect(volume);volume.connect(master);source.start(now);source.stop(now+duration);return}

 const notes={tick:[800],urgent:[1100],launch:[262,392,523,784],received:[659,880],pause:[440,330],resume:[330,440],save:[523,784],toggle:[550],step:[160],tap:[440],success:[523,659,784],warning:[260,190],jump:[330,520],win:[523,659,784,1047],xp:[784,1047]};
 (notes[kind]||notes.tap).forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.09;o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(kind==='success'||kind==='win'?.22:kind==='step'?.025:kind==='tick'?.035:kind==='urgent'?.06:.09,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(master);o.start(t);o.stop(t+.19)})
 }catch{}
}

// One cue per displayed second; resuming never replays missed ticks.
export function countdownCue(play=tone){let previous=null;return (remaining,enabled=true)=>{const value=Math.max(0,Math.ceil(remaining));if(enabled&&previous!==null&&value<previous&&value>0)play(value<=10?'urgent':'tick');previous=value}}
