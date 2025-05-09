-- Drop function if it exists
DROP FUNCTION IF EXISTS public.user_exists_by_email(text);

-- Create the function
CREATE OR REPLACE FUNCTION public.user_exists_by_email(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_email   boolean := false;
  has_other   boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    SELECT
      EXISTS (
        SELECT 1
        FROM auth.identities
        WHERE lower(identity_data ->> 'email') = lower(p_email)
          AND provider = 'email'
      ),
      EXISTS (
        SELECT 1
        FROM auth.identities
        WHERE lower(identity_data ->> 'email') = lower(p_email)
          AND provider <> 'email'
      )
    INTO has_email, has_other;

    -- If they have a non-email identity but no email‐password identity, error out
    IF has_other AND NOT has_email THEN
      RAISE EXCEPTION
        'An account with this email already exists, but it is not using a password.';
    END IF;

    -- Return true only if an email‐password identity exists
    RETURN has_email;
  END IF;
END;
$$;

-- Grant minimum required permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION public.user_exists_by_email(text) TO anon;