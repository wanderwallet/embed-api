 -- Enable Row Level Security on all tables
ALTER TABLE "UserProfiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Developers" ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE "LoginAttempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Passkeys" ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
-- UserProfiles policy
CREATE POLICY "Users can only access their own profiles"
ON "UserProfiles"
FOR ALL
USING (supId = auth.uid());

-- Developers policy
CREATE POLICY "Developers can only access their own data"
ON "Developers"
FOR ALL
USING (userId = auth.uid());

-- Bills policy
CREATE POLICY "Developers can only access their own bills"
ON "Bills"
FOR ALL
USING (developerId IN (SELECT id FROM "Developers" WHERE userId = auth.uid()));

-- Applications policy
CREATE POLICY "Developers can only access their own applications"
ON "Applications"
FOR ALL
USING (developerId IN (SELECT id FROM "Developers" WHERE userId = auth.uid()));

-- Wallets policy
CREATE POLICY "Users can only access their own wallets"
ON "Wallets"
FOR ALL
USING (userId = auth.uid());

-- WalletActivations policy
CREATE POLICY "Users can only access their own wallet activations"
ON "WalletActivations"
FOR ALL
USING (userId = auth.uid());

-- WalletRecoveries policy
CREATE POLICY "Users can only access their own wallet recoveries"
ON "WalletRecoveries"
FOR ALL
USING (userId = auth.uid());

-- WalletExports policy
CREATE POLICY "Users can only access their own wallet exports"
ON "WalletExports"
FOR ALL
USING (userId = auth.uid());

-- WorkKeyShares policy
CREATE POLICY "Users can only access their own work key shares"
ON "WorkKeyShares"
FOR ALL
USING (userId = auth.uid());

-- RecoveryKeyShares policy
CREATE POLICY "Users can only access their own recovery key shares"
ON "RecoveryKeyShares"
FOR ALL
USING (userId = auth.uid());

-- Challenges policy
CREATE POLICY "Users can only access their own challenges"
ON "Challenges"
FOR ALL
USING (userId = auth.uid());

-- AnonChallenges are accessible to anyone (they're anonymous)
CREATE POLICY "AnonChallenges are accessible to anyone"
ON "AnonChallenges"
FOR ALL
USING (true);

-- DevicesAndLocations policy
CREATE POLICY "Users can only access their own devices and locations"
ON "DevicesAndLocations"
FOR ALL
USING (userId = auth.uid() OR userId IS NULL);

-- Sessions policy
CREATE POLICY "Users can only access their own sessions"
ON "Sessions"
FOR ALL
USING (userId = auth.uid());

-- LoginAttempts policy
CREATE POLICY "Users can only access their own login attempts"
ON "LoginAttempts"
FOR ALL
USING (userId = auth.uid());

-- Passkeys policy
CREATE POLICY "Users can only access their own passkeys"
ON "Passkeys"
FOR ALL
USING (userId = auth.uid());