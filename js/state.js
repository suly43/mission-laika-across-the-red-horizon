const KEY='jam-trainer-save-v1';
export const freshState=()=>({screen:'title',name:'Junior Astronaut',buddy:'🐼',mode:'basic',stats:{immunity:3,technical:3,endurance:3},xp:0,level:1,step:'intro',power:null,shield:0,comms:false,battery:100,health:100,oxygen:100,co2:0,laikaBattery:100,photos:0,bonusPhoto:false,samples:0,errors:0,co2Warning:false,foodSafe:false,harness:false,cleaned:false,stormRisk:'low',achievements:[],muted:false,highContrast:false,largeText:false,reducedMotion:false,classroom:false,quizAnswered:{},note:'',lastEnding:null});
let current=freshState();
export function getState(){return current}
export function setState(next){current=next;save()}
export function patchState(patch){current={...current,...patch};save();return current}
export function save(){try{localStorage.setItem(KEY,JSON.stringify(current))}catch(e){console.warn('Save unavailable',e)}}
export function load(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved)current={...freshState(),...saved,stats:{...freshState().stats,...saved.stats}}}catch{current=freshState()}return current}
export function reset(){current=freshState();save();return current}
export function addXP(n){current.xp+=n;save()}
export function award(name){if(!current.achievements.includes(name))current.achievements.push(name);save()}

export function startNewMission(){
 const preferences=Object.fromEntries(['muted','highContrast','largeText','reducedMotion','classroom'].map(k=>[k,current[k]]));
 current={...freshState(),...preferences,screen:'create'};save();return current;
}
