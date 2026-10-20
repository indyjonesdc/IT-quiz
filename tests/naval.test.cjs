const{test}=require('node:test'),assert=require('node:assert/strict'),N=require('../assets/naval-core');
const players=(n=5)=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Player '+i,team:i%2}));
function setup(n=5,options={},mode='ffa'){const g=N.create(players(n),mode,{mapSize:24,items:false,...options},1000);for(const f of g.fleets)assert(N.autoPlace(g,f.captain));for(const p of g.players)assert(N.ready(g,p.id,[]));assert(N.begin(g,1000));return g;}
const actor=g=>g.fleets.find(f=>f.id===g.active),enemy=g=>g.fleets.find(f=>f.team!==actor(g).team&&!f.out);
const shot=(g,extra={})=>({turn:g.turn,at:enemy(g).ships[0][0],weapon:'cannon',...extra});
const free=g=>Array.from({length:g.size*g.size},(_,i)=>i).filter(i=>!g.fleets.some(f=>f.ships?.flat().includes(i)||Object.hasOwn(f.traps,i)));
test('map geometry, recommendations, AA–AD coordinates',()=>{
 assert.deepEqual([2,3,4,5,6,7,8].map(N.recommendedSize),[12,18,18,24,24,30,30]);
 assert.equal(N.create(players(),'ffa',{mapSize:'auto'}).size,24);assert.equal(N.create(players(8),'ffa',{mapSize:12}).size,12);assert.throws(()=>N.create(players(),'ffa',{mapSize:31}));
 for(const size of N.SIZES){const r=N.forSize(size);assert(r.validFleet(r.randomFleet()));assert.equal(r.line(size-1,2,false).length,0);assert.equal(r.area(size*size-1,'bomb').length,1);for(let at=0;at<size*size;at++)for(const w of ['radar','bomb','torpedo'])for(const vertical of [true,false])assert(r.area(at,w,vertical).every(i=>i>=0&&i<size*size));}
 assert.equal(N.forSize(30).coord(899),'AD30');assert.equal(N.forSize(30).coord(26),'AA1');
});
test('overlap between fleets is accepted, internal overlap rejected, automatic preparation still finishes',()=>{
 const g=N.create(players(),'ffa',{mapSize:18},1000),r=N.forSize(18),ships=r.randomFleet();assert(N.place(g,'p0',ships));assert(N.place(g,'p1',ships));assert.deepEqual(g.fleets[0].ships,g.fleets[1].ships);
 const bad=ships.map(s=>s.slice());bad[1]=bad[0].slice(0,4);assert(!N.place(g,'p2',bad));
 const v=N.view(g,'p2');assert.equal(v.fleets[0].ships,null);assert(!('items'in v.ocean));N.tick(g,g.deadline);assert.equal(g.phase,'battle');
 for(let n=2;n<=8;n++){const t=N.create(players(n),'ffa',{mapSize:12},0);N.tick(t,120000);assert.equal(t.phase,'battle');assert(t.fleets.every(f=>N.forSize(12).validFleet(f.ships)));}
});
test('five players shoot into one ocean; everyone sees identical shot history; stale and duplicate attacks rejected',()=>{
 const g=setup(),id=g.actor,t=enemy(g),at=t.ships[0][0],a=shot(g);assert(!N.act(g,'unknown',a,1001));assert(!N.act(g,id,{...a,at:g.size*g.size},1001));assert(N.act(g,id,a,1001));assert.equal(g.ocean.shots[at],'hit');assert.equal(t.shots[at],'hit');assert.equal(g.fleets.filter(f=>f.shots[at]).length,g.fleets.filter(f=>f.ships.flat().includes(at)).length);assert(!N.act(g,id,a,1001));
 for(const p of g.players){const v=N.view(g,p.id);assert.equal(v.ocean.shots[at],'hit');assert.deepEqual(v.ocean.shots,g.ocean.shots);assert(!('items'in v.ocean));}
 assert(!N.act(g,g.actor,{turn:g.turn,at,weapon:'cannon'},1002));assert(!N.act(g,g.actor,shot(g),g.deadline));
});
test('area attack damages several enemies including friendly ships',()=>{
 const g=setup(4,{},'teams'),f=actor(g),foes=g.fleets.filter(t=>t.team!==f.team),ally=g.fleets.find(t=>t.team===f.team&&t!==f);
 // A compact explicit battle fixture puts three fleets in the same blast.
 for(const [i,t]of g.fleets.entries())t.ships=N.SHIPS.map((len,row)=>Array.from({length:len},(_,x)=>(5+row*2)*24+i*5+x));
 foes[0].ships[0][0]=0;foes[1].ships[0][0]=1;ally.ships[0][0]=24;f.ships[0][0]=25;
 assert(N.act(g,g.actor,{turn:g.turn,at:0,weapon:'bomb'},1001));assert.equal(foes[0].shots[0],'hit');assert.equal(foes[1].shots[1],'hit');assert.equal(ally.shots[24],'hit');assert.equal(f.shots[25],'hit');assert.equal(g.ocean.shots[24],'hit');assert.equal(g.ocean.shots[25],'hit');assert.equal(g.lastAction.impacts.length,4);assert.equal(f.ammo.bomb,1);
 const own=actor(g).ships[1][0],turn=g.turn;assert(N.act(g,g.actor,{turn,at:own,weapon:'cannon'},1002));assert.equal(g.turn,turn+1);
});
test('radar counts every enemy in shared area and keeps results private',()=>{
 const g=setup(),f=actor(g),at=enemy(g).ships[0][0],cells=N.forSize(g.size).area(at,'radar'),count=g.fleets.filter(t=>t.team!==f.team&&!t.out).flatMap(N.intact).filter(i=>cells.includes(i)).length;
 assert(N.act(g,g.actor,{turn:g.turn,at,weapon:'radar'},1001));assert.equal(f.scans[0].count,count);assert.equal(f.ammo.radar,2);assert.equal(Object.keys(g.ocean.shots).length,0);const v=N.view(g,g.actor);assert.equal(v.fleets.find(t=>t.id===f.id).scans.length,0);
});
test('own traps cannot overlap own ships; traps across fleets may overlap; hidden items placed once',()=>{
 const g=N.create(players(4),'shared',{mapSize:12},1000);for(const f of g.fleets)N.autoPlace(g,f.captain);const empty=free(g);
 assert(!N.ready(g,'p0',[{at:g.fleets[0].ships[0][0],kind:'mine'}]));assert(N.ready(g,'p0',[{at:empty[0],kind:'mine'}]));assert(N.ready(g,'p1',[{at:empty[0],kind:'mine'}]));assert(N.ready(g,'p2',[]));assert(N.ready(g,'p3',[]));assert(N.begin(g,1000));assert.equal(Object.keys(g.ocean.items).length,13);assert.equal(g.ocean.items[empty[0]].length,2);assert(Object.keys(g.ocean.items).every(i=>!g.fleets.some(f=>f.ships.flat().includes(Number(i)))));
 const v=N.view(g,'p0');assert.equal(Object.keys(v.fleets[1].traps).length,0);assert(!('items'in v.ocean));
});
test('global items activate once; mines update shared damage, resupply, jam and skip',()=>{
 for(const kind of Object.keys(N.ITEMS)){const g=setup(2),f=actor(g),at=free(g)[0];g.ocean.items[at]=[kind];const initial=N.intact(f).length;assert(N.act(g,g.actor,{turn:g.turn,at,weapon:'cannon'},1001,()=>0));assert.deepEqual(g.ocean.found[at],[kind]);assert(!N.act(g,g.actor,{turn:g.turn,at,weapon:'cannon'},1002));
 if(kind==='mine'){assert.equal(N.intact(f).length,initial-1);assert(N.view(g,g.actor).ocean.hits[f.ships[0][0]].some(t=>t.fleet===f.id));assert.equal(g.ocean.shots[f.ships[0][0]],undefined);}if(kind==='storm')assert.equal(f.jam,2);if(kind==='whirlpool')assert.equal(f.skip,1);if(kind==='ammo')assert.equal(f.ammo.bomb,3);if(kind==='sonar')assert.equal(f.ammo.radar,4);if(kind==='torpedo')assert.equal(f.ammo.torpedo,3);
 }
});
test('sinking, final disclosure, timeouts and captain succession',()=>{
 const g=setup(2),f=actor(g),t=enemy(g);for(const i of t.ships.flat().slice(1)){t.shots[i]='hit';g.ocean.shots[i]='hit';}assert(N.act(g,g.actor,shot(g),1001));assert.equal(g.phase,'final');assert.equal(g.winner,f.team);assert(N.view(g,g.actor).fleets.every(f=>f.ships));
 const timed=setup(2);for(let i=0;i<6&&timed.phase==='battle';i++)N.tick(timed,timed.deadline);assert.equal(timed.phase,'final');
 const shared=N.create(players(4),'shared',{mapSize:18},1000);N.leave(shared,'p0',1001);assert.equal(shared.fleets[0].captain,'p2');N.tick(shared,shared.deadline);assert.equal(shared.phase,'battle');
});

test('one shot damages all five identical fleets and reports every name; no repeated damage',()=>{
 const g=N.create(players(),'ffa',{mapSize:12,items:false},1000),r=N.forSize(12),ships=r.SHIPS.map((len,row)=>r.line(row*12*2,len,false));
 for(const p of g.players){assert(N.place(g,p.id,ships));assert(N.ready(g,p.id,[]));}N.begin(g,1000);
 assert(N.act(g,g.actor,{turn:g.turn,at:0,weapon:'cannon'},1001));assert.equal(g.lastAction.impacts.length,5);assert.deepEqual(new Set(g.lastAction.impacts.map(t=>t.name)),new Set(players().map(p=>p.name)));
 for(const p of g.players){const v=N.view(g,p.id);assert.equal(v.ocean.hits[0].length,5);assert.equal(v.fleets.find(f=>f.id===p.id).remaining,20);assert.equal(v.ocean.hits[0].every(t=>!t.sunk),true);}
 const turn=g.turn;assert(!N.act(g,g.actor,{turn,at:0,weapon:'cannon'},1002));assert.equal(g.turn,turn);
});
test('partial overlap double hit, stacked trap effects, mine does not hide untouched overlapping ships',()=>{
 const g=setup(3,{mapSize:18}),a=g.fleets[0],b=g.fleets[1],c=g.fleets[2];
 for(const [i,f]of g.fleets.entries())f.ships=N.SHIPS.map((len,row)=>Array.from({length:len},(_,x)=>(row*2+3)*18+i*5+x));
 a.ships[0][0]=0;b.ships[0][0]=0;const id=g.actor;
 assert(N.act(g,id,{turn:g.turn,at:0,weapon:'cannon'},1001));assert.equal(g.lastAction.impacts.length,2);assert.equal(a.shots[0],'hit');assert.equal(b.shots[0],'hit');assert.equal(c.shots[0],undefined);
 // A mine only damages its triggering fleet, preserving an unfired shared cell.
 const active=actor(g),other=g.fleets.find(f=>f!==active),overlap=active.ships[1][0];other.ships[1][0]=overlap;
 for(const i of active.ships.flat())active.shots[i]='hit';delete active.shots[overlap];const empty=free(g)[0];g.ocean.items[empty]=['mine'];
 assert(N.act(g,g.actor,{turn:g.turn,at:empty,weapon:'cannon'},1002));assert.equal(active.shots[overlap],'hit');assert.equal(other.shots[overlap],undefined);assert.equal(g.ocean.shots[overlap],undefined);
 assert(N.act(g,g.actor,{turn:g.turn,at:overlap,weapon:'cannon'},1003));assert.equal(other.shots[overlap],'hit');assert.equal(N.view(g,g.actor).ocean.hits[overlap].length,2);
});

test('team views show allied fleets and preserve enemy secrecy before hits',()=>{const g=setup(4,{},'teams');for(const p of g.players){const v=N.view(g,p.id);assert.equal(v.fleets.filter(f=>f.ships).length,2);for(const f of v.fleets)assert.equal(!!f.ships,f.team===p.team);assert(!('items'in v.ocean));}});
test('a last overlapping hit can sink every fleet simultaneously into a draw',()=>{const g=setup(2);for(const f of g.fleets){f.ships[0][0]=0;for(const at of f.ships.flat())f.shots[at]='hit';delete f.shots[0];}assert(N.act(g,g.actor,{turn:g.turn,at:0,weapon:'cannon'},1001));assert.equal(g.phase,'final');assert.equal(g.winner,null);assert.equal(g.lastAction.impacts.length,2);});
test('overlapping mines activate together once even under another fleet ship',()=>{const g=setup(2),f=actor(g),t=enemy(g),at=t.ships[0][0];g.ocean.items[at]=['mine','mine'];const before=N.intact(f).length,ownHere=f.ships.flat().includes(at)?1:0;assert(N.act(g,g.actor,{turn:g.turn,at,weapon:'cannon'},1001,()=>0));assert.equal(N.intact(f).length,before-2-ownHere);assert.equal(t.shots[at],'hit');assert.deepEqual(g.ocean.found[at],['mine','mine']);assert(!N.act(g,g.actor,{turn:g.turn,at,weapon:'cannon'},1002));});
