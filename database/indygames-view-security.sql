-- Applied to project nueprvtkefezraibnlyo on 2026-10-30.
ALTER VIEW public.minigame_leaderboard SET (security_invoker=true);
ALTER FUNCTION public.verify_password(text,text) SET search_path TO public,extensions,pg_temp;
ALTER FUNCTION public.change_password(text,text) SET search_path TO public,extensions,pg_temp;
ALTER FUNCTION public.register_user(text,text,jsonb) SET search_path TO public,extensions,pg_temp;
ALTER FUNCTION public.get_security_question(text) SET search_path TO public,extensions,pg_temp;
ALTER FUNCTION public.reset_password_via_security(text,text,text) SET search_path TO public,extensions,pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_security_question(text) FROM PUBLIC,anon,authenticated;
