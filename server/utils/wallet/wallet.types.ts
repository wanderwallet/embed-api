import { WalletSourceFrom, WalletSourceType } from "@prisma/client";

export interface WalletSource {
  type?: WalletSourceType;
  from?: WalletSourceFrom;
}

export interface WalletInfo {
  ens: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ensResolution: any;
  ans: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ansResolution: any;
  pns: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pnsResolution: any;
}
