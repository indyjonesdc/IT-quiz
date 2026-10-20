const {test}=require('node:test'),assert=require('node:assert/strict');
const {codeFeedback:f}=require('../assets/game-core');
test('Code feedback distinguishes position from color',()=>{
 assert.deepEqual(f([0,1,2,3],[0,1,2,3]),{exact:4,misplaced:0});
 assert.deepEqual(f([0,1,2,3],[3,2,1,0]),{exact:0,misplaced:4});
 assert.deepEqual(f([0,1,2,3],[0,2,4,5]),{exact:1,misplaced:1});
 assert.deepEqual(f([0,0,1,1],[0,1,2,2]),{exact:1,misplaced:1});
 assert.throws(()=>f([0,1,2,3],[0,1,2,6]));
 assert.throws(()=>f([0,1,2],[0,1,2,3]));
});
test('Every distinct four-color code recognizes itself and reversed positions',()=>{
 let count=0;for(let a=0;a<6;a++)for(let b=0;b<6;b++)for(let c=0;c<6;c++)for(let d=0;d<6;d++){
 const code=[a,b,c,d];if(new Set(code).size!==4)continue;count++;
 assert.deepEqual(f(code,code),{exact:4,misplaced:0});
 assert.deepEqual(f(code,[d,c,b,a]),{exact:0,misplaced:4});
 }assert.equal(count,360);
});
