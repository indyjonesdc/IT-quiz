-- Applied to project nueprvtkefezraibnlyo on 2026-10-30.
CREATE OR REPLACE FUNCTION indy_private.owns_map_name(p_name text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT count(*)=1 AND coalesce(bool_or(indy_private.has_player_session(u.id)),false) FROM public.users u WHERE u.name=p_name
$$;
REVOKE ALL ON FUNCTION indy_private.owns_map_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION indy_private.owns_map_name(text) TO anon,authenticated;
CREATE POLICY verified_map_insert ON public.map_stats AS RESTRICTIVE FOR INSERT TO anon,authenticated WITH CHECK (indy_private.owns_map_name(user_name));
CREATE POLICY verified_map_update ON public.map_stats AS RESTRICTIVE FOR UPDATE TO anon,authenticated USING (indy_private.owns_map_name(user_name)) WITH CHECK (indy_private.owns_map_name(user_name));
CREATE POLICY verified_map_delete ON public.map_stats AS RESTRICTIVE FOR DELETE TO anon,authenticated USING (indy_private.owns_map_name(user_name));
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.users,public.scores,public.minigame_scores,public.map_stats,public.questions,public.monthly_champions FROM anon,authenticated;
