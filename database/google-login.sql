-- Google identity mapping is private; never link accounts by a client-supplied email.
create schema if not exists indy_private;
revoke all on schema indy_private from public, anon;
grant usage on schema indy_private to authenticated;
create table if not exists indy_private.google_accounts (
 auth_id uuid primary key references auth.users(id) on delete cascade,
 player_id text not null unique references public.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table indy_private.google_accounts enable row level security;
revoke all on indy_private.google_accounts from public,anon,authenticated;
create or replace function indy_private.google_player() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 aid uuid := auth.uid(); pid text; pname text; meta jsonb; result jsonb;
begin
 if aid is null then raise exception 'Přihlášení je vyžadováno' using errcode='42501'; end if;
 if not exists(select 1 from auth.identities i join auth.users u on u.id=i.user_id
   where i.user_id=aid and i.provider='google' and u.email_confirmed_at is not null)
 then raise exception 'Chybí ověřená Google identita' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(aid::text,0));
 select g.player_id into pid from indy_private.google_accounts g where g.auth_id=aid;
 if pid is null then
   select i.identity_data into meta from auth.identities i where i.user_id=aid and i.provider='google' limit 1;
   pname:=left(coalesce(nullif(trim(meta->>'full_name'),''),nullif(trim(meta->>'name'),''),'Hráč'),20);
   if exists(select 1 from public.users u where lower(u.name)=lower(pname)) then
     pname:=left(pname,11)||'_'||left(replace(aid::text,'-',''),8);
   end if;
   pid:='google_'||gen_random_uuid()::text;
   begin
     insert into public.users(id,name,password,avatar_url) values(pid,pname,null,
       case when coalesce(meta->>'avatar_url',meta->>'picture','') like 'https://%' then coalesce(meta->>'avatar_url',meta->>'picture') else null end);
   exception when unique_violation then
     pname:='Hráč_'||left(replace(gen_random_uuid()::text,'-',''),15);
     insert into public.users(id,name,password) values(pid,pname,null);
   end;
   insert into indy_private.google_accounts(auth_id,player_id) values(aid,pid);
 end if;
 select jsonb_build_object('id',u.id,'name',u.name,'company',u.company,'position',u.position,
 'fav_hw',u.fav_hw,'os_religion',u.os_religion,'coffee_cups',u.coffee_cups,
 'debug_style',u.debug_style,'superpower',u.superpower,'avatar_url',u.avatar_url)
 into result from public.users u where u.id=pid;
 return result;
end;
$$;
revoke all on function indy_private.google_player() from public,anon;
grant execute on function indy_private.google_player() to authenticated;
create or replace function public.google_login() returns jsonb
language sql security invoker set search_path='' as $$ select indy_private.google_player() $$;
revoke all on function public.google_login() from public,anon;
grant execute on function public.google_login() to authenticated;
notify pgrst,'reload schema';
