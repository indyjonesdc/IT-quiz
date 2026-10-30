/* First-party authentication transport; no third-party hosts receive sessions. */
(()=>{'use strict';
 const HOST='nueprvtkefezraibnlyo.supabase.co',KEY='itq_verified_session_v1';
 const originalFetch=window.fetch.bind(window);
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
 const clear=()=>{try{localStorage.removeItem(KEY)}catch{}};
 const safeColumns='id,name,created_at,company,position,fav_hw,os_religion,coffee_cups,debug_style,superpower,avatar_url,cheater';
 window.fetch=async(input,init)=>{
  const request=new Request(input,init),url=new URL(request.url);
  if(url.hostname!==HOST)return originalFetch(request);
  const headers=new Headers(request.headers),session=read();
  if(session?.token&&session.expires>Date.now())headers.set('x-indy-session',session.token);
  else if(session)clear();
  const routes={verify_password:'secure_login',register_user:'secure_register',google_login:'secure_google_login',change_password:'secure_change_password'};
  const rpc=url.pathname.match(/^\/rest\/v1\/rpc\/([^/]+)$/)?.[1];
  if(routes[rpc])url.pathname='/rest/v1/rpc/'+routes[rpc];
  // A public profile must never request the credential columns via select(*).
  if(url.pathname==='/rest/v1/users'&&url.searchParams.get('select')==='*')url.searchParams.set('select',safeColumns);
  const response=await originalFetch(new Request(url, new Request(request,{headers})));
  if(response.ok&&['verify_password','register_user','google_login'].includes(rpc)){
   const data=await response.clone().json();const user=Array.isArray(data)?data[0]:data;
   if(user?.session_token&&user.id){
    try{localStorage.setItem(KEY,JSON.stringify({token:user.session_token,userId:user.id,expires:Date.now()+14*864e5}));}catch{}
    // Keep the bearer token out of React profile state and public profile exports.
    delete user.session_token;
    const h=new Headers(response.headers);h.delete('content-length');
    return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:h});
   }
  }
  return response;
 };
 window.addEventListener('storage',e=>{if(e.key==='itq_user'&&(!e.newValue||e.newValue==='null'))clear()});
 // Existing local profiles are display data, not authentication evidence.
 try{
  const user=JSON.parse(localStorage.getItem('itq_user')||'null'),session=read();
  if(user&&!user.guest&&(!session||session.userId!==user.id||session.expires<=Date.now())){
   localStorage.removeItem('itq_user');clear();
   if(!['/','/index.html'].includes(location.pathname))location.replace('/index.html');
  }
 }catch{clear()}
 window.indyVerifiedLogout=async()=>{
  try{const s=read();if(s)await originalFetch('https://'+HOST+'/rest/v1/rpc/secure_logout',{method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_kEir70MApmMucBkp5BHpzg_jhDettKH','x-indy-session':s.token},body:'{}'});}finally{clear();localStorage.removeItem('itq_user');}
 };
 document.addEventListener('click',event=>{const button=event.target.closest?.('button');if(button&&/odhlásit/i.test(button.textContent))void window.indyVerifiedLogout().catch(()=>{});},true);
})();
