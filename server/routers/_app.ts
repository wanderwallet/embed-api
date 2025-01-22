import { protectedProcedure, router } from "../trpc";
import { authenticateRouter } from "./authenticate";

export const appRouter = router({
  ...authenticateRouter,
  // TODO: remove this as this is just an example
  protectedRoute: protectedProcedure.query(async ({ ctx }) => {
    return {
      message: `Hello, authenticated user with ID: ${ctx.user.id}`,
      timestamp: new Date().toISOString(),
    };
  }),
  // fakeAuthenticate: protectedProcedure.query(() => {
  //   return { message: "Fake user authenticated successfully." };
  // }),
  // fakeRefreshSession: protectedProcedure
  //   .input(z.enum(["alice", "bob"]))
  //   .query(({ input }) => {
  //     return { message: `Session refreshed for fake user: ${input}` };
  //   }),
  // fetchWallets: protectedProcedure.query(() => {
  //   return { wallets: [] };
  // }),
  // createWallet: protectedProcedure.input(z.object({ userId: z.string(), chain: z.string() })).mutation(({ input }) => {
  //   return { message: 'Wallet created successfully.', wallet: input };
  // }),
  // updateWallet: protectedProcedure.input(z.object({ id: z.string(), data: z.object({}).optional() })).mutation(({ input }) => {
  //   return { message: `Wallet with ID ${input.id} updated successfully.` };
  // }),
  // deleteWallet: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { message: `Wallet with ID ${input} deleted successfully.` };
  // }),
  // generateAuthShareChallenge: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { challenge: `Challenge for wallet ${input}` };
  // }),
  // activateWallet: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { message: `Wallet with ID ${input} activated successfully.` };
  // }),
  // rotateAuthShare: protectedProcedure.input(z.string()).query(({ input }) => {
  //   return { message: `Authentication share for wallet ${input} rotated successfully.` };
  // }),
  // registerRecoveryShare: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { message: `Recovery share registered for wallet ${input}` };
  // }),
  // registerWalletExport: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { message: `Wallet export registered for wallet ${input}` };
  // }),
  // generateShareRecoveryChallenge: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { challenge: `Share recovery challenge for wallet ${input}` };
  // }),
  // recoverWallet: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { message: `Wallet with ID ${input} recovered successfully.` };
  // }),
  // generateWalletRecoveryChallenge: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { challenge: `Account recovery challenge for wallet ${input}` };
  // }),
  // fetchRecoverableAccounts: protectedProcedure.input(z.string()).query(({ input }) => {
  //   return { accounts: [`Recoverable account for wallet ${input}`] };
  // }),
  // generateAccountRecoveryChallenge: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { challenge: `Account recovery confirmation challenge for wallet ${input}` };
  // }),
  // recoverAccount: protectedProcedure.input(z.string()).mutation(({ input }) => {
  //   return { message: `Account with ID ${input} recovered successfully.` };
  // }),
});

export type AppRouter = typeof appRouter;
