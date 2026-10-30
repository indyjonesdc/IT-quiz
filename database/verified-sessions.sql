-- Preserve legacy accounts while authorizing profile and score writes by a
-- random bearer session issued only after verified password / Google login.
CREATE TABLE IF NOT EXISTS indy_private.player_sessions (
 token_hash bytea PRIMARY KEY,
 user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT (now()+interval '14 days')
);
ALTER TABLE indy_private.player_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON indy_private.player_sessions FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS player_sessions_user_idx ON indy_private.player_sessions(user_id);

CREATE OR REPLACE FUNCTION indy_private.has_player_session(p_user text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS (SELECT 1 FROM indy_private.player_sessions s
 WHERE s.user_id=p_user AND s.expires_at>now()
 AND s.token_hash=extensions.digest(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-indy-session',''),'sha256'))
$$;
REVOKE ALL ON FUNCTION indy_private.has_player_session(text) FROM PUBLIC;
GRANT USAGE ON SCHEMA indy_private TO anon,authenticated;
GRANT EXECUTE ON FUNCTION indy_private.has_player_session(text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION indy_private.issue_player_session(p_user text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_token text:=encode(extensions.gen_random_bytes(32),'hex');
BEGIN
 DELETE FROM indy_private.player_sessions WHERE expires_at<=now();
 INSERT INTO indy_private.player_sessions(token_hash,user_id) VALUES(extensions.digest(v_token,'sha256'),p_user);
 RETURN v_token;
END $$;
REVOKE ALL ON FUNCTION indy_private.issue_player_session(text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.secure_login(p_name text,p_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_profile jsonb;
BEGIN
 IF length(p_name)>100 OR octet_length(p_password)>72 THEN RETURN '[]'::jsonb; END IF;
 SELECT jsonb_build_object('id',u.id,'name',u.name,'company',u.company,'position',u."position",'fav_hw',u.fav_hw,'os_religion',u.os_religion,'coffee_cups',u.coffee_cups,'debug_style',u.debug_style,'superpower',u.superpower,'avatar_url',u.avatar_url)
 INTO v_profile FROM public.users u WHERE lower(u.name)=lower(p_name) AND u.password=extensions.crypt(p_password,u.password) LIMIT 1;
 IF v_profile IS NULL THEN RETURN '[]'::jsonb; END IF;
 RETURN jsonb_build_array(v_profile||jsonb_build_object('session_token',indy_private.issue_player_session(v_profile->>'id')));
END $$;
CREATE OR REPLACE FUNCTION public.secure_register(p_name text,p_password text,p_profile jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_profile jsonb;
BEGIN
 IF length(trim(p_name)) NOT BETWEEN 2 AND 20 OR length(p_password)<8 OR octet_length(p_password)>72 THEN
 RAISE EXCEPTION 'Přezdívka musí mít 2–20 znaků a heslo alespoň 8 znaků (nejvýše 72 bajtů).' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('indy:register',0));
 IF EXISTS(SELECT 1 FROM public.users WHERE lower(name)=lower(trim(p_name))) THEN
 RAISE EXCEPTION 'Tato přezdívka je již obsazená.' USING ERRCODE='23505'; END IF;
 -- UUID avoids the previous epoch-second collision without changing existing IDs.
 INSERT INTO public.users(id,name,password,company,"position",fav_hw,os_religion,coffee_cups,debug_style,superpower)
 VALUES(gen_random_uuid()::text,trim(p_name),extensions.crypt(p_password,extensions.gen_salt('bf',10)),
 p_profile->>'company',p_profile->>'position',p_profile->>'fav_hw',p_profile->>'os_religion',p_profile->>'coffee_cups',p_profile->>'debug_style',p_profile->>'superpower');
 RETURN public.secure_login(trim(p_name),p_password);
END $$;
CREATE OR REPLACE FUNCTION public.secure_google_login()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_profile jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Přihlaste se přes Google.' USING ERRCODE='42501'; END IF;
 v_profile:=public.google_login();
 IF v_profile->>'id' IS NULL THEN RAISE EXCEPTION 'Profil nebyl nalezen.'; END IF;
 RETURN v_profile||jsonb_build_object('session_token',indy_private.issue_player_session(v_profile->>'id'));
END $$;
CREATE OR REPLACE FUNCTION public.secure_change_password(p_user_id text,p_new_password text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT indy_private.has_player_session(p_user_id) THEN RAISE EXCEPTION 'Přihlaste se znovu.' USING ERRCODE='42501'; END IF;
 IF length(p_new_password)<8 OR octet_length(p_new_password)>72 THEN RAISE EXCEPTION 'Heslo musí mít alespoň 8 znaků, nejvýše 72 bajtů.' USING ERRCODE='22023'; END IF;
 UPDATE public.users SET password=extensions.crypt(p_new_password,extensions.gen_salt('bf',10)) WHERE id=p_user_id;
 DELETE FROM indy_private.player_sessions WHERE user_id=p_user_id AND token_hash<>extensions.digest(nullif(current_setting('request.headers',true),'')::jsonb->>'x-indy-session','sha256');
END $$;
CREATE OR REPLACE FUNCTION public.secure_logout()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 DELETE FROM indy_private.player_sessions WHERE token_hash=extensions.digest(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-indy-session',''),'sha256')
$$;
REVOKE ALL ON FUNCTION public.secure_login(text,text),public.secure_register(text,text,jsonb),public.secure_google_login(),public.secure_change_password(text,text),public.secure_logout() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secure_login(text,text),public.secure_register(text,text,jsonb),public.secure_change_password(text,text),public.secure_logout() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.secure_google_login() TO authenticated;
-- Old direct registration remains callable for cached clients, but cannot grant
-- a write session. Block the old answer-based recovery after past exposure.
REVOKE EXECUTE ON FUNCTION public.reset_password_via_security(text,text,text) FROM PUBLIC,anon,authenticated;

CREATE POLICY verified_profile_update ON public.users AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING(indy_private.has_player_session(id)) WITH CHECK(indy_private.has_player_session(id));
CREATE POLICY no_direct_profile_insert ON public.users AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK(false);
CREATE POLICY verified_profile_delete ON public.users AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(indy_private.has_player_session(id));
CREATE POLICY verified_scores_insert ON public.scores AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK(indy_private.has_player_session(user_id));
CREATE POLICY verified_scores_update ON public.scores AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING(indy_private.has_player_session(user_id)) WITH CHECK(indy_private.has_player_session(user_id));
CREATE POLICY verified_scores_delete ON public.scores AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(indy_private.has_player_session(user_id));
CREATE POLICY verified_minigame_insert ON public.minigame_scores AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK(indy_private.has_player_session(user_id));
CREATE POLICY verified_minigame_update ON public.minigame_scores AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING(indy_private.has_player_session(user_id)) WITH CHECK(indy_private.has_player_session(user_id));
CREATE POLICY verified_minigame_delete ON public.minigame_scores AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(indy_private.has_player_session(user_id));
