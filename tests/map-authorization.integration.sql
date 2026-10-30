BEGIN;
DO $test$ DECLARE a jsonb;b jsonb; n text:=replace(gen_random_uuid()::text,'-',''); BEGIN
 a:=public.secure_register('qa_'||substr(n,1,14),'Audit-fixture-only-93', '{}'::jsonb)->0;
 b:=public.secure_register('qa_'||substr(n,15,14),'Audit-fixture-only-94','{}'::jsonb)->0;
 PERFORM set_config('audit.a',a::text,true);PERFORM set_config('audit.b',b::text,true);
END $test$;
SET LOCAL ROLE anon;
DO $test$ DECLARE a jsonb:=current_setting('audit.a')::jsonb;b jsonb:=current_setting('audit.b')::jsonb;n integer;blocked boolean:=false; BEGIN
 BEGIN INSERT INTO public.map_stats(user_name) VALUES(a->>'name');EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Anonymous insert unexpectedly allowed';END IF;
 PERFORM set_config('request.headers',jsonb_build_object('x-indy-session',a->>'session_token')::text,true);
 INSERT INTO public.map_stats(user_name,rounds) VALUES(a->>'name',1) ON CONFLICT(user_name) DO UPDATE SET rounds=excluded.rounds;
 UPDATE public.map_stats SET rounds=2 WHERE user_name=a->>'name';
 GET DIAGNOSTICS n=ROW_COUNT;IF n<>1 THEN RAISE EXCEPTION 'Own update failed';END IF;
 blocked:=false;
 BEGIN INSERT INTO public.map_stats(user_name) VALUES(b->>'name');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Foreign insert allowed';END IF;
 blocked:=false;
 BEGIN UPDATE public.map_stats SET user_name=b->>'name' WHERE user_name=a->>'name';EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Ownership reassignment allowed';END IF;
 IF has_table_privilege('anon','public.map_stats','TRUNCATE') OR has_table_privilege('authenticated','public.users','TRUNCATE') THEN RAISE EXCEPTION 'Bulk privileges remain';END IF;
END $test$;
SELECT 'PASS: anonymous/cross-owner inserts blocked; own upsert/update allowed; ownership reassignment blocked; bulk grants removed' AS result;
ROLLBACK;