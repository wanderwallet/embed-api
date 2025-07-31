/*

Find users with more than 1 ACTIVE wallet and deletes all but the last one.

The current app doesn't allow users to create more than one wallet. All instances of that were a consequence of the frontend creating a new wallet as part of
the recovery flow, and then failing to update the existing wallets status. That flow now occurs atomically on the backend, instead of being (incorrectly)
orchestrated from the frontend.

*/

WITH UserWalletsToDelete AS (
  SELECT
    w."userId",
    w."id",
    -- Mark all wallets except the newest one for each user as "should be deleted"
    CASE WHEN ROW_NUMBER() OVER (PARTITION BY w."userId" ORDER BY w."createdAt" DESC) > 1
         THEN TRUE
         ELSE FALSE
    END AS "shouldBeDeleted"
  FROM public."Wallets" w
)
DELETE FROM public."Wallets"
WHERE "id" IN (
  SELECT "id"
  FROM UserWalletsToDelete
  WHERE "shouldBeDeleted" = TRUE
);
