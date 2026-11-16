export function getView(s){
 if(s.step==='quiz')return {title:'Level 3 Quiz · Storm and Cold',lead:'Why did Laika shelter and hibernate instead of working through the sandstorm and the cold?',laika:'Science matters, but so does getting home!',visual:'🧠 🌪️',choices:[['quizyes','To protect her solar panels, batteries and systems','Correct. Dust blocks sunlight and extreme cold can damage batteries.'],['quizno','Because dust storms make Mars warmer','Not quite. Dust can reduce sunlight reaching solar panels.']]};
 if(s.step==='return')return {title:'Into the Lava Tunnels',lead:'Laika survived the surface. Lava tunnels can shelter her from extreme conditions, but not every path is safe.',laika:'We’re almost done! Let’s explore the tunnel.',visual:'🌋 🐕‍🦺',choices:[['next','Enter the lava tunnel','Level 4: flashlight, jumping, a rock sample and a camera.']]};
 return {title:'Exploring the Martian Surface',lead:'Visit the six camera markers and press E to photograph them. A sandstorm and an extreme-cold period are coming. You have 5 minutes. Move with arrow keys, WASD or the on-screen pad.',laika:'We did it, astronaut! I’m on Mars. Each photograph helps us study the terrain. Dust can block my solar panels, so be ready to shelter.',visual:'🏜️ 📷 🌪️ 🥶',choices:[['go','Start the 5-minute mission','Shelter behind the rocks and press L in the storm. When it turns very cold, reach the lava tunnel and press H to hibernate.']]};
}
export function handle(s,id){
 s.note='';
 if(s.step==='explore'&&id==='go'){s.step='play';return}
 if(s.step==='quiz'){if(id==='quizyes'){s.xp+=10;s.step='return'}else{s.errors++;s.note='Try again: dust blocks sunlight and cold harms batteries.'}return}
 if(s.step==='return'){s.level=4;s.step='samples';s.screen='control';s.note='Laika: Let’s explore the lava tunnel!'}
}
