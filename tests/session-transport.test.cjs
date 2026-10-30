const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const map=new Map(),calls=[];const token='a'.repeat(64);const localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
const window={fetch:async (request,init)=>{request=new Request(request,init);calls.push(request);return new Response(JSON.stringify(request.url.includes('secure_login')?[{id:'fixture-a',name:'Fixture',session_token:token}]:[]),{headers:{'Content-Type':'application/json'}})},addEventListener(){}};
vm.runInNewContext(fs.readFileSync('assets/secure-session.js','utf8'),{window,localStorage,document:{addEventListener(){}},location:{pathname:'/',replace(){}},Request,Response,URL,Headers,Date,JSON});
(async()=>{
 const r=await window.fetch('https://nueprvtkefezraibnlyo.supabase.co/rest/v1/rpc/verify_password',{method:'POST',body:JSON.stringify({p_name:'Fixture',p_password:'fixture'})});
 assert(calls[0].url.endsWith('/secure_login'));assert.equal((await r.json())[0].session_token,undefined);assert.equal(JSON.parse(map.get('itq_verified_session_v1')).token,token);
 await window.fetch('https://nueprvtkefezraibnlyo.supabase.co/rest/v1/users?select=*',{method:'PATCH',body:'{}'});assert.equal(calls[1].headers.get('x-indy-session'),token);assert(!new URL(calls[1].url).searchParams.get('select').includes('password'));
 await window.fetch('https://example.test/');assert.equal(calls[2].headers.get('x-indy-session'),null);
 await window.indyVerifiedLogout();assert.equal(map.has('itq_verified_session_v1'),false);assert(calls[3].url.endsWith('secure_logout'));
 console.log('PASS session transport: login issuance, protected write header, safe profile columns, no cross-host token, logout');
})().catch(e=>{console.error(e);process.exitCode=1});
