/* Meteorický únik: fixed-step simulation, independent of rendering and refresh rate. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.IndyMeteor=api;})(typeof window==='object'?window:this,function(){
  const TICK=1000/60,DURATION=60000;
  function create(seed=Date.now()){return{phase:'ready',time:0,remainder:0,lane:1,lives:3,shield:false,invulnerableUntil:0,points:0,crystals:0,combo:0,bestCombo:0,wave:0,nextWave:800,seed:seed>>>0,objects:[],event:'',eventUntil:0};}
  function roll(g){g.seed=(Math.imul(g.seed,1664525)+1013904223)>>>0;return g.seed/4294967296;}
  function wave(g){
    const safe=Math.floor(roll(g)*3),hazards=[0,1,2].filter(l=>l!==safe);
    if(g.time<12000||roll(g)<.3)hazards.splice(Math.floor(roll(g)*2),1);
    const speed=28+20*g.time/DURATION;
    return [...hazards.map(lane=>({lane,kind:'rock'})),{lane:safe,kind:g.wave>0&&g.wave%9===0?'shield':'crystal'}].map((o,i)=>({...o,id:g.wave+'-'+i,y:-6,speed}));
  }
  function move(g,direction){return g.phase==='playing'?{...g,lane:Math.max(0,Math.min(2,g.lane+Math.sign(direction)))}:g;}
  function score(g){return Math.floor(g.time/100)*2+g.points;}
  function advance(state,elapsed){
    if(state.phase!=='playing'||!Number.isFinite(elapsed)||elapsed<=0)return state;
    const g={...state,objects:state.objects.map(o=>({...o})),remainder:state.remainder+Math.min(elapsed,DURATION)};
    const announce=(message)=>{g.event=message;g.eventUntil=g.time+1000;};
    while(g.remainder+1e-7>=TICK&&g.phase==='playing'){
      g.remainder=Math.max(0,g.remainder-TICK);g.time=Math.min(DURATION,g.time+TICK);
      if(g.time>=g.nextWave){g.objects.push(...wave(g));g.wave++;g.nextWave+=1080-320*g.time/DURATION;}
      for(const o of g.objects){
        o.y+=o.speed*TICK/1000;
        if(o.lane===g.lane&&o.y>=78&&o.y<=90){
          o.used=true;
          if(o.kind==='crystal'){g.crystals++;g.combo++;g.bestCombo=Math.max(g.bestCombo,g.combo);const bonus=50*Math.min(g.combo,5);g.points+=bonus;announce('+'+bonus+' · KRYSTAL');}
          else if(o.kind==='shield'){g.shield=true;announce('ŠTÍT AKTIVNÍ');}
          else if(g.time>=g.invulnerableUntil){
            g.invulnerableUntil=g.time+1400;
            if(g.shield){g.shield=false;announce('ŠTÍT ZACHRÁNIL LOĎ');}
            else{g.lives--;g.combo=0;announce('ZÁSAH · −1 ŽIVOT');if(!g.lives){g.phase='lost';break;}}
          }
        }
        if(!o.used&&o.kind==='crystal'&&o.y>90){g.combo=0;o.used=true;}
      }
      g.objects=g.objects.filter(o=>!o.used&&o.y<108);
      if(g.phase==='playing'&&g.time>=DURATION-1e-6){g.time=DURATION;g.phase='won';g.points+=1000+g.lives*250;announce('ÚNIK DOKONČEN');}
    }
    return g;
  }
  return{create,wave,move,score,advance,DURATION};
});
