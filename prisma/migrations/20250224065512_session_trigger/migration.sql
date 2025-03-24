-- The Shadow database (used for migrations) does not have the `auth` schema Supabase uses, so
-- trying to create the triggers below will throw the following error: "ERROR: schema "auth" does
-- not exist".
-- We could try to create the `auth`schema, but then we also need to start mocking tables and
-- potentially functions (once we get into RLS functionality). So, for now at least, it seems more
-- practical to add the triggers conditionally.

-- These triggers automatically create and update a Session when a new session is created via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.

-- inserts a row into public.Sessions

CREATE OR REPLACE FUNCTION public.handle_new_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    country_code VARCHAR(2);
BEGIN
    SELECT "countryCode" INTO country_code from "IpGeolocation" where ip = NEW.ip;

    INSERT INTO "Sessions" (id, "createdAt", "updatedAt", ip, "userAgent", "userId", "deviceNonce", "countryCode")
    SELECT NEW.id, NEW.created_at, NEW.updated_at, NEW.ip, NEW.user_agent, NEW.user_id, gen_random_uuid(), COALESCE(country_code, '');

    -- If country code wasn't in cache, fetch it asynchronously
    IF country_code IS NULL THEN
        BEGIN
            PERFORM net.http_get('https://freeipapi.com/api/json/' || host(NEW.ip));
        EXCEPTION
            WHEN OTHERS THEN
                -- Silently ignore any errors during the HTTP request
                NULL;
        END;
    END IF;
    

    RETURN NULL;
END;
$$;

-- updates a public.Sessions' ip, userAgent, and updatedAt

CREATE OR REPLACE FUNCTION public.handle_update_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE "Sessions"
    SET ip = NEW.ip,
        "userAgent" = NEW.user_agent,
        "updatedAt" = NEW.updated_at
    WHERE id = NEW.id;
    RETURN NULL;
END;
$$;

-- Create function to delete from public.Sessions when auth.sessions row is deleted

CREATE OR REPLACE FUNCTION public.handle_delete_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM "Sessions" WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

-- Single procedure for trigger management
CREATE OR REPLACE PROCEDURE public.manage_auth_triggers()
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        -- Create triggers in a single transaction
        EXECUTE 'DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;
                DROP TRIGGER IF EXISTS on_auth_session_updated ON auth.sessions;
                DROP TRIGGER IF EXISTS on_auth_session_deleted ON auth.sessions;

                CREATE TRIGGER on_auth_session_created
                    AFTER INSERT ON auth.sessions
                    FOR EACH ROW
                    EXECUTE FUNCTION public.handle_new_session();

                CREATE TRIGGER on_auth_session_updated
                    AFTER UPDATE OF ip, user_agent, updated_at ON auth.sessions
                    FOR EACH ROW
                    EXECUTE FUNCTION public.handle_update_session();

                CREATE TRIGGER on_auth_session_deleted
                    AFTER DELETE ON auth.sessions
                    FOR EACH ROW
                    EXECUTE FUNCTION public.handle_delete_session();';
    END IF;
END;
$$;

CALL public.manage_auth_triggers();
DROP PROCEDURE public.manage_auth_triggers();
