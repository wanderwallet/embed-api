/*

Deletes all wallets with `status = "LOST"`, as the current app doesn't allow users to have anything else other than 1 active wallet, and those cannot be
activated anyway.

All wallets with `status = "LOST"` were created when the wallet creation during recovery was introduced, but later on that functionality was refined to simply
delete previous wallets, at least until the UI supports multiple wallets with different statuses.

*/

DELETE FROM public."Wallets"
WHERE status = 'LOST';
