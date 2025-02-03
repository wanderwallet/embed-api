import { protectedProcedure } from "@/server/trpc"
import { maskWalletAddress } from "@/server/utils/wallet/wallet.utils";
import { WalletPrivacySetting } from "@prisma/client";

export const fetchWallets = protectedProcedure
  .query(async ({ ctx }) => {
    // TODO: Once we support other chains, we need to add an optional Chain filter and maybe pagination.

    const rawWallets = await ctx.prisma.wallet.findMany({
      where: {
        userId: ctx.user.id,
      },
    });

    // The filtering is only done "just-in-case", as `createWallet` and `updateWallet` already account for
    // `walletPrivacySetting`, so wallets should be stored in the DB as they should be read.

    const wallets = rawWallets.map((wallet) => (
      wallet.walletPrivacySetting === WalletPrivacySetting.PUBLIC ? wallet : {
        ...wallet,
        address: maskWalletAddress(wallet.chain, wallet.address),
        publicKey: null,
      }
    ));

    return {
      wallets,
    };
  });
