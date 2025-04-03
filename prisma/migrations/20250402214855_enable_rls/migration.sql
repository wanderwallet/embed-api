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

-- Policy for service roles to access all tables
-- This creates a policy that allows users with the 'service_role' claim to access all data
CREATE POLICY "Service role access all UserProfiles" ON "UserProfiles" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all Bills" ON "Bills" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all Applications" ON "Applications" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all Wallets" ON "Wallets" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all WalletActivations" ON "WalletActivations" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all WalletRecoveries" ON "WalletRecoveries" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all WalletExports" ON "WalletExports" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all WorkKeyShares" ON "WorkKeyShares" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all RecoveryKeyShares" ON "RecoveryKeyShares" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all Challenges" ON "Challenges" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all AnonChallenges" ON "AnonChallenges" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all DevicesAndLocations" ON "DevicesAndLocations" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all Sessions" ON "Sessions" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all ApplicationSessions" ON "ApplicationSessions" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all LoginAttempts" ON "LoginAttempts" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all Organizations" ON "Organizations" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all Teams" ON "Teams" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
CREATE POLICY "Service role access all Memberships" ON "Memberships" 
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- User-specific policies
-- UserProfiles
CREATE POLICY "Users can view their own profile" ON "UserProfiles"
  FOR SELECT USING (auth.uid() = "supId");
CREATE POLICY "Users can update their own profile" ON "UserProfiles"
  FOR UPDATE USING (auth.uid() = "supId");

-- Wallets
CREATE POLICY "Users can view their own wallets" ON "Wallets"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can update their own wallets" ON "Wallets"
  FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own wallets" ON "Wallets"
  FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can delete their own wallets" ON "Wallets"
  FOR DELETE USING (auth.uid() = "userId");

-- WalletActivations
CREATE POLICY "Users can view their own wallet activations" ON "WalletActivations"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own wallet activations" ON "WalletActivations"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- WalletRecoveries
CREATE POLICY "Users can view their own wallet recoveries" ON "WalletRecoveries"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own wallet recoveries" ON "WalletRecoveries"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- WalletExports
CREATE POLICY "Users can view their own wallet exports" ON "WalletExports"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own wallet exports" ON "WalletExports"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- WorkKeyShares
CREATE POLICY "Users can view their own work key shares" ON "WorkKeyShares"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own work key shares" ON "WorkKeyShares"
  FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own work key shares" ON "WorkKeyShares"
  FOR UPDATE USING (auth.uid() = "userId");

-- RecoveryKeyShares
CREATE POLICY "Users can view their own recovery key shares" ON "RecoveryKeyShares"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own recovery key shares" ON "RecoveryKeyShares"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Challenges
CREATE POLICY "Users can view their own challenges" ON "Challenges"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own challenges" ON "Challenges"
  FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own challenges" ON "Challenges"
  FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own challenges" ON "Challenges"
  FOR DELETE USING (auth.uid() = "userId");

-- DevicesAndLocations
CREATE POLICY "Users can view their own devices and locations" ON "DevicesAndLocations"
  FOR SELECT USING (auth.uid() = "userId" OR "userId" IS NULL);
CREATE POLICY "Users can insert devices and locations" ON "DevicesAndLocations"
  FOR INSERT WITH CHECK (auth.uid() = "userId" OR "userId" IS NULL);

-- Sessions
CREATE POLICY "Users can view their own sessions" ON "Sessions"
  FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can update their own sessions" ON "Sessions"
  FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own sessions" ON "Sessions"
  FOR DELETE USING (auth.uid() = "userId");

-- Membership-related policies
-- Organizations
CREATE POLICY "Users can view organizations they are members of" ON "Organizations"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."organizationId" = "Organizations"."id"
      AND "Memberships"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users with owner role can update their organizations" ON "Organizations"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."organizationId" = "Organizations"."id"
      AND "Memberships"."userId" = auth.uid()
      AND "Memberships"."role" = 'OWNER'
    )
  );

-- Teams
CREATE POLICY "Users can view teams they are members of" ON "Teams"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."teamId" = "Teams"."id"
      AND "Memberships"."userId" = auth.uid()
    )
  );

CREATE POLICY "Users with owner/admin role can update their teams" ON "Teams"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."teamId" = "Teams"."id"
      AND "Memberships"."userId" = auth.uid()
      AND "Memberships"."role" IN ('OWNER', 'ADMIN')
    )
  );

-- Applications
CREATE POLICY "Team members can view applications" ON "Applications"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."userId" = auth.uid()
      AND "Memberships"."teamId" = "Applications"."teamId"
    )
  );

CREATE POLICY "Team owners/admins can insert applications" ON "Applications"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."userId" = auth.uid()
      AND "Memberships"."teamId" = NEW."teamId"
      AND "Memberships"."role" IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Team owners/admins can update applications" ON "Applications"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."userId" = auth.uid()
      AND "Memberships"."teamId" = "Applications"."teamId"
      AND "Memberships"."role" IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Team owners/admins can delete applications" ON "Applications"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."userId" = auth.uid()
      AND "Memberships"."teamId" = "Applications"."teamId"
      AND "Memberships"."role" IN ('OWNER', 'ADMIN')
    )
  );

-- Memberships
CREATE POLICY "Users can view memberships they are part of" ON "Memberships"
  FOR SELECT USING (
    "userId" = auth.uid() OR
    EXISTS (
      SELECT 1 FROM "Memberships" AS m
      WHERE m."userId" = auth.uid()
      AND m."organizationId" = "Memberships"."organizationId"
    )
  );

CREATE POLICY "Team owners can manage memberships" ON "Memberships"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Memberships" AS m
      WHERE m."userId" = auth.uid()
      AND m."organizationId" = "Memberships"."organizationId"
      AND m."teamId" = "Memberships"."teamId"
      AND m."role" = 'OWNER'
    )
  );

-- Bills
CREATE POLICY "Users can view bills for their organizations" ON "Bills"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Memberships"
      WHERE "Memberships"."userId" = auth.uid()
      AND "Memberships"."organizationId" = "Bills"."organizationId"
    )
  );

-- Application Sessions
CREATE POLICY "Users can view their own application sessions" ON "ApplicationSessions"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Sessions"
      WHERE "Sessions"."id" = "ApplicationSessions"."sessionId"
      AND "Sessions"."userId" = auth.uid()
    )
  );