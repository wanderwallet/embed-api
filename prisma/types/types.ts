import { WalletSourceFrom, WalletSourceType, Wallet } from "@prisma/client";

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

export interface DbWallet extends Omit<Wallet, "info" | "source"> {
  info: null | WalletInfo;
  source: null | WalletSource;
}

export interface RecoverableAccount {
  userId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  picture: string | null;
}
