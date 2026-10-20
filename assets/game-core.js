/* Pure rules shared by the UI and the regression checks. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.IndyRules=api;})(typeof window==='object'?window:this,function(){
  const day=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  function random(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
  function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
  function shuffle(arr,rng=Math.random){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function codeFeedback(secret,guess){
    if(secret.length!==4||guess.length!==4||[...secret,...guess].some(n=>!Number.isInteger(n)||n<0||n>5))throw new Error('Invalid combination');
    let exact=0;const left=Array(6).fill(0),right=Array(6).fill(0);
    secret.forEach((n,i)=>{if(n===guess[i])exact++;else{left[n]++;right[guess[i]]++;}});
    return{exact,misplaced:left.reduce((total,n,i)=>total+Math.min(n,right[i]),0)};
  }
  const quizPoints=(correct,ms,streak)=>correct?Math.round(100+900*Math.max(0,Math.min(1,ms/20000)))+(streak>=3?100:0):0;
  function daily(bank,date,mode,count=15){const unique=[...new Map(bank.filter(q=>q.mode===mode&&typeof q.q==='string'&&Array.isArray(q.opts)&&q.opts.length===4&&Number.isInteger(q.a)&&q.a>=0&&q.a<4).map(q=>[q.q.trim().toLowerCase(),q])).values()];const rng=random(hash('indy-daily-v3:'+date+':'+mode));return shuffle(unique,rng).slice(0,count).map(q=>{const order=shuffle([0,1,2,3],rng);return{...q,opts:order.map(i=>q.opts[i]),a:order.indexOf(q.a)};});}
  const colors=[{name:'MODRÁ',hex:'#65aaff'},{name:'RŮŽOVÁ',hex:'#ff78bc'},{name:'ZELENÁ',hex:'#64efb0'},{name:'ŽLUTÁ',hex:'#ffe180'}];
  function duelRound(kind,index,rng=Math.random){if(kind==='color'){const color=Math.floor(rng()*4),word=(color+1+Math.floor(rng()*3))%4;return{kind,index,color,word,answer:String(color),showMs:1500,answerMs:10000};}const code=Array.from({length:3+Math.floor(index/2)},()=>Math.floor(rng()*10)).join('');return{kind,index,code,answer:code,showMs:4500,answerMs:12000};}
  function duelPoints(round,answer,ms){return String(answer)===round.answer?500+Math.round(500*Math.max(0,Math.min(1,ms/round.answerMs))):0;}
  return{day,random,hash,shuffle,codeFeedback,quizPoints,daily,colors,duelRound,duelPoints};
});
