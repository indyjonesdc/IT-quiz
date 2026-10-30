CREATE TABLE IF NOT EXISTS indy_private.login_attempts(name_hash bytea PRIMARY KEY,window_start timestamptz NOT NULL,failures integer NOT NULL);
ALTER TABLE indy_private.login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON indy_private.login_attempts FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.secure_login(p_name text, p_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_profile jsonb;
BEGIN
 IF NOT indy_private.allow_login_attempt(p_name) THEN RAISE EXCEPTION 'Příliš mnoho pokusů. Zkuste přihlášení za 15 minut.' USING ERRCODE='PT429'; END IF;
 IF length(p_name)>100 OR octet_length(p_password)>72 THEN RETURN '[]'::jsonb; END IF;
 SELECT jsonb_build_object('id',u.id,'name',u.name,'company',u.company,'position',u."position",'fav_hw',u.fav_hw,'os_religion',u.os_religion,'coffee_cups',u.coffee_cups,'debug_style',u.debug_style,'superpower',u.superpower,'avatar_url',u.avatar_url)
 INTO v_profile FROM public.users u WHERE lower(u.name)=lower(p_name) AND u.password=extensions.crypt(p_password,u.password) LIMIT 1;
 IF v_profile IS NULL THEN RETURN '[]'::jsonb; END IF;
 RETURN jsonb_build_array(v_profile||jsonb_build_object('session_token',indy_private.issue_player_session(v_profile->>'id')));
END $function$
;
CREATE OR REPLACE FUNCTION public.protect_player_moderation_flag()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$ BEGIN IF current_user IN ('anon','authenticated') AND NEW.cheater IS DISTINCT FROM OLD.cheater THEN RAISE EXCEPTION 'Moderation flags require a trusted administrator' USING ERRCODE='42501'; END IF; RETURN NEW; END $function$
;
CREATE OR REPLACE FUNCTION indy_private.allow_login_attempt(p_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ DECLARE n integer; BEGIN INSERT INTO indy_private.login_attempts(name_hash,window_start,failures) VALUES(extensions.digest(lower(p_name),'sha256'),now(),1) ON CONFLICT(name_hash) DO UPDATE SET failures=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN 1 ELSE login_attempts.failures+1 END,window_start=CASE WHEN login_attempts.window_start<now()-interval '15 minutes' THEN now() ELSE login_attempts.window_start END RETURNING failures INTO n; DELETE FROM indy_private.login_attempts WHERE window_start<now()-interval '1 day'; RETURN n<=20; END $function$
;
REVOKE ALL ON FUNCTION indy_private.allow_login_attempt(text) FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_player_moderation_flag BEFORE UPDATE OF cheater ON public.users FOR EACH ROW EXECUTE FUNCTION public.protect_player_moderation_flag();

