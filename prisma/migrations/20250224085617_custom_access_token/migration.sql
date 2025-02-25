CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  session_id uuid;
  session_data public."Sessions"%ROWTYPE;
  auth_session_data auth.sessions%ROWTYPE;
BEGIN
  -- Extract original claims and session_id
  claims := event->'claims';
  session_id := (claims->>'session_id')::uuid;
  
  IF session_id IS NULL THEN
    RAISE NOTICE 'No session_id found in JWT claims';
    RETURN event;
  END IF;

  -- Try to get the session from public.Sessions
  SELECT s.*
    INTO session_data
  FROM public."Sessions" s
  WHERE s.id = session_id;

  IF FOUND THEN
    claims := jsonb_set(
      claims,
      '{sessionData}',
      jsonb_build_object(
        'ip', host(session_data.ip),
        'countryCode', COALESCE(session_data."countryCode", ''),
        'userAgent', COALESCE(session_data."userAgent", ''),
        'deviceNonce', COALESCE(session_data."deviceNonce", ''),
        'createdAt', session_data."createdAt"::timestamptz::text,
        'updatedAt', session_data."updatedAt"::timestamptz::text
      )
    );
  ELSE
    -- If not found, try auth.sessions
    SELECT a.*
      INTO auth_session_data
    FROM auth.sessions a
    WHERE a.id = session_id;

    IF FOUND THEN
      claims := jsonb_set(
        claims,
        '{sessionData}',
        jsonb_build_object(
          'ip', host(auth_session_data.ip),
          'userAgent', COALESCE(auth_session_data.user_agent, ''),
          'countryCode', '',
          'deviceNonce', '',
          'createdAt', auth_session_data.created_at::timestamptz::text,
          'updatedAt', auth_session_data.updated_at::timestamptz::text
        )
      );
    ELSE
      -- Neither session found; set default values
      claims := jsonb_set(
        claims,
        '{sessionData}',
        jsonb_build_object(
          'ip', '',
          'userAgent', '',
          'countryCode', '',
          'deviceNonce', '',
          'createdAt', '',
          'updatedAt', ''
        )
      );
    END IF;
  END IF;

  -- Update the claims in the event and return
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant permissions for the function and the required schemas/tables
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT ALL ON TABLE public."Sessions" TO supabase_auth_admin;

-- Grant permissions on the auth schema and sessions table if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
             GRANT ALL ON TABLE auth.sessions TO supabase_auth_admin;';
  END IF;
END $$;
