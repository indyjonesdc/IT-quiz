/* Pure rules shared by the UI and the regression checks. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.IndyRules=api;})(typeof window==='object'?window:this,function(){
  const day=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  function random(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
  function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
  function shuffle(arr,rng=Math.random){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function neighbors(i,n=8){const x=i%n,y=Math.floor(i/n),a=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&x+dx>=0&&x+dx<n&&y+dy>=0&&y+dy<n)a.push((y+dy)*n+x+dx);return a;}
  function mines(first,n=8,count=10,rng=Math.random){const safe=new Set([first,...neighbors(first,n)]);const locations=shuffle(Array.from({length:n*n},(_,i)=>i).filter(i=>!safe.has(i)),rng).slice(0,count);return Array.from({length:n*n},(_,i)=>locations.includes(i)?-1:neighbors(i,n).filter(j=>locations.includes(j)).length);}
  function revealMine(board,open,flags,i,n=8){const next=new Set(open);if(flags.has(i)||next.has(i))return{open:next,lost:false};if(board[i]===-1)return{open:next,lost:true};const stack=[i];while(stack.length){const x=stack.pop();if(next.has(x)||flags.has(x))continue;next.add(x);if(board[x]===0)neighbors(x,n).filter(j=>board[j]>=0&&!next.has(j)).forEach(j=>stack.push(j));}return{open:next,lost:false};}
  const quizPoints=(correct,ms,streak)=>correct?Math.round(100+900*Math.max(0,Math.min(1,ms/20000)))+(streak>=3?100:0):0;
  function daily(bank,date,mode,count=15){const unique=[...new Map(bank.filter(q=>q.mode===mode&&typeof q.q==='string'&&Array.isArray(q.opts)&&q.opts.length===4&&Number.isInteger(q.a)&&q.a>=0&&q.a<4).map(q=>[q.q.trim().toLowerCase(),q])).values()];const rng=random(hash('indy-daily-v3:'+date+':'+mode));return shuffle(unique,rng).slice(0,count).map(q=>{const order=shuffle([0,1,2,3],rng);return{...q,opts:order.map(i=>q.opts[i]),a:order.indexOf(q.a)};});}
  const colors=[{name:'MODRÁ',hex:'#65aaff'},{name:'RŮŽOVÁ',hex:'#ff78bc'},{name:'ZELENÁ',hex:'#64efb0'},{name:'ŽLUTÁ',hex:'#ffe180'}];
  function duelRound(kind,index,rng=Math.random){if(kind==='color'){const color=Math.floor(rng()*4),word=(color+1+Math.floor(rng()*3))%4;return{kind,index,color,word,answer:String(color),showMs:1500,answerMs:10000};}const code=Array.from({length:3+Math.floor(index/2)},()=>Math.floor(rng()*10)).join('');return{kind,index,code,answer:code,showMs:4500,answerMs:12000};}
  function duelPoints(round,answer,ms){return String(answer)===round.answer?500+Math.round(500*Math.max(0,Math.min(1,ms/round.answerMs))):0;}
  return{day,random,hash,shuffle,neighbors,mines,revealMine,quizPoints,daily,colors,duelRound,duelPoints};
});
