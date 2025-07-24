import * as _prisma_client from '@prisma/client';
import { Wallet, WalletSourceType, WalletSourceFrom, Session as Session$1, Challenge, AnonChallenge } from '@prisma/client';
export { AuthProviderType, Chain, Challenge as DbChallenge, Session as DbSession, UserProfile as DbUserProfile, ExportType, WalletPrivacySetting, WalletSourceFrom, WalletSourceType, WalletStatus } from '@prisma/client';
import * as _supabase_supabase_js from '@supabase/supabase-js';
import { Session, User, Provider, SupabaseClientOptions } from '@supabase/supabase-js';
export { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { JwtPayload } from 'jwt-decode';
import * as _trpc_server from '@trpc/server';
import * as _trpc_server_unstable_core_do_not_import from '@trpc/server/unstable-core-do-not-import';
import * as _prisma_client_runtime_library from '@prisma/client/runtime/library';
import * as _trpc_client from '@trpc/client';
import { JWKInterface } from 'arweave/node/lib/wallet';

interface WalletSource {
    type?: WalletSourceType;
    from?: WalletSourceFrom;
}
interface WalletInfo {
    ens: string;
    ensResolution: any;
    ans: string;
    ansResolution: any;
    pns: string;
    pnsResolution: any;
}
interface DbWallet extends Omit<Wallet, "info" | "source"> {
    info: null | WalletInfo;
    source: null | WalletSource;
}
interface RecoverableAccount {
    userId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    picture: string | null;
}

interface SupabaseUserMetadata {
    hasPassword?: boolean;
    email_verified?: boolean;
    phone_verified?: boolean;
    email?: string;
    user_name?: string;
    preferred_username?: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
    picture?: string;
}
interface SupabaseUser extends User {
    user_metadata: SupabaseUserMetadata;
}
interface SupabaseSession extends Session {
    user: SupabaseUser;
}

type SupabaseJwtSessionData = Omit<Session$1, "id" | "userId">;
type SupabaseJwtSessionHeaders = Pick<SupabaseJwtSessionData, "userAgent" | "deviceNonce" | "ip">;
type SupabaseProvider = Extract<Provider, "google" | "facebook" | "twitter" | "apple">;
interface SupabaseJwtPayload extends JwtPayload {
    session_id: string;
    sessionData: SupabaseJwtSessionData;
    app_metadata: {
        provider: SupabaseProvider | "email";
        providers: (SupabaseProvider | "email")[];
    };
}

declare function createAnonSession(sessionHeaders: SupabaseJwtSessionHeaders): Session$1;

declare const ErrorMessages: {
    readonly WALLET_NOT_FOUND: "Wallet not found.";
    readonly WALLET_CANNOT_BE_ENABLED: "Wallet cannot be enabled.";
    readonly WALLET_CANNOT_BE_DISABLED: "Wallet cannot be disabled.";
    readonly WALLET_NO_PRIVACY_SUPPORT: "Wallet does not support the privacy setting.";
    readonly WALLET_ADDRESS_MISMATCH: "Wallet address mismatch.";
    readonly WALLET_NOT_VALID_FOR_ACCOUNT_RECOVERY: "Wallet cannot be used for account recovery.";
    readonly WALLET_MISSING_PUBLIC_KEY: "Wallet is missing public key.";
    readonly WORK_SHARE_NOT_FOUND: "Work share not found.";
    readonly WORK_SHARE_INVALIDATED: "Work share invalidated.";
    readonly RECOVERY_SHARE_NOT_FOUND: "Recovery share not found.";
    readonly INVALID_SHARE: "Invalid share.";
    readonly CHALLENGE_NOT_FOUND: "Challenge not found. It might have been resolved already, or it might have expired.";
    readonly CHALLENGE_INVALID: "Invalid challenge.";
    readonly CHALLENGE_EXPIRED: "Challenge expired.";
    readonly CHALLENGE_IP_MISMATCH: "Challenge IP mismatch.";
    readonly CHALLENGE_MISSING_PK: "Missing public key.";
    readonly CHALLENGE_UNEXPECTED_ERROR: "Unexpected error validating challenge.";
    readonly RECOVERY_ACCOUNTS_NOT_FOUND: "No recoverable accounts found.";
    readonly RECOVERY_WALLETS_NOT_FOUND: "No recoverable account wallets found.";
    readonly RECOVERY_MISSING_PUBLIC_KEY: "Missing public key.";
    readonly NO_OP: "This request is a no-op.";
};

declare const appRouter: _trpc_server_unstable_core_do_not_import.BuiltRouter<{
    ctx: {
        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        clientId: null;
        user: _supabase_supabase_js.AuthUser;
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            deviceNonce: string;
            ip: string;
            userAgent: string;
        };
    } | {
        prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
        clientId: string;
        user: _supabase_supabase_js.AuthUser;
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            deviceNonce: string;
            ip: string;
            userAgent: string;
        };
    };
    meta: object;
    errorShape: _trpc_server_unstable_core_do_not_import.DefaultErrorShape;
    transformer: true;
}, _trpc_server_unstable_core_do_not_import.DecorateCreateRouterOptions<{
    fetchWallets: _trpc_server.TRPCQueryProcedure<{
        input: void;
        output: {
            wallets: DbWallet[];
        };
    }>;
    createPublicWallet: _trpc_server.TRPCMutationProcedure<{
        input: {
            status: "ENABLED" | "DISABLED";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey: string;
            walletPrivacySetting: "PUBLIC";
            canRecoverAccountSetting: boolean;
            source: {
                type: "IMPORTED" | "GENERATED";
                from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
            };
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    createPrivateWallet: _trpc_server.TRPCMutationProcedure<{
        input: {
            status: "ENABLED" | "DISABLED";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            walletPrivacySetting: "PRIVATE";
            source: {
                type: "IMPORTED" | "GENERATED";
                from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
            };
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    createReadOnlyWallet: _trpc_server.TRPCMutationProcedure<{
        input: {
            status: "READONLY" | "LOST";
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey?: string | undefined;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    makeWalletPrivate: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletPrivacySetting: "PRIVATE";
            walletId: string;
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    makeWalletPublic: _trpc_server.TRPCMutationProcedure<{
        input: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            publicKey: string;
            walletPrivacySetting: "PUBLIC";
            walletId: string;
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    updateWalletInfo: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
            identifierTypeSetting?: "ALIAS" | "ANS" | "PNS" | undefined;
            aliasSetting?: string | undefined;
            descriptionSetting?: string | undefined;
            tagsSetting?: string[] | undefined;
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    updateWalletRecovery: _trpc_server.TRPCMutationProcedure<{
        input: {
            canRecoverAccountSetting: boolean;
            walletId: string;
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    updateWalletStatus: _trpc_server.TRPCMutationProcedure<{
        input: {
            status: "ENABLED" | "DISABLED" | "READONLY" | "LOST";
            walletId: string;
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    deleteWallet: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
        };
        output: {};
    }>;
    generateWalletActivationChallenge: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
        };
        output: {
            activationChallenge: {
                id: string;
                createdAt: Date;
                userId: string;
                ip: string;
                walletId: string;
                type: _prisma_client.$Enums.ChallengeType;
                purpose: _prisma_client.$Enums.ChallengePurpose;
                value: string;
                version: string;
            };
        };
    }>;
    activateWallet: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
            challengeSolution: string;
        };
        output: {
            wallet: DbWallet;
            authShare: string;
            rotationChallenge: {
                id: string;
                createdAt: Date;
                userId: string;
                ip: string;
                walletId: string;
                type: _prisma_client.$Enums.ChallengeType;
                purpose: _prisma_client.$Enums.ChallengePurpose;
                value: string;
                version: string;
            } | null;
        };
    }>;
    rotateAuthShare: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            challengeSolution: string;
        };
        output: {
            nextRotationAt: Date;
        };
    }>;
    registerRecoveryShare: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
            recoveryAuthShare: string;
            recoveryBackupShareHash: string;
            recoveryBackupSharePublicKey: string;
        };
        output: {
            wallet: DbWallet;
            recoveryFileServerSignature: string;
        };
    }>;
    registerWalletExport: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
            type: "SEEDPHRASE" | "KEYFILE";
        };
        output: {
            wallet: DbWallet;
        };
    }>;
    generateWalletRecoveryChallenge: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
            recoveryBackupShareHash?: string | undefined;
        };
        output: {
            shareRecoveryChallenge: {
                id: string;
                createdAt: Date;
                userId: string;
                ip: string;
                walletId: string;
                type: _prisma_client.$Enums.ChallengeType;
                purpose: _prisma_client.$Enums.ChallengePurpose;
                value: string;
                version: string;
            };
        };
    }>;
    recoverWallet: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
            challengeSolution: string;
            recoveryBackupShareHash?: string | undefined;
            recoveryFileServerSignature?: string | undefined;
        };
        output: {
            recoveryAuthShare: null;
            recoveryBackupServerPublicKey: string;
            wallet?: undefined;
            rotationChallenge?: undefined;
        } | {
            wallet: DbWallet;
            recoveryAuthShare: string | undefined;
            rotationChallenge: {
                id: string;
                createdAt: Date;
                userId: string;
                ip: string;
                walletId: string;
                type: _prisma_client.$Enums.ChallengeType;
                purpose: _prisma_client.$Enums.ChallengePurpose;
                value: string;
                version: string;
            };
            recoveryBackupServerPublicKey?: undefined;
        };
    }>;
    registerAuthShare: _trpc_server.TRPCMutationProcedure<{
        input: {
            walletId: string;
            authShare: string;
            deviceShareHash: string;
            deviceSharePublicKey: string;
            challengeSolution: string;
        };
        output: {
            wallet: DbWallet;
            nextRotationAt: Date;
        };
    }>;
    generateFetchRecoverableAccountsChallenge: _trpc_server.TRPCMutationProcedure<{
        input: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
        };
        output: {
            fetchRecoverableWalletsChallenge: {
                id: string;
                createdAt: Date;
                chain: _prisma_client.$Enums.Chain;
                address: string;
                ip: string;
                value: string;
                version: string;
            };
        };
    }>;
    fetchRecoverableAccounts: _trpc_server.TRPCMutationProcedure<{
        input: {
            challengeId: string;
            challengeSolution: string;
        };
        output: {
            recoverableAccounts: RecoverableAccount[];
        };
    }>;
    fetchRecoverableAccountWallets: _trpc_server.TRPCMutationProcedure<{
        input: {
            userId: string;
            challengeId: string;
            challengeSolution: string;
        };
        output: {
            recoverableAccountWallets: {
                canBeRecovered: boolean;
                address: string;
            }[];
        };
    }>;
    generateAccountRecoveryChallenge: _trpc_server.TRPCMutationProcedure<{
        input: {
            chain: "ARWEAVE" | "ETHEREUM";
            address: string;
            userId: string;
        };
        output: {
            accountRecoveryChallenge: {
                id: string;
                createdAt: Date;
                userId: string;
                ip: string;
                walletId: string;
                type: _prisma_client.$Enums.ChallengeType;
                purpose: _prisma_client.$Enums.ChallengePurpose;
                value: string;
                version: string;
            };
        };
    }>;
    recoverAccount: _trpc_server.TRPCMutationProcedure<{
        input: {
            userId: string;
            challengeSolution: string;
        };
        output: {
            userDetails: {
                userDetails: {
                    name: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string | null;
                    supId: string;
                    supEmail: string | null;
                    supPhone: string | null;
                    phone: string | null;
                    picture: string | null;
                    recoveredAt: Date | null;
                    userDetailsRecoveryPrivacy: _prisma_client.$Enums.UserDetailsPrivacySetting[];
                    notificationsSetting: _prisma_client.$Enums.NotificationSetting;
                    recoveryWalletsRequiredSetting: number;
                    ipPrivacyFilterSetting: _prisma_client.$Enums.FilterPrivacySetting | null;
                    countryPrivacySetting: _prisma_client.$Enums.FilterPrivacySetting | null;
                };
            };
        };
    }>;
    validateApplication: _trpc_server.TRPCQueryProcedure<{
        input: {
            clientId: string;
            applicationOrigin: string;
            sessionId?: string | undefined;
        };
        output: string;
    }>;
    debugSession: _trpc_server.TRPCQueryProcedure<{
        input: void;
        output: {
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            };
        };
    }>;
    authenticate: _trpc_server.TRPCMutationProcedure<{
        input: {
            email: string;
            authProviderType: "EMAIL_N_PASSWORD";
            password: string;
        } | {
            authProviderType: "PASSKEYS" | "GOOGLE" | "FACEBOOK" | "X" | "APPLE";
        };
        output: {
            user: _supabase_supabase_js.AuthUser;
            url: null;
            data?: undefined;
        } | {
            user: null;
            data: string;
            url?: undefined;
        };
    }>;
    getUser: _trpc_server.TRPCQueryProcedure<{
        input: void;
        output: {
            user: _supabase_supabase_js.AuthUser | null;
        };
    }>;
    logout: _trpc_server.TRPCMutationProcedure<{
        input: void;
        output: {
            success: boolean;
            message: string;
        };
    }>;
    refreshSession: _trpc_server.TRPCMutationProcedure<{
        input: void;
        output: {
            message: string;
            user: _supabase_supabase_js.AuthUser;
            session: {
                expires_at: number | undefined;
                expires_in: number;
            };
        };
    }>;
}>>;
type AppRouter = typeof appRouter;

interface CreateTRPCClientOptions {
    baseURL?: string;
    trpcURL?: string;
    authToken?: string | null;
    deviceNonce?: string;
    clientId?: string;
    onAuthError?: () => void;
}
declare function createTRPCClient({ baseURL, trpcURL, onAuthError, ...params }: CreateTRPCClientOptions): {
    client: _trpc_client.TRPCClient<_trpc_server_unstable_core_do_not_import.BuiltRouter<{
        ctx: {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            clientId: null;
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            };
        } | {
            prisma: _prisma_client.PrismaClient<_prisma_client.Prisma.PrismaClientOptions, never, _prisma_client_runtime_library.DefaultArgs>;
            clientId: string;
            user: _supabase_supabase_js.AuthUser;
            session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                deviceNonce: string;
                ip: string;
                userAgent: string;
            };
        };
        meta: object;
        errorShape: _trpc_server_unstable_core_do_not_import.DefaultErrorShape;
        transformer: true;
    }, _trpc_server_unstable_core_do_not_import.DecorateCreateRouterOptions<{
        fetchWallets: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                wallets: DbWallet[];
            };
        }>;
        createPublicWallet: _trpc_server.TRPCMutationProcedure<{
            input: {
                status: "ENABLED" | "DISABLED";
                chain: "ARWEAVE" | "ETHEREUM";
                address: string;
                publicKey: string;
                walletPrivacySetting: "PUBLIC";
                canRecoverAccountSetting: boolean;
                source: {
                    type: "IMPORTED" | "GENERATED";
                    from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
                };
                authShare: string;
                deviceShareHash: string;
                deviceSharePublicKey: string;
                aliasSetting?: string | undefined;
                descriptionSetting?: string | undefined;
                tagsSetting?: string[] | undefined;
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        createPrivateWallet: _trpc_server.TRPCMutationProcedure<{
            input: {
                status: "ENABLED" | "DISABLED";
                chain: "ARWEAVE" | "ETHEREUM";
                address: string;
                walletPrivacySetting: "PRIVATE";
                source: {
                    type: "IMPORTED" | "GENERATED";
                    from: "SEEDPHRASE" | "KEYFILE" | "BINARY";
                };
                authShare: string;
                deviceShareHash: string;
                deviceSharePublicKey: string;
                aliasSetting?: string | undefined;
                descriptionSetting?: string | undefined;
                tagsSetting?: string[] | undefined;
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        createReadOnlyWallet: _trpc_server.TRPCMutationProcedure<{
            input: {
                status: "READONLY" | "LOST";
                chain: "ARWEAVE" | "ETHEREUM";
                address: string;
                publicKey?: string | undefined;
                aliasSetting?: string | undefined;
                descriptionSetting?: string | undefined;
                tagsSetting?: string[] | undefined;
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        makeWalletPrivate: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletPrivacySetting: "PRIVATE";
                walletId: string;
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        makeWalletPublic: _trpc_server.TRPCMutationProcedure<{
            input: {
                chain: "ARWEAVE" | "ETHEREUM";
                address: string;
                publicKey: string;
                walletPrivacySetting: "PUBLIC";
                walletId: string;
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        updateWalletInfo: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
                identifierTypeSetting?: "ALIAS" | "ANS" | "PNS" | undefined;
                aliasSetting?: string | undefined;
                descriptionSetting?: string | undefined;
                tagsSetting?: string[] | undefined;
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        updateWalletRecovery: _trpc_server.TRPCMutationProcedure<{
            input: {
                canRecoverAccountSetting: boolean;
                walletId: string;
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        updateWalletStatus: _trpc_server.TRPCMutationProcedure<{
            input: {
                status: "ENABLED" | "DISABLED" | "READONLY" | "LOST";
                walletId: string;
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        deleteWallet: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
            };
            output: {};
        }>;
        generateWalletActivationChallenge: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
            };
            output: {
                activationChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    ip: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    value: string;
                    version: string;
                };
            };
        }>;
        activateWallet: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
                challengeSolution: string;
            };
            output: {
                wallet: DbWallet;
                authShare: string;
                rotationChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    ip: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    value: string;
                    version: string;
                } | null;
            };
        }>;
        rotateAuthShare: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
                authShare: string;
                deviceShareHash: string;
                deviceSharePublicKey: string;
                challengeSolution: string;
            };
            output: {
                nextRotationAt: Date;
            };
        }>;
        registerRecoveryShare: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
                recoveryAuthShare: string;
                recoveryBackupShareHash: string;
                recoveryBackupSharePublicKey: string;
            };
            output: {
                wallet: DbWallet;
                recoveryFileServerSignature: string;
            };
        }>;
        registerWalletExport: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
                type: "SEEDPHRASE" | "KEYFILE";
            };
            output: {
                wallet: DbWallet;
            };
        }>;
        generateWalletRecoveryChallenge: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
                recoveryBackupShareHash?: string | undefined;
            };
            output: {
                shareRecoveryChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    ip: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    value: string;
                    version: string;
                };
            };
        }>;
        recoverWallet: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
                challengeSolution: string;
                recoveryBackupShareHash?: string | undefined;
                recoveryFileServerSignature?: string | undefined;
            };
            output: {
                recoveryAuthShare: null;
                recoveryBackupServerPublicKey: string;
                wallet?: undefined;
                rotationChallenge?: undefined;
            } | {
                wallet: DbWallet;
                recoveryAuthShare: string | undefined;
                rotationChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    ip: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    value: string;
                    version: string;
                };
                recoveryBackupServerPublicKey?: undefined;
            };
        }>;
        registerAuthShare: _trpc_server.TRPCMutationProcedure<{
            input: {
                walletId: string;
                authShare: string;
                deviceShareHash: string;
                deviceSharePublicKey: string;
                challengeSolution: string;
            };
            output: {
                wallet: DbWallet;
                nextRotationAt: Date;
            };
        }>;
        generateFetchRecoverableAccountsChallenge: _trpc_server.TRPCMutationProcedure<{
            input: {
                chain: "ARWEAVE" | "ETHEREUM";
                address: string;
            };
            output: {
                fetchRecoverableWalletsChallenge: {
                    id: string;
                    createdAt: Date;
                    chain: _prisma_client.$Enums.Chain;
                    address: string;
                    ip: string;
                    value: string;
                    version: string;
                };
            };
        }>;
        fetchRecoverableAccounts: _trpc_server.TRPCMutationProcedure<{
            input: {
                challengeId: string;
                challengeSolution: string;
            };
            output: {
                recoverableAccounts: RecoverableAccount[];
            };
        }>;
        fetchRecoverableAccountWallets: _trpc_server.TRPCMutationProcedure<{
            input: {
                userId: string;
                challengeId: string;
                challengeSolution: string;
            };
            output: {
                recoverableAccountWallets: {
                    canBeRecovered: boolean;
                    address: string;
                }[];
            };
        }>;
        generateAccountRecoveryChallenge: _trpc_server.TRPCMutationProcedure<{
            input: {
                chain: "ARWEAVE" | "ETHEREUM";
                address: string;
                userId: string;
            };
            output: {
                accountRecoveryChallenge: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    ip: string;
                    walletId: string;
                    type: _prisma_client.$Enums.ChallengeType;
                    purpose: _prisma_client.$Enums.ChallengePurpose;
                    value: string;
                    version: string;
                };
            };
        }>;
        recoverAccount: _trpc_server.TRPCMutationProcedure<{
            input: {
                userId: string;
                challengeSolution: string;
            };
            output: {
                userDetails: {
                    userDetails: {
                        name: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string | null;
                        supId: string;
                        supEmail: string | null;
                        supPhone: string | null;
                        phone: string | null;
                        picture: string | null;
                        recoveredAt: Date | null;
                        userDetailsRecoveryPrivacy: _prisma_client.$Enums.UserDetailsPrivacySetting[];
                        notificationsSetting: _prisma_client.$Enums.NotificationSetting;
                        recoveryWalletsRequiredSetting: number;
                        ipPrivacyFilterSetting: _prisma_client.$Enums.FilterPrivacySetting | null;
                        countryPrivacySetting: _prisma_client.$Enums.FilterPrivacySetting | null;
                    };
                };
            };
        }>;
        validateApplication: _trpc_server.TRPCQueryProcedure<{
            input: {
                clientId: string;
                applicationOrigin: string;
                sessionId?: string | undefined;
            };
            output: string;
        }>;
        debugSession: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                user: _supabase_supabase_js.AuthUser;
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    deviceNonce: string;
                    ip: string;
                    userAgent: string;
                };
            };
        }>;
        authenticate: _trpc_server.TRPCMutationProcedure<{
            input: {
                email: string;
                authProviderType: "EMAIL_N_PASSWORD";
                password: string;
            } | {
                authProviderType: "PASSKEYS" | "GOOGLE" | "FACEBOOK" | "X" | "APPLE";
            };
            output: {
                user: _supabase_supabase_js.AuthUser;
                url: null;
                data?: undefined;
            } | {
                user: null;
                data: string;
                url?: undefined;
            };
        }>;
        getUser: _trpc_server.TRPCQueryProcedure<{
            input: void;
            output: {
                user: _supabase_supabase_js.AuthUser | null;
            };
        }>;
        logout: _trpc_server.TRPCMutationProcedure<{
            input: void;
            output: {
                success: boolean;
                message: string;
            };
        }>;
        refreshSession: _trpc_server.TRPCMutationProcedure<{
            input: void;
            output: {
                message: string;
                user: _supabase_supabase_js.AuthUser;
                session: {
                    expires_at: number | undefined;
                    expires_in: number;
                };
            };
        }>;
    }>>>;
    getAuthTokenHeader: () => string | null;
    setAuthTokenHeader: (nextAuthToken: string | null) => void;
    getDeviceNonceHeader: () => string;
    setDeviceNonceHeader: (nextDeviceNonce: string) => void;
    getClientIdHeader: () => string;
    setClientIdHeader: (nextClientId: string) => void;
};

declare function createSupabaseClient(supabaseUrl?: string, supabaseKey?: string, supabaseOptions?: SupabaseClientOptions<"public">): _supabase_supabase_js.SupabaseClient<any, "public", any>;

type ChallengeClientVersion = `v${number}`;
type ChallengeSolutionWithVersion = `${ChallengeClientVersion}.${string}`;
interface ChallengeData {
    challenge: Challenge | AnonChallenge;
    session: Session$1;
    shareHash: null | string;
}
interface SolveChallengeParams<T> extends ChallengeData {
    privateKey?: T;
}
interface VerifyChallengeParams extends ChallengeData {
    now: number;
    solution: string;
    publicKey: null | string;
}
interface ChallengeClient<T> {
    version: ChallengeClientVersion;
    ttlMs: number;
    ttlRotationMs: number;
    getChallengeRawData: (data: ChallengeData) => string;
    solveChallenge: (params: SolveChallengeParams<T>) => Promise<ChallengeSolutionWithVersion>;
    verifyChallenge: (params: VerifyChallengeParams) => Promise<string | null>;
}

declare function solveChallenge({ challenge, session, shareHash, privateKey, }: SolveChallengeParams<JWKInterface | Uint8Array>): Promise<string>;

declare const ChallengeClientV1: ChallengeClient<JWKInterface>;

/**
 * IMPORTANT NOTE: Cryptographically relevant quantum computer, if built, will allow to break elliptic curve
 * cryptography (both ECDSA / EdDSA & ECDH) using Shor's algorithm.
 *
 * Consider switching to newer / hybrid algorithms, such as SPHINCS+. They are available in noble-post-quantum.
 *
 * NIST prohibits classical cryptography (RSA, DSA, ECDSA, ECDH) after 2035. Australian ASD prohibits it after 2030.
 *
 * @see https://github.com/paulmillr/noble-curves?tab=readme-ov-file#quantum-computers
 * @see https://github.com/paulmillr/noble-post-quantum
 */
declare const ChallengeClientV2: ChallengeClient<Uint8Array>;

export { type AppRouter, ChallengeClientV1, ChallengeClientV2, type ChallengeClientVersion, type ChallengeData, type ChallengeSolutionWithVersion, type DbWallet, ErrorMessages, type RecoverableAccount, type SolveChallengeParams, type SupabaseJwtPayload, type SupabaseJwtSessionData, type SupabaseJwtSessionHeaders, type SupabaseProvider, type SupabaseSession, type SupabaseUser, type SupabaseUserMetadata, type WalletInfo, type WalletSource, createAnonSession, createSupabaseClient, createTRPCClient, solveChallenge };
