const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../assets/meteor-core');
const playing=extra=>({...M.create(42),phase:'playing',nextWave:100000,...extra});
const object=(kind,lane=1,y=77)=>({id:kind,kind,lane,y,speed:40});

test('Meteor waves always leave a safe lane and become harder gradually',()=>{
  for(let seed=1;seed<=200;seed++)for(const time of [0,15000,30000,59000]){
    const g={...M.create(seed),wave:18,time},wave=M.wave(g),rocks=wave.filter(o=>o.kind==='rock'),pickup=wave.find(o=>o.kind!=='rock');
    assert(rocks.length>=1&&rocks.length<=2);assert(!rocks.some(o=>o.lane===pickup.lane));
    assert.equal(new Set(wave.map(o=>o.lane)).size,wave.length);
    assert(wave.every(o=>o.speed>=28&&o.speed<49&&o.lane>=0&&o.lane<=2));
    assert.equal(pickup.kind,'shield');
  }
});
test('Meteor collisions cannot tunnel at slow frames; shield and invulnerability prevent extra damage',()=>{
  const initial=playing({objects:[object('rock')]});
  const hit=M.advance(initial,200);assert.equal(hit.lives,2);assert.equal(initial.lives,3);
  assert.equal(M.advance(playing({shield:true,objects:[object('rock')]}),200).lives,3);
  assert.equal(M.advance(playing({shield:true,objects:[object('rock')]}),200).shield,false);
  assert.equal(M.advance({...hit,objects:[object('rock')]},200).lives,2);
  const exposed={...hit,time:2000,objects:[object('rock')]};assert.equal(M.advance(exposed,200).lives,1);
  assert.equal(M.advance(playing({lane:0,objects:[object('rock')]}),200).lives,3);
});
test('Crystal chains, missed crystals and shield pickups use the correct bonuses',()=>{
  let g=playing();for(let i=1;i<=6;i++){g=M.advance({...g,objects:[object('crystal')]},100);assert.equal(g.crystals,i);}
  assert.equal(g.points,1000);assert.equal(g.bestCombo,6);
  g=M.advance({...g,objects:[object('crystal',0,91)]},100);assert.equal(g.combo,0);
  g=M.advance({...g,objects:[object('shield')]},100);assert.equal(g.shield,true);
  g=M.advance({...g,objects:[object('rock')]},100);assert.equal(g.shield,false);assert.equal(g.lives,3);
});
test('Flight scores are frame-rate independent, pause is inert and controls stay within lanes',()=>{
  let slow=playing(),fast=playing();for(let i=0;i<300;i++)slow=M.advance(slow,1000/30);for(let i=0;i<1200;i++)fast=M.advance(fast,1000/120);
  assert.equal(slow.time,fast.time);assert.equal(M.score(slow),M.score(fast));
  let g=playing();for(let i=0;i<20;i++)g=M.move(g,-1);assert.equal(g.lane,0);for(let i=0;i<20;i++)g=M.move(g,1);assert.equal(g.lane,2);
  const paused={...g,phase:'paused'};assert.equal(M.advance(paused,60000),paused);assert.equal(M.move(paused,-1),paused);
});
test('The final life ends the run once; surviving 60 seconds awards the finish bonus once',()=>{
  const lost=M.advance(playing({lives:1,objects:[object('rock')]}),1000);assert.equal(lost.phase,'lost');assert.equal(lost.lives,0);assert(lost.time<1000);assert.equal(M.advance(lost,60000),lost);
  const won=M.advance(playing(),60000);assert.equal(won.phase,'won');assert.equal(won.time,60000);assert.equal(M.score(won),2950);assert.equal(M.advance(won,60000),won);
});
