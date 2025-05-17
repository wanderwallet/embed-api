-- The Shadow database (used for migrations) does not have the `auth` schema Supabase uses, so
-- trying to create the triggers below will throw the following error: "ERROR: schema "auth" does
-- not exist".
-- We could try to create the `auth`schema, but then we also need to start mocking tables and
-- potentially functions (once we get into RLS functionality). So, for now at least, it seems more
-- practical to add the triggers conditionally.

-- These triggers automatically create and update a UserProfile when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.

-- inserts a row into public.UserProfiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public."UserProfiles" ("supId", "supEmail", "supPhone", "name", "email", "phone", "picture", "updatedAt")
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.phone, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), 
        NEW.email, 
        NEW.phone, 
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'), 
        NOW()
    )
    ON CONFLICT ("supId") DO NOTHING;
    RETURN NEW;
END;
$$;

-- trigger the function above every time an auth.user is created

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        -- Drop existing trigger if it exists to avoid errors when reapplying
        EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;';
        
        -- Create the trigger
        EXECUTE 'CREATE TRIGGER on_auth_user_created
                 AFTER INSERT ON auth.users
                 FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();';
                 
        -- Grant necessary permissions
        EXECUTE 'GRANT USAGE ON SCHEMA auth TO postgres;
                 GRANT USAGE ON SCHEMA auth TO service_role;
                 GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
                 GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;
                 GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO service_role;
                 GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres;';
    END IF;
END $$;

-- updates a public.UserProfiles' email and phone

CREATE OR REPLACE FUNCTION public.handle_update_user_email_n_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public."UserProfiles"
    SET
      "supEmail" = COALESCE(NEW.email, "supEmail"),
      "supPhone" = COALESCE(NEW.phone, "supPhone"),
      "updatedAt" = NOW()
    WHERE "supId" = NEW.id;
    RETURN NEW;
END;
$$;

-- trigger the function above every time an auth.user's email or phone are updated

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        -- Drop existing trigger if it exists
        EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;';
        
        -- Create the trigger
        EXECUTE 'CREATE TRIGGER on_auth_user_updated
                 AFTER UPDATE OF email, phone ON auth.users
                 FOR EACH ROW EXECUTE PROCEDURE public.handle_update_user_email_n_phone();';
    END IF;
END $$;


-- Create a trigger to handle the deletion of a user

CREATE OR REPLACE FUNCTION public.handle_delete_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public."UserProfiles" WHERE "supId" = OLD.id;
    RETURN OLD;
END;
$$;

-- Trigger the function above every time an auth.user is deleted

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        -- Drop existing trigger if it exists
        EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;';
        
        -- Create the trigger
        EXECUTE 'CREATE TRIGGER on_auth_user_deleted
                 AFTER DELETE ON auth.users
                 FOR EACH ROW EXECUTE PROCEDURE public.handle_delete_user();';
    END IF;
END $$;

-- Explicitly grant permissions on UserProfiles table
GRANT ALL PRIVILEGES ON TABLE public."UserProfiles" TO postgres;
GRANT ALL PRIVILEGES ON TABLE public."UserProfiles" TO service_role;
GRANT ALL PRIVILEGES ON TABLE public."UserProfiles" TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON TABLE public."UserProfiles" TO authenticator;

-- Create any missing UserProfiles for existing users (conditionally)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        EXECUTE '
        INSERT INTO public."UserProfiles" ("supId", "supEmail", "name", "email", "updatedAt")
        SELECT 
            id, 
            email, 
            COALESCE(raw_user_meta_data->''full_name'', raw_user_meta_data->''name''), 
            email, 
            NOW()
        FROM auth.users
        WHERE id NOT IN (SELECT "supId" FROM public."UserProfiles")';
    END IF;
END $$;
