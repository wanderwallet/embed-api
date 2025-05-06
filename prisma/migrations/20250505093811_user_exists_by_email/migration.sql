-- Drop function if it exists
DROP FUNCTION IF EXISTS public.user_exists_by_email;

-- Create the function
CREATE OR REPLACE FUNCTION public.user_exists_by_email(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    SELECT EXISTS (
      SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)
      UNION
      SELECT 1 FROM auth.identities
      WHERE identity_data ->> 'email' = lower(p_email)
    ) INTO user_exists;
  END IF;
  
  RETURN user_exists;
END;
$$;

-- Grant minimum required permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION public.user_exists_by_email(text) TO anon;