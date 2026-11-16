export function getView(s){
 if(s.step==='quiz')return {title:'Level 4 Quiz · Lava Tunnels',lead:'Why are lava tunnels interesting places to explore and shelter on Mars?',laika:'One last science question before the debrief.',visual:'🧠 🌋',choices:[['quizyes','Rock overhead can shelter from radiation and temperature swings','Correct. That is why scientists study caves for future explorers.'],['quizno','Because they are always bright and warm','Not quite. They are dark, so Laika needs her flashlight.']]};
 return {title:'Lava Tunnel Exploration',lead:'Turn on the flashlight (F), jump from rock to rock with Space, and press E to use the rock-sample button and the camera. Collect both for mission success, then reach the glowing EXIT on the far right. Returning without them gives an incomplete mission. You have 4 minutes. If you fall, you restart at the last checkpoint.',laika:'These tunnels can shelter us from extreme conditions, but not every path is safe. The flashlight uses battery, so use it wisely!',visual:'🌋 🔦 🪨 📷',choices:[['go','Start the tunnel mission','Find the sample and the camera, then reach the exit.']]};
}
export function handle(s,id){
 s.note='';
 if(s.step==='samples'&&id==='go'){s.step='play';return}
 if(s.step==='quiz'){if(id==='quizyes'){s.xp+=10;s.note='Correct!'}else{s.errors++;s.note='Try again: lava tunnels are dark, but rock shelters from radiation and temperature swings.';return}s.step='ending';s.screen='ending'}
}
