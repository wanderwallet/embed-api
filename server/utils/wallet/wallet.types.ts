import { WalletSourceFrom, WalletSourceType } from "@prisma/client";

export interface WalletSource {
  type?: WalletSourceType;
  from?: WalletSourceFrom;
}
