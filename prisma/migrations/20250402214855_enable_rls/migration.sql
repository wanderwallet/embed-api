-- Enable Row Level Security on all tables
ALTER TABLE "UserProfiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WalletActivations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WalletRecoveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WalletExports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkKeyShares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecoveryKeyShares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnonChallenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DevicesAndLocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationSessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginAttempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Memberships" ENABLE ROW LEVEL SECURITY;

-- Force RLS even for superusers
ALTER TABLE "UserProfiles" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Bills" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Applications" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Wallets" FORCE ROW LEVEL SECURITY;
ALTER TABLE "WalletActivations" FORCE ROW LEVEL SECURITY;
ALTER TABLE "WalletRecoveries" FORCE ROW LEVEL SECURITY;
ALTER TABLE "WalletExports" FORCE ROW LEVEL SECURITY;
ALTER TABLE "WorkKeyShares" FORCE ROW LEVEL SECURITY;
ALTER TABLE "RecoveryKeyShares" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Challenges" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AnonChallenges" FORCE ROW LEVEL SECURITY;
ALTER TABLE "DevicesAndLocations" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Sessions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationSessions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "LoginAttempts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Organizations" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Teams" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Memberships" FORCE ROW LEVEL SECURITY;

-- Make sure DB user exists and has proper schema permissions
DO $$
DECLARE
  db_user TEXT;
  db_password TEXT;
BEGIN
  -- Get the DB user from environment variables or use 'prisma' as default
  SELECT current_setting('app.settings.postgres_user', true) INTO db_user;
  SELECT current_setting('app.settings.postgres_password', true) INTO db_password;
  
  -- Default values if not set
  db_user := COALESCE(db_user, 'prisma');
  db_password := COALESCE(db_password, 'password');
  
  -- Create the user if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = db_user
  ) THEN
    EXECUTE format('CREATE USER %I WITH PASSWORD %L CREATEDB', db_user, db_password);
  END IF;
  
  -- Create the 'authenticated' role if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  
  -- Grant the authenticated role to the database user
  EXECUTE format('GRANT authenticated TO %I', db_user);
  
  -- Grant privileges to the database user
  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', db_user);
  EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %I', db_user);
  EXECUTE format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %I', db_user);
  EXECUTE format('GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO %I', db_user);
  EXECUTE format('GRANT CREATE ON SCHEMA public TO %I', db_user);
  EXECUTE format('GRANT %I TO postgres', db_user);
  
  -- Set schema ownership
  ALTER SCHEMA public OWNER TO postgres;
  
  -- Default privileges
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO %I', db_user);
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO %I', db_user);
  EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO %I', db_user);
END
$$;

-- Policy for service roles to access all tables
-- This creates a policy that allows users with the 'postgres' role to access all data
DROP POLICY IF EXISTS "Service role access all UserProfiles" ON "UserProfiles";
DROP POLICY IF EXISTS "Service role access all Bills" ON "Bills";
DROP POLICY IF EXISTS "Service role access all Applications" ON "Applications";
DROP POLICY IF EXISTS "Service role access all Wallets" ON "Wallets";
DROP POLICY IF EXISTS "Service role access all WalletActivations" ON "WalletActivations";
DROP POLICY IF EXISTS "Service role access all WalletRecoveries" ON "WalletRecoveries";
DROP POLICY IF EXISTS "Service role access all WalletExports" ON "WalletExports";
DROP POLICY IF EXISTS "Service role access all WorkKeyShares" ON "WorkKeyShares";
DROP POLICY IF EXISTS "Service role access all RecoveryKeyShares" ON "RecoveryKeyShares";
DROP POLICY IF EXISTS "Service role access all Challenges" ON "Challenges";
DROP POLICY IF EXISTS "Service role access all AnonChallenges" ON "AnonChallenges";
DROP POLICY IF EXISTS "Service role access all DevicesAndLocations" ON "DevicesAndLocations";
DROP POLICY IF EXISTS "Service role access all Sessions" ON "Sessions";
DROP POLICY IF EXISTS "Service role access all ApplicationSessions" ON "ApplicationSessions";
DROP POLICY IF EXISTS "Service role access all LoginAttempts" ON "LoginAttempts";
DROP POLICY IF EXISTS "Service role access all Organizations" ON "Organizations";
DROP POLICY IF EXISTS "Service role access all Teams" ON "Teams";
DROP POLICY IF EXISTS "Service role access all Memberships" ON "Memberships";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    EXECUTE $auth_policies$
    -- User-specific policies
    -- UserProfiles
    DROP POLICY IF EXISTS "Users can view/update/delete their profile" ON "UserProfiles";
    DROP POLICY IF EXISTS "Users can update their profile" ON "UserProfiles";
    DROP POLICY IF EXISTS "Users can delete their profile" ON "UserProfiles";
    DROP POLICY IF EXISTS "Users can create profiles" ON "UserProfiles";
    
    -- Create policy for reads, updates, deletes
    CREATE POLICY "Users can view/update/delete their profile" ON "UserProfiles"
      FOR SELECT USING ("supId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    CREATE POLICY "Users can update their profile" ON "UserProfiles"
      FOR UPDATE USING ("supId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres')
      WITH CHECK ("supId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
      
    CREATE POLICY "Users can delete their profile" ON "UserProfiles"
      FOR DELETE USING ("supId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    -- Less restrictive insert policy - only enforces that they're creating profiles for themselves
    CREATE POLICY "Users can create profiles" ON "UserProfiles"
      FOR INSERT WITH CHECK ("supId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');

    -- Wallets
    DROP POLICY IF EXISTS "Users can view their wallets" ON "Wallets";
    DROP POLICY IF EXISTS "Users can update their wallets" ON "Wallets";
    DROP POLICY IF EXISTS "Users can delete their wallets" ON "Wallets";
    DROP POLICY IF EXISTS "Users can insert wallets" ON "Wallets";
    
    -- Policies for SELECT, UPDATE, DELETE
    CREATE POLICY "Users can view their wallets" ON "Wallets"
      FOR SELECT USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
      
    CREATE POLICY "Users can update their wallets" ON "Wallets"
      FOR UPDATE USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres')
      WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
      
    CREATE POLICY "Users can delete their wallets" ON "Wallets"
      FOR DELETE USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    -- Less restrictive insert policy - only enforces that they're creating wallets for themselves  
    CREATE POLICY "Users can insert wallets" ON "Wallets"
      FOR INSERT WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');

    -- DevicesAndLocations
    DROP POLICY IF EXISTS "Users can view/update/delete devices" ON "DevicesAndLocations";
    DROP POLICY IF EXISTS "Users can insert devices" ON "DevicesAndLocations";
    
    -- Policy for SELECT, UPDATE, DELETE
    CREATE POLICY "Users can view/update/delete devices" ON "DevicesAndLocations"
      FOR ALL 
      USING (
        "userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR
        "userId" IS NULL OR
        current_user = 'postgres'
      )
      WITH CHECK (
        "userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR
        "userId" IS NULL OR
        current_user = 'postgres'
      );
    
    -- Less restrictive insert policy - allows creating devices, even anonymous ones  
    CREATE POLICY "Users can insert devices" ON "DevicesAndLocations"
      FOR INSERT WITH CHECK (
        "userId" IS NULL OR 
        "userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR
        current_user = 'postgres'
      );

    -- Sessions
    DROP POLICY IF EXISTS "Users can insert sessions" ON "Sessions";
    DROP POLICY IF EXISTS "Users can view their sessions" ON "Sessions";
    DROP POLICY IF EXISTS "Users can update their sessions" ON "Sessions";
    DROP POLICY IF EXISTS "Users can delete their sessions" ON "Sessions";
    
    -- Create an open policy for all operations on Sessions
    CREATE POLICY "Allow all operations on Sessions" ON "Sessions"
      FOR ALL
      USING (true)
      WITH CHECK (true);

    $auth_policies$;
  END IF;
END $$;

-- Grant explicit permissions to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON "UserProfiles" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Wallets" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "DevicesAndLocations" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Sessions" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "WorkKeyShares" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecoveryKeyShares" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "WalletActivations" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "WalletRecoveries" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "WalletExports" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Challenges" TO authenticated;

-- Make sure the authenticated role has the right search path
ALTER ROLE authenticated SET search_path = public;

-- Fix auth trigger functions to use SECURITY DEFINER and add permissive policies for auth operations
-- This ensures Google Auth and other authentication flows work correctly with RLS
DO $$
BEGIN
  -- Update auth trigger functions if they exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_session') THEN
    ALTER FUNCTION public.handle_new_session SECURITY DEFINER;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_update_session') THEN
    ALTER FUNCTION public.handle_update_session SECURITY DEFINER;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_delete_session') THEN
    ALTER FUNCTION public.handle_delete_session SECURITY DEFINER;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upsert_session') THEN
    ALTER FUNCTION public.upsert_session SECURITY DEFINER;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ensure_user_profile') THEN
    ALTER FUNCTION public.ensure_user_profile SECURITY DEFINER;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user SECURITY DEFINER;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_update_user_email_n_phone') THEN
    ALTER FUNCTION public.handle_update_user_email_n_phone SECURITY DEFINER;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_delete_user') THEN
    ALTER FUNCTION public.handle_delete_user SECURITY DEFINER;
  END IF;
END $$;

-- Create permissive auth policies for auth-related tables
DO $$
BEGIN
  -- Sessions table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Sessions') THEN
    -- Clear any existing policies with similar names to avoid conflicts
    DROP POLICY IF EXISTS "Allow all auth operations" ON "Sessions";
    DROP POLICY IF EXISTS "Bypass RLS for auth operations" ON "Sessions";
    
    -- Create permissive policy for auth operations
    CREATE POLICY "Bypass RLS for auth operations" ON "Sessions" USING (true);
  END IF;
  
  -- UserProfiles table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'UserProfiles') THEN
    -- Clear any existing policies with similar names to avoid conflicts
    DROP POLICY IF EXISTS "Allow all auth profile operations" ON "UserProfiles";
    DROP POLICY IF EXISTS "Bypass RLS for auth profile operations" ON "UserProfiles";
    
    -- Create permissive policy for auth operations
    CREATE POLICY "Bypass RLS for auth profile operations" ON "UserProfiles" USING (true);
  END IF;
  
  -- DevicesAndLocations table - often used during auth
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DevicesAndLocations') THEN
    -- Clear any existing policies with similar names to avoid conflicts
    DROP POLICY IF EXISTS "Bypass RLS for auth device operations" ON "DevicesAndLocations";
    
    -- Create permissive policy for auth operations
    CREATE POLICY "Bypass RLS for auth device operations" ON "DevicesAndLocations" USING (true);
  END IF;
  
  -- Wallets table - needed for wallet recovery operations too
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Wallets') THEN
    -- Clear any existing policies with similar names to avoid conflicts
    DROP POLICY IF EXISTS "Bypass RLS for wallet operations" ON "Wallets";
    
    -- Create permissive policy for wallet operations
    CREATE POLICY "Bypass RLS for wallet operations" ON "Wallets" USING (true);
  END IF;
END $$;

-- Debug Wallets policy to log access attempts - moved outside DO block
DROP FUNCTION IF EXISTS log_wallet_access();
CREATE FUNCTION log_wallet_access() RETURNS TRIGGER AS $log_func$
BEGIN
  RAISE NOTICE 'Wallet access: operation=%, user_id=%, jwt=%', TG_OP, current_setting('request.jwt.claims', true)::json->>'sub', current_setting('request.jwt.claims', true);
  RETURN NULL;
END;
$log_func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_access_log ON "Wallets";
CREATE TRIGGER wallet_access_log
  AFTER INSERT OR UPDATE OR DELETE ON "Wallets"
  FOR EACH STATEMENT EXECUTE FUNCTION log_wallet_access();

-- Don't remove the bypass policy for DevicesAndLocations
DO $$
BEGIN
  -- Remove the extra auth bypass policies we added earlier
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Sessions') THEN
    DROP POLICY IF EXISTS "Bypass RLS for auth operations" ON "Sessions";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'UserProfiles') THEN
    DROP POLICY IF EXISTS "Bypass RLS for auth profile operations" ON "UserProfiles";
  END IF;
  
  -- Keep DevicesAndLocations bypass policy to allow device creation
  -- IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'DevicesAndLocations') THEN
  --   DROP POLICY IF EXISTS "Bypass RLS for auth device operations" ON "DevicesAndLocations";
  -- END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Wallets') THEN
    DROP POLICY IF EXISTS "Bypass RLS for wallet operations" ON "Wallets";
  END IF;
END $$;

-- Add back the remaining policies with JWT claims
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    EXECUTE $more_policies$
    -- WorkKeyShares
    DROP POLICY IF EXISTS "Users can manage work key shares" ON "WorkKeyShares";
    
    -- Policies for SELECT, UPDATE, DELETE
    CREATE POLICY "Users can view/update/delete work key shares" ON "WorkKeyShares"
      FOR ALL USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres')
      WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    -- Less restrictive insert policy
    CREATE POLICY "Users can insert work key shares" ON "WorkKeyShares"
      FOR INSERT WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
      
    -- RecoveryKeyShares  
    DROP POLICY IF EXISTS "Users can manage recovery key shares" ON "RecoveryKeyShares";
    
    -- Policies for SELECT, UPDATE, DELETE
    CREATE POLICY "Users can view/update/delete recovery key shares" ON "RecoveryKeyShares"
      FOR ALL USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres')
      WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    -- Less restrictive insert policy
    CREATE POLICY "Users can insert recovery key shares" ON "RecoveryKeyShares"
      FOR INSERT WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
      
    -- WalletActivations
    DROP POLICY IF EXISTS "Users can manage wallet activations" ON "WalletActivations";
    
    -- Policies for SELECT, UPDATE, DELETE
    CREATE POLICY "Users can view/update/delete wallet activations" ON "WalletActivations"
      FOR ALL USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres')
      WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    -- Less restrictive insert policy
    CREATE POLICY "Users can insert wallet activations" ON "WalletActivations"
      FOR INSERT WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
      
    -- WalletRecoveries
    DROP POLICY IF EXISTS "Users can manage wallet recoveries" ON "WalletRecoveries";
    
    -- Policies for SELECT, UPDATE, DELETE
    CREATE POLICY "Users can view/update/delete wallet recoveries" ON "WalletRecoveries"
      FOR ALL USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres')
      WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    -- Less restrictive insert policy
    CREATE POLICY "Users can insert wallet recoveries" ON "WalletRecoveries"
      FOR INSERT WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
      
    -- WalletExports
    DROP POLICY IF EXISTS "Users can manage wallet exports" ON "WalletExports";
    
    -- Policies for SELECT, UPDATE, DELETE
    CREATE POLICY "Users can view/update/delete wallet exports" ON "WalletExports"
      FOR ALL USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres')
      WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    -- Less restrictive insert policy
    CREATE POLICY "Users can insert wallet exports" ON "WalletExports"
      FOR INSERT WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
      
    -- Challenges
    DROP POLICY IF EXISTS "Users can manage challenges" ON "Challenges";
    
    -- Policies for SELECT, UPDATE, DELETE
    CREATE POLICY "Users can view/update/delete challenges" ON "Challenges"
      FOR ALL USING ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres')
      WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    
    -- Less restrictive insert policy
    CREATE POLICY "Users can insert challenges" ON "Challenges"
      FOR INSERT WITH CHECK ("userId" = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid OR current_user = 'postgres');
    $more_policies$;
  END IF;
END $$;

-- Add a safer way to extract user ID from JWT claims
CREATE OR REPLACE FUNCTION get_auth_user_id() RETURNS uuid AS $$
BEGIN
  -- Try to get the JWT claim, handle any errors gracefully
  BEGIN
    RETURN (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
  EXCEPTION
    WHEN others THEN
      RETURN NULL::uuid;
  END;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Update all RLS policies to use the safer function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    EXECUTE $safer_policies$
    -- UserProfiles policies with safer extraction
    DROP POLICY IF EXISTS "Users can view/update/delete their profile" ON "UserProfiles";
    CREATE POLICY "Users can view/update/delete their profile" ON "UserProfiles"
      FOR SELECT USING ("supId" = get_auth_user_id() OR current_user = 'postgres');
    
    DROP POLICY IF EXISTS "Users can update their profile" ON "UserProfiles";
    CREATE POLICY "Users can update their profile" ON "UserProfiles"
      FOR UPDATE USING ("supId" = get_auth_user_id() OR current_user = 'postgres')
      WITH CHECK ("supId" = get_auth_user_id() OR current_user = 'postgres');
      
    DROP POLICY IF EXISTS "Users can delete their profile" ON "UserProfiles";
    CREATE POLICY "Users can delete their profile" ON "UserProfiles"
      FOR DELETE USING ("supId" = get_auth_user_id() OR current_user = 'postgres');
    
    DROP POLICY IF EXISTS "Users can create profiles" ON "UserProfiles";
    CREATE POLICY "Users can create profiles" ON "UserProfiles"
      FOR INSERT WITH CHECK ("supId" = get_auth_user_id() OR current_user = 'postgres');

    -- Wallets policies with safer extraction
    DROP POLICY IF EXISTS "Users can view their wallets" ON "Wallets";
    CREATE POLICY "Users can view their wallets" ON "Wallets"
      FOR SELECT USING ("userId" = get_auth_user_id() OR current_user = 'postgres');
      
    DROP POLICY IF EXISTS "Users can update their wallets" ON "Wallets";
    CREATE POLICY "Users can update their wallets" ON "Wallets"
      FOR UPDATE USING ("userId" = get_auth_user_id() OR current_user = 'postgres')
      WITH CHECK ("userId" = get_auth_user_id() OR current_user = 'postgres');
      
    DROP POLICY IF EXISTS "Users can delete their wallets" ON "Wallets";
    CREATE POLICY "Users can delete their wallets" ON "Wallets"
      FOR DELETE USING ("userId" = get_auth_user_id() OR current_user = 'postgres');
    
    DROP POLICY IF EXISTS "Users can insert wallets" ON "Wallets";
    CREATE POLICY "Users can insert wallets" ON "Wallets"
      FOR INSERT WITH CHECK ("userId" = get_auth_user_id() OR current_user = 'postgres');

    -- Create permissive RLS policy for the "Wallets" table to allow any authenticated user to access any wallet for recovery operations
    CREATE POLICY "Users can access any wallet for recovery" ON "Wallets" 
      FOR SELECT 
      USING (
        auth.uid() IS NOT NULL
      );

    -- Make sure we have insert policies for all tables
    DROP POLICY IF EXISTS "Users can insert recoveryKeyShares" ON "RecoveryKeyShares";
    CREATE POLICY "Users can insert recoveryKeyShares" ON "RecoveryKeyShares" 
      FOR INSERT 
      WITH CHECK (
        auth.uid() IS NOT NULL
      );
    $safer_policies$;
  END IF;
END $$; 